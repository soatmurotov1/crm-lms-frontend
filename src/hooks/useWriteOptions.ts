import { useContext } from 'react';
import { useQuery, QueryClientContext } from '@tanstack/react-query';
import { queryClient } from '@/lib/queryClient';
import type { PermissionCatalogue } from '@/features/staff/types';
import axios from '@/api/axiosInstance';
import { parseItemEnvelope } from '@/lib/apiEnvelope';
import { accessQueryScope } from '@/lib/queryKeys';
import { useAuthStore } from '@/store/authStore';
import { userCan } from '@/lib/permissions';
import type { Course } from '@/features/courses/types';
import type { Group } from '@/features/groups/types';

export type CourseOption = Pick<
  Course,
  | 'id'
  | 'name'
  | 'branch_id'
  | 'course_type'
  | 'price'
  | 'duration_days'
  | 'is_active'
>;
export type GroupOption = Pick<
  Group,
  'id' | 'name' | 'branch_id' | 'course_type' | 'is_active'
> & { branch_name?: string };
export interface WriteOptions {
  branches?: { id: string; name: string }[];
  courses?: CourseOption[];
  groups?: GroupOption[];
  custodians?: { id: string; name: string; role: string }[];
  teachers?: {
    id: string;
    name: string;
    branch_id: string;
    specialization?: string;
  }[];
  students?: {
    id: string;
    first_name: string;
    last_name: string;
    branch_id: string;
    course_type?: 'online' | 'offline';
    group_name?: string | null;
    phone_last4?: string | null;
    total_price?: number;
    amount_paid?: number;
  }[];
  /** Matching students before `limit` (payment lookups). */
  students_total?: number;
}

/** Server-side narrowing for student lookups (backend #277). */
export interface WriteOptionsLookup {
  search?: string;
  course_type?: 'online' | 'offline';
  limit?: number;
}

/** Write lookups are minimal and independently authorized; they never grant read access. */
export const useWriteOptions = (
  resource: string,
  action: 'create' | 'update',
  branchId?: string | null,
  enabled = true,
  lookup?: WriteOptionsLookup,
) => {
  const user = useAuthStore((state) => state.user);
  const activeBranchId = useAuthStore((state) => state.activeBranchId);
  const requestedBranchId =
    branchId ?? activeBranchId ?? user?.branch_ids?.[0] ?? user?.branch_id;
  const scoped = user?.permissions !== undefined;
  const client = useContext(QueryClientContext) ?? queryClient;
  const catalogue = useQuery(
    {
      queryKey: ['permissions', user?.id, user?.access_version],
      enabled: scoped && enabled,
      queryFn: async ({ signal }) =>
        parseItemEnvelope<PermissionCatalogue>(
          (await axios.get('/permissions', { signal })).data,
          'permissions',
        ),
    },
    client,
  );
  const branches =
    catalogue.data?.branches.filter((branch) =>
      userCan(user, `${resource}.${action}`, branch.id),
    ) ?? [];
  const selectedBranchId =
    requestedBranchId ?? (branches.length === 1 ? branches[0].id : undefined);
  const search = lookup?.search?.trim();
  const lookupParams = {
    ...(search ? { search } : {}),
    ...(lookup?.course_type ? { course_type: lookup.course_type } : {}),
    ...(lookup?.limit ? { limit: lookup.limit } : {}),
  };
  const canLoadOptions =
    scoped &&
    enabled &&
    !!selectedBranchId &&
    userCan(user, `${resource}.${action}`, selectedBranchId);
  const query = useQuery(
    {
      queryKey: [
        'permission-options',
        resource,
        action,
        selectedBranchId,
        lookupParams,
        ...accessQueryScope(),
      ],
      enabled: canLoadOptions,
      queryFn: async ({ signal }) =>
        parseItemEnvelope<WriteOptions>(
          (
            await axios.get('/permissions/options', {
              params: {
                resource,
                action,
                branchId: selectedBranchId,
                ...lookupParams,
              },
              signal,
            })
          ).data,
          'permission-options',
        ),
    },
    client,
  );
  return {
    ...query,
    // Disabling a query does not clear its cache. A revoked grant must not
    // leave previously authorized choices available to a write form.
    data: canLoadOptions ? query.data : undefined,
    isFetching: query.isFetching || catalogue.isFetching,
    isError: query.isError || catalogue.isError,
    refetch: catalogue.isError ? catalogue.refetch : query.refetch,
    scoped,
    selectedBranchId,
    branches: catalogue.data
      ? branches
      : ((canLoadOptions ? query.data?.branches : undefined)?.filter((branch) =>
          userCan(user, `${resource}.${action}`, branch.id),
        ) ?? []),
  };
};
