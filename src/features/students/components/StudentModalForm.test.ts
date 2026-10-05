import { describe, expect, it } from 'vitest';
import type { Student } from '@/features/students/types';
import {
  getCreateStudentFormValues,
  getEditStudentFormValues,
  toCreateStudentPayload,
} from '@/features/students/components/StudentModalForm';

const STUDENT: Student = {
  id: 'student-1',
  first_name: 'Aziz',
  last_name: 'Karimov',
  phone: '+998901234567',
  course_type: 'avto_maktab',
  branch_id: 'branch-1',
  payment_method: null,
  has_document: true,
  result: 'oqimoqda',
  created_at: '2026-08-01',
  total_price: 4_000_000,
  initial_payment: 1_000_000,
};

describe('StudentModal create/edit form mapping', () => {
  it('uses the assigned default branch only when the user may assign branches', () => {
    expect(
      getCreateStudentFormValues({
        courseType: 'tezkor',
        canAssignBranch: true,
        defaultBranchId: 'branch-2',
        userBranchId: 'branch-1',
      }).branch_id,
    ).toBe('branch-2');

    expect(
      getCreateStudentFormValues({
        courseType: 'tezkor',
        canAssignBranch: false,
        defaultBranchId: 'branch-2',
        userBranchId: 'branch-1',
      }).branch_id,
    ).toBe('branch-1');
  });

  it('starts edit mode with no additional payment and preserves historical values', () => {
    expect(getEditStudentFormValues(STUDENT)).toMatchObject({
      payment_method: 'naqd',
      total_price: 4_000_000,
      initial_payment: 1_000_000,
      amount_paid: 0,
    });
  });

  it('normalizes the phone and sends an avto-maktab additional payment only while editing', () => {
    const values = {
      ...getCreateStudentFormValues({
        courseType: 'avto_maktab',
        canAssignBranch: false,
        userBranchId: 'branch-1',
      }),
      first_name: 'Aziz',
      last_name: 'Karimov',
      phone: '90 123 45 67',
      total_price: 4_000_000,
      initial_payment: 1_000_000,
      amount_paid: 500_000,
    };

    expect(
      toCreateStudentPayload(values, 'avto_maktab', false),
    ).not.toHaveProperty('amount_paid');
    expect(toCreateStudentPayload(values, 'avto_maktab', true)).toMatchObject({
      phone: '+998901234567',
      initial_payment: 1_000_000,
      amount_paid: 500_000,
    });
  });

  describe('course_id (#342)', () => {
    const createValues = (courseType: 'tezkor' | 'avto_maktab') => ({
      ...getCreateStudentFormValues({
        courseType,
        canAssignBranch: false,
        userBranchId: 'branch-1',
      }),
      first_name: 'Synthetic',
      last_name: 'Student',
      phone: '90 000 00 01',
      learner_password: 'synthetic1',
      // Negotiated price differs from any catalog price on purpose.
      total_price: 2_000_000,
      amount_paid: 300_000,
      initial_payment: 700_000,
    });

    it.each(['tezkor', 'avto_maktab'] as const)(
      'sends the selected course on %s create without changing any amount',
      (courseType) => {
        const values = createValues(courseType);
        const withoutCourse = toCreateStudentPayload(values, courseType, false);
        const withCourse = toCreateStudentPayload(
          { ...values, course_id: 'course-1' },
          courseType,
          false,
        );

        expect(withCourse.course_id).toBe('course-1');
        // The only difference is the association; money fields are identical.
        expect(withCourse).toEqual({ ...withoutCourse, course_id: 'course-1' });
        expect(withCourse.total_price).toBe(2_000_000);
        if (courseType === 'tezkor') {
          expect(withCourse.amount_paid).toBe(300_000);
          expect(withCourse).not.toHaveProperty('initial_payment');
        } else {
          expect(withCourse.initial_payment).toBe(700_000);
          expect(withCourse).not.toHaveProperty('amount_paid');
        }
      },
    );

    it('omits course_id when no course is selected', () => {
      const payload = toCreateStudentPayload(
        createValues('tezkor'),
        'tezkor',
        false,
      );
      expect(payload).not.toHaveProperty('course_id');
      expect(JSON.parse(JSON.stringify(payload))).not.toHaveProperty(
        'course_id',
      );
    });

    it.each(['tezkor', 'avto_maktab'] as const)(
      'never sends course_id while editing a %s student',
      (courseType) => {
        const payload = toCreateStudentPayload(
          {
            ...getEditStudentFormValues(STUDENT),
            total_price: 4_000_000,
            course_id: 'course-1',
          },
          courseType,
          true,
        );
        expect(payload).not.toHaveProperty('course_id');
      },
    );
  });
});
