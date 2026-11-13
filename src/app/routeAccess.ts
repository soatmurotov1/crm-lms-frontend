import { userCan, type Capability } from '@/lib/permissions';
import type { User } from '@/features/staff/types';

export const ROUTE_CAPABILITIES = {
  '/dashboard': 'viewDashboard',
  '/expenses': 'viewExpenses',
  '/expenses/$id': 'viewExpenses',
  '/schedule': 'accessOperations',
  '/attendance': 'accessOperations',
  '/groups': 'accessOperations',
  '/groups/$id': 'accessOperations',
  '/students': 'accessOperations',
  '/students/$id': 'accessOperations',
  '/leads': 'accessLeads',
  '/leads/$id': 'accessLeads',
  '/branches': 'manageBranches',
  '/branches/$id': 'manageBranches',
  '/courses': 'manageStaff',
  '/courses/$id': 'manageStaff',
  '/payments': 'viewPayments',
  '/teachers': 'manageStaff',
  '/users': 'manageUsers',
  '/design-system': 'manageUsers',
  // Managers intentionally reach a staff detail from teacher lists
  // even though the company-wide /users list remains owner/dev only.
  '/users/$id': 'manageStaff',
  '/documents': 'viewDocuments',
  '/subjects': 'viewLearning',
  '/assignments': 'viewLearning',
  '/assignments/$id': 'viewLearning',
  '/exams': 'viewLearning',
  '/exams/$id': 'viewLearning',
  '/grades': 'viewLearning',
  '/audit': 'viewAudit',
  '/audit/$id': 'viewAudit',
} as const satisfies Record<string, Capability>;

export type CapabilityRoutePath = keyof typeof ROUTE_CAPABILITIES;

export const ROUTE_PERMISSIONS: Partial<
  Record<CapabilityRoutePath, `${string}.${string}`>
> = {
  '/students': 'students.read',
  '/students/$id': 'students.read',
  '/groups': 'groups.read',
  '/groups/$id': 'groups.read',
  '/schedule': 'schedule.read',
  '/attendance': 'attendance.read',
  '/courses': 'courses.read',
  '/courses/$id': 'courses.read',
  '/branches': 'branches.read',
  '/branches/$id': 'branches.read',
  '/teachers': 'staff.read',
  '/users': 'staff.read',
  '/users/$id': 'staff.read',
  '/documents': 'documents.read',
  '/subjects': 'subjects.read',
  '/assignments': 'assignments.read',
  '/assignments/$id': 'assignments.read',
  '/exams': 'exams.read',
  '/exams/$id': 'exams.read',
  '/grades': 'grades.read',
};

const CREATE_ROUTE_PERMISSIONS: Partial<
  Record<CapabilityRoutePath, `${string}.${string}`>
> = {
  '/students': 'students.create',
  '/groups': 'groups.create',
  '/users': 'staff.create',
  '/teachers': 'staff.create',
  '/branches': 'branches.create',
  '/courses': 'courses.create',
  '/expenses': 'expenses.create',
  '/payments': 'payments.create',
  '/schedule': 'schedule.create',
  '/attendance': 'lessons.create',
  '/leads': 'leads.create',
  '/documents': 'documents.create',
  '/subjects': 'subjects.create',
  '/assignments': 'assignments.create',
  '/exams': 'exams.create',
};

/** A write-only user may open the list shell to create; detail routes still require read. */
export function canAccessRoute(
  user: User | null,
  path: string,
  capability: Capability,
  branchId?: string | null,
) {
  if (user?.permissions === undefined)
    return userCan(user, capability, branchId);
  const routePath = (
    path in ROUTE_CAPABILITIES ? path : path.replace(/\/[^/]+$/, '/$id')
  ) as CapabilityRoutePath;
  const create = CREATE_ROUTE_PERMISSIONS[routePath];
  return (
    userCan(user, ROUTE_PERMISSIONS[routePath] ?? capability, branchId) ||
    (!!create && userCan(user, create, branchId))
  );
}
