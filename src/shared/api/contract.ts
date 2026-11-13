import type { components, operations } from './schema';

export type ApiSchemas = components['schemas'];

type JsonContent<T> = T extends { content: infer Content }
  ? Content extends { 'application/json': infer Body }
    ? Body
    : never
  : never;

/** Request body generated from one operation in the authenticated API contract. */
export type ApiRequest<Operation extends keyof operations> = JsonContent<
  operations[Operation]['requestBody']
>;

/**
 * Tenant CRUD response schemas are not published by the backend yet. Service
 * parsers therefore intentionally accept `unknown` and map the verified
 * envelope into the UI/domain model. Do not replace that parser with a blind
 * cast until the backend publishes response schemas.
 */
export type ApiUnspecifiedResponse = unknown;

export type StudentsQuery = NonNullable<
  operations['V2StudentsController_list']['parameters']['query']
>;
export type PaymentsQuery = NonNullable<
  operations['V2PaymentsController_list']['parameters']['query']
>;
export type PaymentSummaryQuery = NonNullable<
  operations['V2PaymentsController_summary']['parameters']['query']
>;
export type GroupsQuery = NonNullable<
  operations['V2GroupsController_list']['parameters']['query']
>;
export type CoursesQuery = NonNullable<
  operations['V2CoursesController_list']['parameters']['query']
>;
export type LessonsQuery = NonNullable<
  operations['V2LessonsController_list']['parameters']['query']
> & { search?: string };
export type AttendanceHistoryQuery = NonNullable<
  operations['V2AttendanceController_history']['parameters']['query']
>;
export type CalendarLessonsQuery = NonNullable<
  operations['V2ScheduleController_calendar']['parameters']['query']
>;
export type UsersQuery = NonNullable<
  operations['V2UsersController_list']['parameters']['query']
>;
export type BranchesQuery = NonNullable<
  operations['V2BranchesController_list']['parameters']['query']
>;
export type DashboardQuery = NonNullable<
  operations['V2DashboardController_analytics']['parameters']['query']
>;
export type CompanyOverviewQuery = NonNullable<
  operations['V2DashboardController_companyOverview']['parameters']['query']
>;

export type CreateStudentRequest = ApiRequest<'V2StudentsController_create'>;
export type UpdateStudentRequest = ApiRequest<'V2StudentsController_update'>;
export type CreateBranchRequest = ApiRequest<'V2BranchesController_create'>;
export type UpdateBranchRequest = ApiRequest<'V2BranchesController_update'>;
export type CreatePaymentRequest = ApiRequest<'V2PaymentsController_create'>;
export type UpdatePaymentRequest = ApiRequest<'V2PaymentsController_update'>;
export type CreateGroupRequest = ApiRequest<'V2GroupsController_create'>;
export type UpdateGroupRequest = ApiRequest<'V2GroupsController_update'>;
export type CreateCourseRequest = ApiRequest<'V2CoursesController_create'>;
export type UpdateCourseRequest = ApiRequest<'V2CoursesController_update'>;
export type CreateLessonRequest = ApiRequest<'V2LessonsController_create'>;
export type UpdateLessonRequest = ApiRequest<'V2LessonsController_update'>;
export type BatchAttendanceRequest =
  ApiRequest<'V2AttendanceController_batch'>;
export type CreateTemplateRequest =
  ApiRequest<'V2ScheduleController_createTemplate'>;
export type UpdateTemplateRequest =
  ApiRequest<'V2ScheduleController_updateTemplate'>;
export type GenerateLessonsRequest =
  ApiRequest<'V2ScheduleController_generate'>;
export type CreateUserRequest = ApiRequest<'V2UsersController_create'>;
export type UpdateUserRequest = ApiRequest<'V2UsersController_update'>;
export type LoginRequest = ApiRequest<'V2AuthController_login'>;
export type ChangePasswordRequest = ApiRequest<'V2AuthController_changePassword'>;

/** Finance contracts are kept explicit until the live OpenAPI schema publishes
 * the Expenses module. Wire names intentionally stay snake_case. */
export type CreateExpenseRequest = {
  category:
    | 'rent'
    | 'utilities'
    | 'marketing'
    | 'supplies'
    | 'administrative'
    | 'other';
  title: string;
  amount: string;
  expense_date: string;
  due_date?: string | null;
  payee?: string | null;
  note?: string | null;
  branch_id?: string | null;
  idempotency_key: string;
};

/** Owner/accountant monthly settlement create. Never accepts `branch_id`. */
export type CreateTeacherSettlementRequest = {
  teacher_id: string;
  period_month: string;
  title: string;
  amount: string;
  due_date?: string | null;
  payee?: string | null;
  note?: string | null;
  idempotency_key: string;
};

export type ExpensesQuery = {
  branch_id?: string;
  scope?: 'company';
  category?: CreateExpenseRequest['category'] | 'teacher_settlement';
  status?: 'planned' | 'partially_paid' | 'paid' | 'cancelled';
  attention?: 'overdue';
  date_from?: string;
  date_to?: string;
  search?: string;
  page?: number;
  limit?: number;
};

export type ExpenseMonthCloseQuery = {
  month: string;
  branch_id?: string;
};

export type ExpenseTriageCountsQuery = {
  branch_id?: string;
  scope?: 'company';
};
