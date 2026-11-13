# EduLMS Frontend — Domain Context

Domain glossary and product boundaries. Routes, state, UI architecture, generated API types, and i18n setup live in `docs/architecture/overview.md`.

## Overview

React 19 + Vite + TypeScript frontend for a learning management platform (LMS) used by Uzbek education centers. Tenant-facing application serving owners, managers, accountants, operators, and teachers across branches. Built with shadcn/ui, TanStack Router, TanStack Query, Zustand, and the shared design tokens in `src/index.css` / `src/styles/`.

## Product boundaries

**Tenant App**: the authenticated workspace used by owners, managers, accountants, operators, and teachers. It contains no public marketing pages. Students use a separate learner portal (legacy `/api` endpoints); in this app staff record student answers on their behalf.

---

## Domain Glossary

| Term (UZ)          | English            | Definition |
| ------------------ | ------------------ | ---------- |
| Filial             | Branch             | Tenant boundary — each branch has its own manager, operators, teachers, students, groups and schedule. |
| Fan / Kategoriya   | Subject / Category | Two-level catalogue (category → subject). A course may belong to one subject. |
| Kurs               | Course             | A paid program (online/offline, price, duration). Owns the curriculum. |
| O‘quv dasturi      | Curriculum         | Ordered **modules** → **lessons** (text, video link, duration) → **materials** (file, video, link). |
| Guruh              | Group              | A class of students taught by one teacher, optionally linked to a course. |
| Kursga yozilish    | Enrollment         | A student is enrolled in a course directly (`course_id`) or through an active membership in one of the course's groups. |
| Topshiriq          | Assignment         | Homework for a course or group with a due date and max score. Each student has at most one **submission** (submitted → graded / returned). |
| Test / Imtihon     | Quiz / Exam        | Question bank (single, multiple, text answers), pass percent, attempt limit. Draft → published → closed. Attempts are graded automatically; text answers without an answer key need manual review. |
| Baholar jurnali    | Gradebook          | Union of graded submissions and graded quiz attempts. |
| Progress           | Progress           | Per student: lesson completion per course, attendance rate, assignment and test averages. |
| Dars (jadval)      | Lesson (schedule)  | A scheduled class session for a group (`theory` / `practice`), generated from schedule templates; carries attendance. Distinct from a curriculum lesson. |
| Davomat            | Attendance         | Per-student-per-lesson record: present, absent, late, excused. |
| To'lov             | Payment            | Student payment record. `debt` is a running balance; negative means credit. |
| Bildirishnoma      | Notification       | Message to everyone, teachers, students, a group or one person; read state is per recipient. |
| Foydalanuvchi      | User               | Roles: **dev**, **owner**, **manager**, **accountant** (finance only), **operator**, **teacher** (LMS writes limited to own groups). |
| Sana oralig‘i      | Date Range         | Inclusive pair of calendar dates (`date_from` / `date_to`). |
