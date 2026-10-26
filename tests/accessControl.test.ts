import { describe, it, expect, beforeEach } from 'vitest';
import { accessControl, INSTITUTIONAL_USERS } from '../services/authService';
import { FormSubmission, AccountabilityComplaint, Project } from '../types';

describe('Security & Access Control Tests (RBAC & Safeguarding)', () => {

  const testProject: Project = {
    id: 'proj_001',
    name: 'Maternal Health Programme',
    description: 'Test',
    startDate: '2023-01-01',
    endDate: '2025-12-31',
    organisationId: 'org_gh_health'
  };

  const sampleSubmission: FormSubmission = {
    id: 'sub_test_01',
    formId: 'form_01',
    projectId: 'proj_001',
    enumeratorId: 'user_enum_05', // Grace Auma
    enumeratorName: 'Grace Auma',
    submissionDate: '2024-03-01T10:00:00Z',
    status: 'submitted',
    data: { anc_count: 50 }
  };

  const safeguardingComplaint: AccountabilityComplaint = {
    id: 'comp_sg_01',
    projectId: 'proj_001',
    referenceCode: 'COMP-2024-SG1',
    category: 'Safeguarding',
    channel: 'Helpline',
    isAnonymous: true,
    description: 'Sensitive safeguarding concern',
    isSafeguardingSensitive: true,
    status: 'received',
    assignedTo: 'Lead Safeguarding Officer',
    dateReceived: '2024-03-01'
  };

  const standardComplaint: AccountabilityComplaint = {
    id: 'comp_std_01',
    projectId: 'proj_001',
    referenceCode: 'COMP-2024-STD1',
    category: 'Service Delivery',
    channel: 'Suggestion Box',
    isAnonymous: true,
    description: 'Clinic waiting time feedback',
    isSafeguardingSensitive: false,
    status: 'received',
    assignedTo: 'Clinic Supervisor',
    dateReceived: '2024-03-01'
  };

  beforeEach(() => {
    accessControl.logout();
  });

  // 1. Donor (Viewer) Restrictions
  it('strictly enforces read-only access for donor (viewer) role', () => {
    const donor = INSTITUTIONAL_USERS.find(u => u.role === 'viewer')!;
    accessControl.loginAs(donor);

    expect(accessControl.isReadOnly()).toBe(true);
    expect(accessControl.canMutateProject(testProject)).toBe(false);
    expect(accessControl.canMutateIndicator()).toBe(false);

    const approval = accessControl.canApproveSubmission(sampleSubmission);
    expect(approval.allowed).toBe(false);
    expect(approval.reason).toContain('read-only');
  });

  // 2. Anti-Self-Approval Enforcement
  it('prohibits an enumerator from approving their own field submission', () => {
    const enumerator = INSTITUTIONAL_USERS.find(u => u.id === 'user_enum_05')!;
    accessControl.loginAs(enumerator);

    const approvalResult = accessControl.canApproveSubmission(sampleSubmission);
    expect(approvalResult.allowed).toBe(false);
    expect(approvalResult.reason).toContain('Field Enumerators cannot approve submissions');
  });

  // 3. Authorized Reviewer Can Approve Submissions
  it('allows an authorized reviewer to approve submissions from other collectors', () => {
    const reviewer = INSTITUTIONAL_USERS.find(u => u.role === 'reviewer')!;
    accessControl.loginAs(reviewer);

    const approvalResult = accessControl.canApproveSubmission(sampleSubmission);
    expect(approvalResult.allowed).toBe(true);
  });

  // 4. Reviewer blocked from self-approval if they are also the author
  it('blocks a reviewer if they authored the submission themselves', () => {
    const reviewer = INSTITUTIONAL_USERS.find(u => u.role === 'reviewer')!;
    accessControl.loginAs(reviewer);

    const selfAuthoredSubmission: FormSubmission = {
      ...sampleSubmission,
      enumeratorId: reviewer.id // Same author as reviewer!
    };

    const approvalResult = accessControl.canApproveSubmission(selfAuthoredSubmission);
    expect(approvalResult.allowed).toBe(false);
    expect(approvalResult.reason).toContain('Policy Violation');
  });

  // 5. Confidential Safeguarding Access Restrictions
  it('restricts sensitive safeguarding records from donors and enumerators', () => {
    const donor = INSTITUTIONAL_USERS.find(u => u.role === 'viewer')!;
    accessControl.loginAs(donor);
    expect(accessControl.canAccessSafeguardingRecord(safeguardingComplaint)).toBe(false);
    expect(accessControl.canAccessSafeguardingRecord(standardComplaint)).toBe(true);

    const enumerator = INSTITUTIONAL_USERS.find(u => u.role === 'enumerator')!;
    accessControl.loginAs(enumerator);
    expect(accessControl.canAccessSafeguardingRecord(safeguardingComplaint)).toBe(false);
    expect(accessControl.canAccessSafeguardingRecord(standardComplaint)).toBe(true);
  });

  // 6. Authorized Safeguarding Access for MEAL Lead & Admin
  it('permits authorized MEAL lead and administrators to access safeguarding records', () => {
    const mealLead = INSTITUTIONAL_USERS.find(u => u.role === 'meal_officer')!;
    accessControl.loginAs(mealLead);
    expect(accessControl.canAccessSafeguardingRecord(safeguardingComplaint)).toBe(true);

    const admin = INSTITUTIONAL_USERS.find(u => u.role === 'platform_admin')!;
    accessControl.loginAs(admin);
    expect(accessControl.canAccessSafeguardingRecord(safeguardingComplaint)).toBe(true);
  });

  // 7. Organisation Boundary Isolation
  it('enforces tenant boundary isolation between organisations', () => {
    const mealLead = INSTITUTIONAL_USERS.find(u => u.role === 'meal_officer')!; // Org GHEA
    accessControl.loginAs(mealLead);

    expect(accessControl.canAccessOrganisation('org_gh_health')).toBe(true);
    expect(accessControl.canAccessOrganisation('org_other_tenant')).toBe(false);
  });

});
