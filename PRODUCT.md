# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Owners, managers, finance staff, teachers, and operators of education centers use the product throughout the workday. Owners and managers need a dense, legible overview; teachers need fast access to their groups' curriculum, assignments, tests and grades; operators handle students, enrollment, schedules and payments.

## Product Purpose

EduLMS is the learning management system for multi-branch education centers. It brings subjects and courses, curricula (modules, lessons, videos, materials), enrollment, assignments, tests and exams, grading, attendance, student progress, notifications, finance, staff, permissions and audit into one tenant-aware application.

Success means users can understand the current state of teaching quickly, reach frequent workflows without navigation friction, and act without losing branch or permission context.

## Operating Context

Information-dense desktop web app used in Uzbek (also Russian and English), with responsive support for smaller screens. Data is scoped by company and branch. Dates use Asia/Tashkent conventions; money is shown in so'm.

## Capabilities and Constraints

- Authenticated, file-based routes render through a shared application shell.
- Navigation and route access are capability-gated; the backend `@V2Roles` / `@V2Permission` guards are the real security boundary.
- The design-system documentation is available in Storybook and at `/design-system`.

## Brand Commitments

- Product name: EduLMS.
- Primary language: Uzbek.
- Typography: Manrope for interface text and JetBrains Mono for figures, dates and codes.
- Semantic success, warning, danger, and information colors remain distinct from the primary brand color.

## Product Principles

1. Show learning and operational state before decoration.
2. Spend the viewport on useful data, not nested page chrome.
3. Keep navigation predictable and role-aware.
4. Use one semantic token system across product UI and developer documentation.
5. Preserve accessibility at compact enterprise density.

## Accessibility & Inclusion

Keyboard navigation, visible focus, skip navigation, accessible names for icon-only controls, non-color status cues, reduced-motion behavior, and WCAG AA text contrast.
