import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import type { InternalAxiosRequestConfig } from 'axios';
import axiosInstance from '@/api/axiosInstance';
import { useAuthStore } from '@/store/authStore';
import { createTrainingProgram } from './trainingService';
import type { CreateTrainingProgramRequest } from '../types';

const request: CreateTrainingProgramRequest = {
  branch_id: 'branch-selected',
  name: 'Synthetic program',
  course_type: 'avto_maktab',
  category: 'B',
  required_minutes: 120,
};

describe('training program create request scope', () => {
  let received: InternalAxiosRequestConfig;
  const originalAdapter = axiosInstance.defaults.adapter;

  beforeEach(() => {
    localStorage.clear();
    useAuthStore.getState().setAuth('synthetic-token', {
      id: 'synthetic-owner',
      email: 'synthetic@example.test',
      role: 'owner',
    });
    useAuthStore.getState().setActiveBranch('branch-active');
    axiosInstance.defaults.adapter = async (config) => {
      received = config;
      return {
        config,
        status: 200,
        statusText: 'OK',
        headers: {},
        data: { data: { id: 'synthetic-program' } },
      };
    };
  });

  afterEach(() => {
    axiosInstance.defaults.adapter = originalAdapter;
  });

  it('sends the selected program branch without changing the active branch', async () => {
    await createTrainingProgram(request);
    expect(received.headers.get('X-Branch-Id')).toBe(request.branch_id);
    expect(JSON.parse(received.data as string)).toEqual(request);
    expect(useAuthStore.getState().activeBranchId).toBe('branch-active');
    expect(received.headers.get('Authorization')).toBe(
      'Bearer synthetic-token',
    );
  });

  it('preserves a case-insensitive explicit header only for program creation', async () => {
    await axiosInstance.request({
      method: 'POST',
      url: '/training-programs',
      data: request,
      headers: { 'x-branch-id': 'branch-selected' },
    });
    expect(received.headers.get('X-Branch-Id')).toBe('branch-selected');
  });

  it.each([undefined, '', '   '])(
    'keeps the active branch fallback for a missing or empty header (%s)',
    async (header) => {
      await axiosInstance.post('/training-programs', request, {
        headers: header === undefined ? {} : { 'X-Branch-Id': header },
      });
      expect(received.headers.get('X-Branch-Id')).toBe('branch-active');
    },
  );

  it.each([
    ['get', '/training-programs'],
    ['patch', '/training-programs/synthetic-program'],
    ['post', '/students'],
  ])('preserves existing active scope for %s %s', async (method, url) => {
    await axiosInstance.request({
      method,
      url,
      data: request,
      headers: { 'X-Branch-Id': 'branch-selected' },
    });
    expect(received.headers.get('X-Branch-Id')).toBe('branch-active');
  });

  it('leaves conflicting explicit header and body for server rejection', async () => {
    await axiosInstance.post(
      '/training-programs',
      { ...request, branch_id: 'branch-other' },
      { headers: { 'X-Branch-Id': 'branch-selected' } },
    );
    expect(received.headers.get('X-Branch-Id')).toBe('branch-selected');
    expect(JSON.parse(received.data as string).branch_id).toBe('branch-other');
  });

  it('preserves the permissions endpoint header exception', async () => {
    await axiosInstance.get('/permissions/options', {
      params: { resource: 'training_programs', branch_id: 'branch-selected' },
    });
    expect(received.headers.get('X-Branch-Id')).toBeUndefined();
  });
});
