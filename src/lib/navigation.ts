import {
  SquaresFour,
  FunnelSimple,
  Buildings,
  GraduationCap,
  CreditCard,
  Wallet,
  UsersThree,
  User,
  Stack,
  UserGear,
  ShieldCheck,
  Calendar,
  ListChecks,
  BookOpen,
  Briefcase,
  GearSix,
  FileText,
  Books,
  ClipboardText,
  Exam,
  ChartBar,
  Bell,
} from '@phosphor-icons/react';
import type { Capability } from '@/lib/permissions';

export type NavSectionId =
  'workspace' | 'learning' | 'team' | 'system';

export type AppRoutePath =
  | '/dashboard'
  | '/schedule'
  | '/attendance'
  | '/groups'
  | '/courses'
  | '/students'
  | '/leads'
  | '/payments'
  | '/expenses'
  | '/branches'
  | '/teachers'
  | '/users'
  | '/documents'
  | '/subjects'
  | '/assignments'
  | '/exams'
  | '/grades'
  | '/notifications'
  | '/audit'
  | '/design-system'
  | '/profile';

export type NavItem = {
  path: AppRoutePath;
  labelKey: string;
  icon: typeof SquaresFour;
  section: NavSectionId;
  cap?: Capability;
  pinnable?: boolean;
};

export type NavSection = {
  id: NavSectionId;
  labelKey: string;
  icon: typeof SquaresFour;
  collapsible?: boolean;
};

export const NAV_SECTIONS: NavSection[] = [
  {
    id: 'workspace',
    labelKey: 'nav_sections.workspace',
    icon: Briefcase,
    collapsible: false,
  },
  { id: 'learning', labelKey: 'nav_sections.learning', icon: GraduationCap },
  { id: 'team', labelKey: 'nav_sections.team', icon: UsersThree },
  { id: 'system', labelKey: 'nav_sections.system', icon: GearSix },
];

// This is the one source of truth for the sidebar and Command Palette. Route
// guards still enforce authorization; these capability flags only control what
// the client presents to a signed-in user.
const allNavItems: NavItem[] = [
  {
    path: '/dashboard',
    labelKey: 'nav.dashboard',
    icon: SquaresFour,
    section: 'workspace',
    cap: 'viewDashboard',
  },
  {
    path: '/schedule',
    labelKey: 'nav.schedule',
    icon: Calendar,
    section: 'workspace',
    cap: 'accessOperations',
  },
  {
    path: '/attendance',
    labelKey: 'nav.attendance',
    icon: ListChecks,
    section: 'workspace',
    cap: 'accessOperations',
  },
  {
    path: '/leads',
    labelKey: 'nav.leads',
    icon: FunnelSimple,
    section: 'workspace',
    cap: 'accessLeads',
    pinnable: true,
  },
  {
    path: '/groups',
    labelKey: 'nav.groups',
    icon: Stack,
    section: 'learning',
    cap: 'accessOperations',
  },
  {
    path: '/courses',
    labelKey: 'nav.courses',
    icon: BookOpen,
    section: 'learning',
    cap: 'manageStaff',
  },
  {
    path: '/students',
    labelKey: 'nav.students',
    icon: GraduationCap,
    section: 'learning',
    cap: 'accessOperations',
  },
  {
    path: '/subjects',
    labelKey: 'nav.subjects',
    icon: Books,
    section: 'learning',
    cap: 'viewLearning',
  },
  {
    path: '/assignments',
    labelKey: 'nav.assignments',
    icon: ClipboardText,
    section: 'learning',
    cap: 'viewLearning',
    pinnable: true,
  },
  {
    path: '/exams',
    labelKey: 'nav.exams',
    icon: Exam,
    section: 'learning',
    cap: 'viewLearning',
    pinnable: true,
  },
  {
    path: '/grades',
    labelKey: 'nav.grades',
    icon: ChartBar,
    section: 'learning',
    cap: 'viewLearning',
  },
  {
    path: '/payments',
    labelKey: 'nav.payments',
    icon: CreditCard,
    section: 'learning',
    cap: 'viewPayments',
  },
  {
    path: '/expenses',
    labelKey: 'nav.expenses',
    icon: Wallet,
    section: 'workspace',
    cap: 'viewExpenses',
  },
  {
    path: '/branches',
    labelKey: 'nav.branches',
    icon: Buildings,
    section: 'team',
    cap: 'manageBranches',
  },
  {
    path: '/teachers',
    labelKey: 'nav.teachers',
    icon: UsersThree,
    section: 'team',
    cap: 'manageStaff',
  },
  {
    path: '/users',
    labelKey: 'nav.users',
    icon: UserGear,
    section: 'team',
    cap: 'manageUsers',
  },
  {
    path: '/notifications',
    labelKey: 'nav.notifications',
    icon: Bell,
    section: 'workspace',
  },
  {
    path: '/documents',
    labelKey: 'nav.documents',
    icon: FileText,
    section: 'workspace',
    cap: 'viewDocuments',
  },
  {
    path: '/audit',
    labelKey: 'nav.audit',
    icon: ShieldCheck,
    section: 'system',
    cap: 'viewAudit',
  },
  {
    path: '/design-system',
    labelKey: 'nav.design_system',
    icon: SquaresFour,
    section: 'system',
    cap: 'manageUsers',
  },
  {
    path: '/profile',
    labelKey: 'nav.profile',
    icon: User,
    section: 'system',
    pinnable: false,
  },
];

export const NAV_ITEMS = allNavItems;
