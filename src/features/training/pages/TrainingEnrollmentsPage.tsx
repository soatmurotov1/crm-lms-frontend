import { requestBranchId, userCan } from '@/lib/permissions';
import { useWriteOptions } from '@/hooks/useWriteOptions';
import {
  useMemo,
  useState,
  useCallback,
  useId,
  useEffect,
  useRef,
  type FormEvent,
} from 'react';
import { usePermissionQuery as useQuery } from '@/hooks/usePermissionQuery';
import { useNavigate } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';
import { CaretRight, GraduationCap, Plus } from '@phosphor-icons/react';
import { toast } from 'sonner';
import { useAuthStore } from '@/store/authStore';
import { useCan } from '@/hooks/useCan';
import { useListQueryState } from '@/hooks/useListQueryState';
import { matchesListQuery } from '@/lib/listQuery';
import { ListSearchField } from '@/components/ui/ListSearchField';
import { useDebounce } from '@/hooks/useDebounce';
import { useBranches } from '@/features/branches/api/branchService';
import { searchStudents } from '@/features/students/api/studentService';
import {
  useActiveTrainingPrograms,
  useCreateTrainingEnrollment,
  useTrainingEnrollmentsPage,
} from '@/features/training/api/trainingService';
import { studentKeys } from '@/lib/queryKeys';
import { extractErrorMessage } from '@/lib/errors';
import type {
  TrainingEnrollment,
  TrainingEnrollmentStatus,
} from '@/features/training/types';
import { PageHeader } from '@/components/layout/PageHeader';
import { DataCard } from '@/components/ui/DataCard';
import { EmptyState } from '@/components/ui/EmptyState';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { DataGrid, createDataGridColumnHelper } from '@/shared/ui/data-grid';

const selectClass =
  'h-10 w-full rounded-md border border-input bg-background px-3 text-sm';

const enrollmentColumnHelper = createDataGridColumnHelper<TrainingEnrollment>();

type EnrollmentDialogProps = {
  open: boolean;
  branches: Array<{ id: string; name: string }>;
  ownBranchId?: string;
  canViewAll: boolean;
  onClose: () => void;
  returnFocus: () => void;
};

const EnrollmentDialogForm = ({
  open,
  branches,
  ownBranchId,
  canViewAll,
  onClose,
  returnFocus,
}: EnrollmentDialogProps) => {
  const { t } = useTranslation();
  const user = useAuthStore((state) => state.user);
  const create = useCreateTrainingEnrollment();
  const submitting = useRef(false);
  const mounted = useRef(true);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);
  const listboxId = useId();
  const [branchId, setBranchId] = useState(ownBranchId ?? '');
  const [studentSearch, setStudentSearch] = useState('');
  const [studentId, setStudentId] = useState('');
  const [programId, setProgramId] = useState('');
  const [programLabel, setProgramLabel] = useState('');
  const [popupOpen, setPopupOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const debouncedSearch = useDebounce(studentSearch, 300);
  const effectiveBranchId = canViewAll ? branchId : (ownBranchId ?? '');
  const canCreate =
    Boolean(effectiveBranchId) &&
    userCan(user, 'training_enrollments.create', effectiveBranchId);
  const scoped = user?.permissions !== undefined;
  const hasSearch = studentSearch.trim().length >= 2;
  const searchSettled = studentSearch === debouncedSearch;

  const studentsQuery = useQuery({
    queryKey: studentKeys.list({
      branchId: effectiveBranchId || undefined,
      search: debouncedSearch,
    }),
    queryFn: ({ signal }) => searchStudents(debouncedSearch, signal),
    enabled: open && canCreate && !scoped && debouncedSearch.trim().length >= 2,
    staleTime: 30_000,
  });
  const programs = useActiveTrainingPrograms(
    effectiveBranchId,
    open && canCreate && !scoped,
  );
  const options = useWriteOptions(
    'training_enrollments',
    'create',
    effectiveBranchId,
    open && canCreate,
    { search: debouncedSearch, limit: 50 },
  );
  const studentChoices = options.scoped
    ? (options.data?.students ?? [])
    : (studentsQuery.data ?? []);
  const programChoices = options.scoped
    ? (options.data?.programs ?? [])
    : (programs.data ?? []);
  const lookup = options.scoped ? options : studentsQuery;
  const loading = !searchSettled || lookup.isFetching;
  const ready =
    open &&
    canCreate &&
    hasSearch &&
    searchSettled &&
    !lookup.isFetching &&
    !lookup.isError &&
    !lookup.isPlaceholderData;
  const selectedStudent =
    canCreate && searchSettled && !lookup.isError
      ? studentChoices.find((student) => student.id === studentId)
      : undefined;
  const selectedProgram = programChoices.find(
    (program) => program.id === programId,
  );
  const canSubmit =
    ready &&
    !!selectedStudent &&
    !!selectedProgram &&
    !create.isPending &&
    (options.scoped || (!programs.isFetching && !programs.isError));
  const showChoices = popupOpen && ready && studentChoices.length > 0;
  const activeOptionId =
    showChoices && activeIndex >= 0 && activeIndex < studentChoices.length
      ? `${listboxId}-${studentChoices[activeIndex].id}`
      : undefined;
  useEffect(() => {
    if (activeOptionId) {
      document
        .getElementById(activeOptionId)
        ?.scrollIntoView?.({ block: 'nearest' });
    }
  }, [activeOptionId]);
  const studentTotal = options.scoped
    ? options.data?.students_total
    : undefined;
  const studentDetails = (student: (typeof studentChoices)[number]) => {
    const last4 =
      'phone_last4' in student
        ? student.phone_last4
        : 'phone' in student
          ? student.phone.replace(/\D/g, '').slice(-4)
          : undefined;
    return [last4 ? `•• ${last4}` : '', student.group_name]
      .filter(Boolean)
      .join(' · ');
  };
  const studentLabel = (student: (typeof studentChoices)[number]) => {
    const details = studentDetails(student);
    const duplicate = studentChoices.some(
      (other) =>
        other.id !== student.id &&
        other.first_name === student.first_name &&
        other.last_name === student.last_name &&
        studentDetails(other) === details,
    );
    return `${student.last_name} ${student.first_name}${details ? ` · ${details}` : ''}${duplicate ? ` · ${student.id}` : ''}`;
  };
  const selectStudent = (student: (typeof studentChoices)[number]) => {
    if (!ready) return;
    setStudentId(student.id);
    setPopupOpen(false);
    setActiveIndex(-1);
  };
  const handleClose = () => {
    if (create.isPending || submitting.current) return;
    setStudentSearch('');
    setStudentId('');
    setProgramId('');
    setProgramLabel('');
    setPopupOpen(false);
    setActiveIndex(-1);
    onClose();
  };
  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (
      !canSubmit ||
      submitting.current ||
      !selectedStudent ||
      !selectedProgram
    )
      return;
    submitting.current = true;
    create.mutate(
      { student_id: selectedStudent.id, program_id: selectedProgram.id },
      {
        onSuccess: () => {
          toast.success(t('training.enrollment_created'));
          submitting.current = false;
          if (mounted.current) handleClose();
        },
        onError: (err) =>
          toast.error(extractErrorMessage(err, t('common.error'))),
        onSettled: () => {
          submitting.current = false;
        },
      },
    );
  };

  return (
    <Dialog open={open} onOpenChange={(next) => !next && handleClose()}>
      <DialogContent
        className="max-w-md"
        onCloseAutoFocus={(event) => {
          event.preventDefault();
          returnFocus();
        }}
        onEscapeKeyDown={(event) => {
          if (popupOpen) {
            event.preventDefault();
            setPopupOpen(false);
            setActiveIndex(-1);
          }
        }}
      >
        <DialogHeader>
          <DialogTitle>{t('training.add_enrollment')}</DialogTitle>
          <DialogDescription>
            {t('training.add_enrollment_desc')}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {canViewAll && (
            <div>
              <label
                htmlFor="enrollment-branch"
                className="mb-1 block text-sm font-medium"
              >
                {t('common.branch')}
              </label>
              <select
                id="enrollment-branch"
                className={selectClass}
                value={branchId}
                disabled={create.isPending}
                onChange={(event) => {
                  setBranchId(event.target.value);
                  setStudentSearch('');
                  setStudentId('');
                  setProgramId('');
                  setProgramLabel('');
                  setPopupOpen(false);
                  setActiveIndex(-1);
                }}
                required
              >
                <option value="">{t('common.select_branch')}</option>
                {branches.map((branch) => (
                  <option key={branch.id} value={branch.id}>
                    {branch.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="relative">
            <label
              htmlFor="student-search-input"
              className="mb-1 block text-sm font-medium"
            >
              {t('training.find_student')}
            </label>
            <Input
              id="student-search-input"
              role="combobox"
              aria-autocomplete="list"
              aria-expanded={showChoices}
              aria-controls={showChoices ? listboxId : undefined}
              aria-activedescendant={activeOptionId}
              aria-describedby={`${listboxId}-status`}
              value={studentSearch}
              disabled={!canCreate || create.isPending}
              onFocus={() => setPopupOpen(true)}
              onClick={() => setPopupOpen(true)}
              onBlur={(event) => {
                if (
                  !event.relatedTarget ||
                  !document
                    .getElementById(listboxId)
                    ?.contains(event.relatedTarget as Node)
                )
                  setPopupOpen(false);
              }}
              onChange={(event) => {
                setStudentSearch(event.target.value);
                setStudentId('');
                setPopupOpen(true);
                setActiveIndex(-1);
              }}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  event.preventDefault();
                  if (
                    showChoices &&
                    activeIndex >= 0 &&
                    studentChoices[activeIndex]
                  ) {
                    selectStudent(studentChoices[activeIndex]);
                  }
                } else if (
                  (event.key === 'ArrowDown' || event.key === 'ArrowUp') &&
                  ready &&
                  studentChoices.length
                ) {
                  event.preventDefault();
                  setPopupOpen(true);
                  setActiveIndex((index) =>
                    event.key === 'ArrowDown'
                      ? (popupOpen ? index + 1 : 0) % studentChoices.length
                      : (popupOpen && index >= 0
                          ? index - 1 + studentChoices.length
                          : studentChoices.length - 1) % studentChoices.length,
                  );
                }
              }}
              placeholder={t('training.search_student_placeholder')}
              autoComplete="off"
            />
            <div
              id={`${listboxId}-status`}
              role="status"
              className="mt-1 text-xs text-muted-foreground"
            >
              {!canCreate
                ? t('training.student_lookup_forbidden')
                : !hasSearch
                  ? t('training.search_student_hint')
                  : loading
                    ? t('common.loading')
                    : lookup.isError
                      ? t('training.student_lookup_failed')
                      : ready && studentChoices.length === 0
                        ? t('training.student_lookup_empty')
                        : ready &&
                            studentTotal !== undefined &&
                            studentTotal > studentChoices.length
                          ? t('training.student_lookup_truncated', {
                              shown: studentChoices.length,
                              total: studentTotal,
                            })
                          : null}
            </div>
            {canCreate && lookup.isError && (
              <Button
                type="button"
                variant="outline"
                onClick={() => void lookup.refetch()}
              >
                {t('common.retry')}
              </Button>
            )}
            {showChoices && (
              <div
                id={listboxId}
                role="listbox"
                aria-label={t('training.find_student')}
                className="absolute inset-x-0 z-50 mt-1 max-h-40 overflow-y-auto rounded-md border bg-popover p-1 text-sm shadow-md"
              >
                {studentChoices.map((student, index) => (
                  <button
                    id={`${listboxId}-${student.id}`}
                    key={student.id}
                    type="button"
                    role="option"
                    tabIndex={index === Math.max(0, activeIndex) ? 0 : -1}
                    aria-selected={studentId === student.id}
                    className={`min-h-11 w-full rounded px-2 py-2 text-left hover:bg-accent hover:text-accent-foreground ${
                      activeIndex === index || studentId === student.id
                        ? 'bg-accent font-medium text-accent-foreground'
                        : ''
                    }`}
                    onKeyDown={(event) => {
                      if (event.key === ' ' || event.key === 'Enter') {
                        event.preventDefault();
                        document
                          .getElementById('student-search-input')
                          ?.focus();
                        selectStudent(student);
                      }
                    }}
                    onFocus={() => setActiveIndex(index)}
                    onBlur={(event) => {
                      if (
                        !document
                          .getElementById(listboxId)
                          ?.contains(event.relatedTarget as Node)
                      )
                        setPopupOpen(false);
                    }}
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={() => selectStudent(student)}
                  >
                    {studentLabel(student)}
                  </button>
                ))}
              </div>
            )}
            {selectedStudent && (
              <p className="mt-2 rounded-md bg-muted p-2 text-sm" role="status">
                <span className="font-medium">
                  {t('training.selected_student')}:{' '}
                </span>
                {studentLabel(selectedStudent)}
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor="training-program-select"
              className="mb-1 block text-sm font-medium"
            >
              {t('training.program')}
            </label>
            <select
              id="training-program-select"
              className={selectClass}
              value={programId}
              disabled={!canCreate || create.isPending}
              onChange={(event) => {
                setProgramId(event.target.value);
                setProgramLabel(event.target.selectedOptions[0]?.text ?? '');
              }}
              required
            >
              <option value="">{t('training.select_program')}</option>
              {programId && !selectedProgram && (loading || lookup.isError) && (
                <option value={programId} disabled>
                  {programLabel}
                </option>
              )}
              {programChoices.map((prog) => (
                <option key={prog.id} value={prog.id}>
                  {prog.name} ({prog.category ?? ''} ·{' '}
                  {Math.round(prog.required_minutes / 60)}h)
                </option>
              ))}
            </select>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              disabled={create.isPending}
              onClick={handleClose}
            >
              {t('common.cancel')}
            </Button>
            <Button type="submit" disabled={!canSubmit}>
              {create.isPending ? t('common.saving') : t('common.save')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

const EnrollmentDialog = (props: EnrollmentDialogProps) => {
  const user = useAuthStore((state) => state.user);
  const activeBranchId = useAuthStore((state) => state.activeBranchId);
  // A new dialog session or authorization context must never reuse an identity.
  const context = JSON.stringify([
    props.open,
    props.ownBranchId,
    props.canViewAll,
    activeBranchId,
    user?.id,
    user?.company_id,
    user?.role,
    user?.access_version,
    user?.permissions,
    user?.branch_ids,
  ]);
  return <EnrollmentDialogForm key={context} {...props} />;
};

const TrainingEnrollmentsPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const activeBranchId = useAuthStore((state) => state.activeBranchId);
  const canViewAll = useCan('viewAllBranches');
  const canCreate = useCan('createTrainingEnrollment');
  const { data: branches = [] } = useBranches(canViewAll);
  const [branchId, setBranchId] = useState('');
  const [status, setStatus] = useState<TrainingEnrollmentStatus | ''>('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const enrollmentTrigger = useRef<HTMLButtonElement>(null);
  const {
    page,
    pageSize,
    search,
    debouncedSearch,
    setPage,
    setPageSize,
    setSearch,
  } = useListQueryState();
  const effectiveBranch = canViewAll
    ? branchId || undefined
    : (activeBranchId ?? user?.branch_id ?? undefined);
  const enrollments = useTrainingEnrollmentsPage({
    branchId: effectiveBranch,
    status: status || undefined,
    page,
    limit: pageSize,
  });
  const programs = useActiveTrainingPrograms(
    effectiveBranch ?? '',
    Boolean(effectiveBranch),
  );
  const programMap = useMemo(
    () => new Map((programs.data ?? []).map((prog) => [prog.id, prog])),
    [programs.data],
  );

  const programName = useCallback(
    (enrollment: TrainingEnrollment) => {
      if (enrollment.program_name) return enrollment.program_name;
      if (enrollment.program_id) {
        return (
          programMap.get(enrollment.program_id)?.name ?? t('training.program')
        );
      }
      return t('training.legacy');
    },
    [programMap, t],
  );

  const visibleEnrollments = useMemo(
    () =>
      (enrollments.data?.data ?? []).filter((enrollment) =>
        matchesListQuery(
          debouncedSearch,
          enrollment.student.first_name,
          enrollment.student.last_name,
          enrollment.category ?? '',
          programName(enrollment),
        ),
      ),
    [enrollments.data, debouncedSearch, programName],
  );

  const branchName = useCallback(
    (id: string) =>
      branches.find((branch) => branch.id === id)?.name ??
      (id === requestBranchId(user, useAuthStore.getState?.()?.activeBranchId)
        ? user?.branch_name
        : id),
    [branches, user],
  );

  const startIndex = (page - 1) * pageSize;

  const columns = useMemo(
    () =>
      enrollmentColumnHelper.columns([
        enrollmentColumnHelper.display({
          id: 'rowNumber',
          header: '#',
          meta: {
            align: 'center',
            cellClassName: 'text-muted-foreground w-12',
          },
          cell: ({ row }) => startIndex + row.getDisplayIndex() + 1,
        }),
        enrollmentColumnHelper.display({
          id: 'student',
          header: t('students.student'),
          meta: { cellClassName: 'font-medium' },
          cell: ({ row }) => (
            <button
              type="button"
              onClick={() =>
                navigate({
                  to: '/training-enrollments/$id',
                  params: { id: row.original.id },
                })
              }
              className="text-left font-medium text-foreground hover:underline"
            >
              {row.original.student.last_name} {row.original.student.first_name}
            </button>
          ),
        }),
        enrollmentColumnHelper.display({
          id: 'program',
          header: t('training.program'),
          meta: { cellClassName: 'text-muted-foreground' },
          cell: ({ row }) => (
            <span>
              <span className="font-semibold text-foreground">
                {row.original.category ?? '—'}
              </span>
              {' · '}
              {programName(row.original)}
            </span>
          ),
        }),
        enrollmentColumnHelper.display({
          id: 'branch',
          header: t('common.branch'),
          meta: { cellClassName: 'text-muted-foreground' },
          cell: ({ row }) => branchName(row.original.branch_id),
        }),
        enrollmentColumnHelper.accessor('status', {
          header: t('common.status'),
          meta: { align: 'center' },
          cell: ({ getValue }) => {
            const val = getValue();
            const colorClass =
              val === 'active'
                ? 'bg-success/10 text-success'
                : val === 'completed'
                  ? 'bg-info/10 text-info'
                  : val === 'cancelled'
                    ? 'bg-destructive/10 text-destructive'
                    : 'bg-muted text-muted-foreground';
            return (
              <span
                className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${colorClass}`}
              >
                {t(`training.status.${val}`)}
              </span>
            );
          },
        }),
        enrollmentColumnHelper.accessor('approved_minutes', {
          header: t('driving.approved'),
          meta: {
            align: 'center',
            cellClassName: 'tabular-nums text-muted-foreground font-medium',
          },
          cell: ({ getValue }) => `${getValue()} ${t('driving.minutes')}`,
        }),
        enrollmentColumnHelper.display({
          id: 'remaining_minutes',
          header: t('driving.remaining'),
          meta: {
            align: 'center',
            cellClassName: 'tabular-nums text-muted-foreground',
          },
          cell: ({ row }) =>
            row.original.remaining_minutes === null
              ? t('common.na')
              : `${row.original.remaining_minutes} ${t('driving.minutes')}`,
        }),
        enrollmentColumnHelper.display({
          id: 'actions',
          header: t('common.actions'),
          meta: { align: 'center' },
          cell: ({ row }) => (
            <button
              type="button"
              onClick={() =>
                navigate({
                  to: '/training-enrollments/$id',
                  params: { id: row.original.id },
                })
              }
              aria-label={t('common.view')}
              title={t('common.view')}
              className="flex h-9 w-9 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            >
              <CaretRight className="h-4 w-4" />
            </button>
          ),
        }),
      ]),
    [branchName, navigate, programName, startIndex, t],
  );

  return (
    <div className="space-y-4">
      <PageHeader
        eyebrow={t('training.enrollments')}
        title={t('training.enrollments')}
        icon={<GraduationCap className="h-3.5 w-3.5" />}
        actions={
          canCreate && (
            <Button
              ref={enrollmentTrigger}
              aria-expanded={dialogOpen}
              onClick={() => setDialogOpen(true)}
            >
              <Plus className="mr-2 h-4 w-4" />
              {t('training.add_enrollment')}
            </Button>
          )
        }
      />
      <ListSearchField value={search} onChange={setSearch} />
      <div className="glass-card grid gap-3 p-4 sm:grid-cols-2">
        {canViewAll ? (
          <select
            aria-label={t('common.branch')}
            className={selectClass}
            value={branchId}
            onChange={(event) => {
              setBranchId(event.target.value);
              setPage(1);
            }}
          >
            <option value="">{t('common.all_branches')}</option>
            {branches.map((branch) => (
              <option key={branch.id} value={branch.id}>
                {branch.name}
              </option>
            ))}
          </select>
        ) : (
          <span className="self-center text-sm text-muted-foreground">
            {user?.branch_name ?? t('common.branch')}
          </span>
        )}
        <select
          aria-label={t('common.status')}
          className={selectClass}
          value={status}
          onChange={(event) => {
            setStatus(event.target.value as TrainingEnrollmentStatus | '');
            setPage(1);
          }}
        >
          <option value="">{t('common.all')}</option>
          {(['active', 'completed', 'cancelled', 'legacy'] as const).map(
            (value) => (
              <option key={value} value={value}>
                {t(`training.status.${value}`)}
              </option>
            ),
          )}
        </select>
      </div>

      <DataGrid
        data={visibleEnrollments}
        columns={columns}
        getRowId={(enrollment) => enrollment.id}
        pagination={{
          pageIndex: page - 1,
          pageSize,
          rowCount: enrollments.data?.meta.total ?? visibleEnrollments.length,
          pageCount: Math.max(1, enrollments.data?.meta.totalPages ?? 1),
        }}
        onPaginationChange={({ pageIndex }) => setPage(pageIndex + 1)}
        onPageSizeChange={setPageSize}
        sorting={[]}
        onSortingChange={() => undefined}
        columnFilters={[]}
        onColumnFiltersChange={() => undefined}
        manualPagination
        manualSorting={false}
        manualFiltering
        isInitialLoading={enrollments.isLoading}
        isFetching={enrollments.isFetching}
        labels={{
          table: t('training.enrollments'),
          loading: t('common.loading'),
          fetching: t('common.loading'),
          previousPage: t('common.previous'),
          nextPage: t('common.next'),
        }}
        errorState={
          enrollments.isError ? (
            <EmptyState
              title={t('common.error')}
              action={{
                label: t('common.retry'),
                onClick: () => void enrollments.refetch(),
              }}
            />
          ) : undefined
        }
        emptyState={<EmptyState title={t('common.no_data')} />}
        renderMobileRow={({ row: enrollment }) => (
          <DataCard
            key={enrollment.id}
            title={`${enrollment.student.last_name} ${enrollment.student.first_name}`}
            subtitle={`${enrollment.category ?? '—'} · ${programName(enrollment)}`}
            onClick={() =>
              navigate({
                to: '/training-enrollments/$id',
                params: { id: enrollment.id },
              })
            }
            fields={[
              {
                label: t('common.branch'),
                value: branchName(enrollment.branch_id),
              },
              {
                label: t('common.status'),
                value: t(`training.status.${enrollment.status}`),
              },
              {
                label: t('driving.approved'),
                value: `${enrollment.approved_minutes} ${t('driving.minutes')}`,
              },
              {
                label: t('driving.remaining'),
                value:
                  enrollment.remaining_minutes === null
                    ? t('common.na')
                    : `${enrollment.remaining_minutes} ${t('driving.minutes')}`,
              },
            ]}
          />
        )}
      />

      <EnrollmentDialog
        open={dialogOpen}
        branches={branches}
        ownBranchId={activeBranchId ?? user?.branch_id ?? undefined}
        canViewAll={canViewAll}
        returnFocus={() => {
          // Context remounts keep the dialog open; only dismissal restores focus.
          if (
            enrollmentTrigger.current?.getAttribute('aria-expanded') === 'false'
          )
            enrollmentTrigger.current.focus();
        }}
        onClose={() => setDialogOpen(false)}
      />
    </div>
  );
};

export default TrainingEnrollmentsPage;
