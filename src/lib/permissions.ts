import type { User, UserRole } from '@/features/staff/types';

/**
 * Capability → allowed roles: the single source of truth for what each role
 * can see/do in the UI.
 *
 * FE gating is COSMETIC — the backend `@Roles` guards are the real security
 * boundary, so every capability here should have a matching server-side guard.
 * `dev` is a superset of `owner` for operational capabilities. Finance is an
 * explicit exception: direct dev sessions never receive company-finance
 * capabilities; an effective impersonated owner is checked as `owner`.
 * Narrow workflow capabilities may also deliberately use their own role set.
 */
export type Capability =
  | 'accessOperations'
  | 'viewAllBranches'
  | 'manageBranches'
  | 'assignBranch'
  | 'manageStaff'
  | 'manageUsers'
  | 'recordPayment'
  | 'viewPayments'
  | 'manageStudents'
  | 'manageGroups'
  | 'manageSchedule'
  | 'takeAttendance'
  | 'manageOwnLesson'
  | 'viewAudit'
  | 'viewDashboard'
  | 'viewExpenses'
  | 'navigateExpenseOverdueSweep'
  | 'manageCompanyFinance'
  | 'viewDeleted'
  | 'accessLeads'
  | 'viewDocuments'
  | 'manageDocuments'
  // LMS
  | 'viewLearning'
  | 'manageLearning'
  | 'manageSubjects'
  | 'sendNotifications';

// Role groups — named so the matrix reads as intent, not a wall of literals.
const OWNERS: readonly UserRole[] = ['dev', 'owner'];
const OPS: readonly UserRole[] = ['dev', 'owner', 'manager', 'operator'];
// Accountant stays permanently outside operational capabilities. Finance
// access is granted separately through staged finance-only capabilities.
const OPERATIONAL_ROLES: readonly UserRole[] = [
  'dev',
  'owner',
  'manager',
  'operator',
  'teacher',
];

export const CAPABILITIES: Record<Capability, readonly UserRole[]> = {
  accessOperations: OPERATIONAL_ROLES,
  viewAllBranches: OWNERS,
  manageBranches: OWNERS,
  assignBranch: OWNERS,
  manageStaff: ['dev', 'owner', 'manager'],
  // Company user administration (creating managers) — owner/dev only, unlike
  // manageStaff (adding branch teachers/operators, which a manager may do).
  manageUsers: OWNERS,
  recordPayment: OPS,
  // Mirrors backend GET /payments(/snapshot|/summary); writes stay recordPayment.
  viewPayments: [...OPS, 'accountant'],
  manageStudents: OPS,
  manageGroups: ['dev', 'owner', 'manager'],
  manageSchedule: OPS,
  takeAttendance: OPERATIONAL_ROLES,
  // Teacher creates an ad-hoc lesson for their own (server-scoped) group and
  // edits/deletes only lessons they personally created -- narrower than
  // manageSchedule (templates/bulk-generate stay OPS-only, unaffected).
  // Deliberately excludes operator: operator already creates lessons via
  // manageSchedule, but must not get a delete-own affordance the backend
  // won't honor (DELETE /lessons/:id stays owner/manager, + the creator only
  // if teacher). dev/owner/manager included to satisfy dev/owner ⊇ every
  // capability (permissions.test.ts) -- harmless, since owner/manager already
  // have unconditional delete via the role check in AttendancePage.
  manageOwnLesson: ['dev', 'owner', 'manager', 'teacher'],
  viewAudit: OWNERS,
  // T8B: accountant joins via FinanceDashboard only (not operational CRM).
  viewDashboard: [...OPERATIONAL_ROLES, 'accountant'],
  // Finance is intentionally not part of the dev superset. Direct platform
  // sessions are denied by the backend; an impersonated owner is evaluated
  // with the effective owner role instead.
  viewExpenses: ['owner', 'accountant', 'manager'],
  navigateExpenseOverdueSweep: ['owner', 'manager'],
  manageCompanyFinance: ['owner', 'accountant'],
  // "show deleted" toggle + restore action on the students/
  // groups/users/branches list pages. No existing capability means this --
  // manageBranches/manageUsers/manageStudents/manageGroups are each scoped
  // to ONE entity's CRUD, and viewAudit/viewAllBranches/assignBranch each
  // already gate a different, unrelated feature. A dedicated OWNERS-only
  // capability keeps `useCan('viewDeleted')` self-documenting at each of
  // the four call sites instead of overloading an unrelated one.
  viewDeleted: OWNERS,
  accessLeads: OPS,
  viewDocuments: OPERATIONAL_ROLES,
  manageDocuments: OPS,
  // LMS: o'qish — barcha operatsion rollar; topshiriq/test/dastur yozish —
  // admin rollar va o'qituvchi (backend o'qituvchini o'z guruhlari bilan cheklaydi).
  viewLearning: OPERATIONAL_ROLES,
  manageLearning: ['dev', 'owner', 'manager', 'teacher'],
  manageSubjects: ['dev', 'owner', 'manager'],
  sendNotifications: OPERATIONAL_ROLES,
};

/** Does this role have the capability? An absent/unknown role has none. */
export function roleCan(
  role: UserRole | undefined | null,
  cap: Capability,
): boolean {
  return role != null && CAPABILITIES[cap].includes(role);
}

export type AccessCapability = Capability | `${string}.${string}`;

const permissionForCapability: Record<Capability, readonly string[]> = {
  accessOperations: [
    'students.read',
    'groups.read',
    'lessons.read',
    'attendance.read',
  ],
  viewAllBranches: ['branches.read'],
  manageBranches: ['branches.read'],
  assignBranch: ['staff.update'],
  manageStaff: ['staff.read'],
  manageUsers: ['staff.read'],
  recordPayment: ['payments.create'],
  viewPayments: ['payments.read'],
  manageStudents: ['students.create'],
  manageGroups: ['groups.create'],
  manageSchedule: ['schedule.create'],
  takeAttendance: ['attendance.mark'],
  manageOwnLesson: ['lessons.update'],
  viewAudit: ['audit.read'],
  viewDashboard: ['reports.read'],
  viewExpenses: ['expenses.read'],
  navigateExpenseOverdueSweep: ['expenses.read'],
  manageCompanyFinance: ['expenses.create'],
  viewDeleted: [
    'students.restore',
    'groups.restore',
    'staff.restore',
    'branches.restore',
  ],
  accessLeads: ['leads.read'],
  viewDocuments: ['documents.read'],
  manageDocuments: ['documents.create'],
  viewLearning: [
    'subjects.read',
    'curriculum.read',
    'assignments.read',
    'exams.read',
    'grades.read',
  ],
  manageLearning: ['assignments.create', 'exams.create', 'curriculum.create'],
  manageSubjects: ['subjects.create'],
  sendNotifications: ['notifications.create'],
};

const legacyActionCapability: Record<string, Capability> = {
  students: 'manageStudents',
  groups: 'manageGroups',
  staff: 'manageStaff',
  branches: 'manageBranches',
  courses: 'accessOperations',
  lessons: 'manageOwnLesson',
  schedule: 'manageSchedule',
  attendance: 'takeAttendance',
  leads: 'accessLeads',
  lead_stages: 'accessLeads',
  lead_sources: 'accessLeads',
  payments: 'recordPayment',
  expenses: 'manageCompanyFinance',
  expense_payments: 'manageCompanyFinance',
  documents: 'manageDocuments',
  subjects: 'manageSubjects',
  curriculum: 'manageLearning',
  assignments: 'manageLearning',
  exams: 'manageLearning',
  grades: 'manageLearning',
  notifications: 'sendNotifications',
};

const legacyAllows = (role: UserRole, permission: string) => {
  if (permission.endsWith('.restore')) return roleCan(role, 'viewDeleted');
  if (permission === 'audit.read' && role === 'manager') return true;
  if (permission === 'lessons.create')
    return roleCan(role, 'manageSchedule') || roleCan(role, 'manageOwnLesson');
  if (permission === 'lessons.update') return role === 'teacher';
  const mapped = legacyActionCapability[permission.split('.')[0]];
  return (
    Object.entries(permissionForCapability).some(
      ([cap, keys]) =>
        keys.includes(permission) && roleCan(role, cap as Capability),
    ) ||
    (!!mapped && roleCan(role, mapped))
  );
};

/** Explicit grants, including an empty list, never inherit a role's rights. */
export function userCan(
  user: User | null | undefined,
  capability: AccessCapability,
  branchId?: string | null,
): boolean {
  if (!user) return false;
  const legacy = capability in CAPABILITIES;
  if (user.role === 'owner') return true;
  if (user.role === 'dev') {
    if (legacy) return roleCan(user.role, capability as Capability);
    if (/^(expenses|expense_payments)\./.test(capability))
      return false;
    return legacyAllows(user.role, capability);
  }
  // Older cached API responses omit the field; the fresh access snapshot is authoritative.
  if (user.permissions === undefined) {
    return legacy
      ? roleCan(user.role, capability as Capability)
      : legacyAllows(user.role, capability);
  }
  if (branchId && user.branch_ids && !user.branch_ids.includes(branchId))
    return false;
  const keys = legacy
    ? permissionForCapability[capability as Capability]
    : [capability];
  return user.permissions.some(
    (grant) =>
      keys.includes(grant.permission) &&
      (grant.scope === 'company' ||
        !branchId ||
        !grant.branch_id ||
        grant.branch_id === branchId),
  );
}

/** owner or dev — the cross-branch (company-wide) roles. */
export function isCrossTenantRole(role: UserRole | undefined | null): boolean {
  return role === 'owner' || role === 'dev';
}

/** Cross-tenant roles plus accountant, whose data scope has no branch. */
export function isCompanyWideRole(role: UserRole | undefined | null): boolean {
  return isCrossTenantRole(role) || role === 'accountant';
}

/** A scoped all-branches view must not fall back to the historical home branch. */
export function requestBranchId(
  user: Pick<User, 'branch_id' | 'permissions'> | null | undefined,
  activeBranchId?: string | null,
): string | undefined {
  return user?.permissions !== undefined
    ? (activeBranchId ?? undefined)
    : (activeBranchId ?? user?.branch_id ?? undefined);
}
