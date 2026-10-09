# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Auto Maktab owners, managers, finance staff, teachers, and operators use the product throughout the workday. Owners and managers need a dense, legible overview; operational roles need quick access to schedules, attendance, students, payments, vehicles, and training work.

## Product Purpose

Auto Maktab is the operating system for a multi-branch driving school. It brings student lifecycle, lessons, attendance, finance, CRM, staff, fleet, training, permissions, and audit work into one tenant-aware application.

Success means users can understand the current state quickly, reach frequent workflows without navigation friction, and act without losing branch or permission context.

## Positioning

Auto Maktab unifies school operations and business control in one role-aware product instead of splitting schedules, student records, payments, and fleet work across unrelated tools.

## Operating Context

The interface is an information-dense desktop web app used in Uzbek, with responsive support for smaller screens. Data is scoped by company and branch. Dates and operating time use Asia/Tashkent conventions; money is shown in so'm.

## Capabilities and Constraints

- Authenticated, file-based routes render through a shared application shell.
- Navigation and route access are capability-gated.
- The design-system documentation is available in Storybook and at `/design-system`; the product route is restricted by `manageUsers`.
- Existing workflows, copy, information hierarchy, RBAC, mobile drawer behavior, and fleet-map full-bleed behavior must remain intact.
- The desktop shell should use the available viewport with minimal outer gutters.
- A collapsed desktop sidebar shows icons only; accessible names and interaction flyouts remain available.

## Brand Commitments

- Product name: Auto Maktab.
- Primary language: Uzbek.
- Typography: Manrope for interface text and JetBrains Mono for figures, dates, codes, and compact labels.
- The approved visual direction is deep slate/gray surfaces with a restrained technology-blue primary color across the app and Storybook.
- Semantic success, warning, danger, and information colors remain distinct from the primary brand color.

## Evidence on Hand

- Production surface: `https://app.automaktab.uz`.
- Current app implementation and Storybook in this repository.
- Visual references supplied in the task show the current dashboard and collapsed sidebar.
- Existing direction reference: `/Users/admin/Developer/Projects/autodrive/Design.md`; its layout, typography, density, semantic status, and Uzbek conventions remain useful, while its amber primary is superseded by the approved technology-blue direction.

## Product Principles

1. Show operational state before decoration.
2. Spend the viewport on useful data, not nested page chrome.
3. Keep navigation predictable and role-aware.
4. Use one semantic token system across product UI and developer documentation.
5. Preserve accessibility at compact enterprise density.

## Accessibility & Inclusion

The interface must retain keyboard navigation, visible focus, skip navigation, accessible names for icon-only controls, non-color status cues, reduced-motion behavior, and WCAG AA text contrast.
