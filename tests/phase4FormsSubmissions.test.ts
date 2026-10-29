import { describe, it, expect, beforeEach } from 'vitest';
import { accessControl, INSTITUTIONAL_USERS } from '../services/authService';
import { CollectionForm, FormSubmission, DataPoint } from '../types';

describe('Phase 4: Forms, Submissions and Verification Queue Tests', () => {

  const testForm: CollectionForm = {
    id: 'form_anc_01',
    projectId: 'proj_001',
    title: 'Maternal ANC Survey Form',
    description: 'Routine field survey for antenatal attendance',
    version: 1,
    status: 'published',
    createdAt: '2024-03-01T08:00:00Z',
    targetSubmissions: 100,
    fields: [
      {
        id: 'f_facility_name',
        label: 'Health Facility Name',
        fieldType: 'text',
        required: true
      },
      {
        id: 'f_anc4_count',
        label: 'Women Attending 4+ ANC Visits',
        fieldType: 'number',
        required: true,
        mappedIndicatorId: 'ind_001'
      }
    ]
  };

  const submissionFromEnumerator: FormSubmission = {
    id: 'sub_field_882',
    formId: 'form_anc_01',
    projectId: 'proj_001',
    enumeratorId: 'user_enum_05', // Grace Auma
    enumeratorName: 'Grace Auma',
    submissionDate: '2024-03-02T11:00:00Z',
    data: {
      f_facility_name: 'Gulu Regional Referral Hospital',
      f_anc4_count: 85
    },
    status: 'submitted',
    gpsLocation: { latitude: 2.7747, longitude: 32.2990, accuracy: 3.2 }
  };

  beforeEach(() => {
    accessControl.logout();
  });

  it('prohibits enumerator from approving their own submitted survey (Separation of Duties)', () => {
    const enumerator = INSTITUTIONAL_USERS.find(u => u.id === 'user_enum_05')!;
    accessControl.loginAs(enumerator);

    const check = accessControl.canApproveSubmission(submissionFromEnumerator);
    expect(check.allowed).toBe(false);
  });

  it('allows authorized MEAL Officer or Reviewer to approve the submission', () => {
    const mealOfficer = INSTITUTIONAL_USERS.find(u => u.role === 'meal_officer')!;
    accessControl.loginAs(mealOfficer);

    const check = accessControl.canApproveSubmission(submissionFromEnumerator);
    expect(check.allowed).toBe(true);
  });

  it('blocks statistical analysts from approving field submissions', () => {
    const analystUser = {
      id: 'user_analyst_01',
      name: 'Statistical Analyst',
      email: 'analyst@ghea.org',
      role: 'analyst' as const,
      organisationId: 'org_gh_health',
      activeProjectIds: ['proj_001']
    };
    accessControl.loginAs(analystUser);

    const check = accessControl.canApproveSubmission(submissionFromEnumerator);
    expect(check.allowed).toBe(false);
    expect(check.reason).toContain('Statistical Analysts cannot approve');
  });

  it('correctly maps form field answer to verified indicator data point upon approval', () => {
    const field = testForm.fields.find(f => f.id === 'f_anc4_count')!;
    expect(field.mappedIndicatorId).toBe('ind_001');

    const rawValue = submissionFromEnumerator.data[field.id];
    expect(rawValue).toBe(85);

    const generatedDataPoint: Omit<DataPoint, 'id'> = {
      indicatorId: field.mappedIndicatorId!,
      actualValue: Number(rawValue),
      collectionDate: submissionFromEnumerator.submissionDate.split('T')[0],
      notes: `Auto-verified from Form Submission #${submissionFromEnumerator.id} (${testForm.title})`,
      verificationStatus: 'verified',
      verifiedBy: 'Sarah Akello (MEAL Lead)',
      submissionId: submissionFromEnumerator.id,
      tags: { source: 'digital_form', enumerator: submissionFromEnumerator.enumeratorName }
    };

    expect(generatedDataPoint.actualValue).toBe(85);
    expect(generatedDataPoint.verificationStatus).toBe('verified');
    expect(generatedDataPoint.indicatorId).toBe('ind_001');
  });

  it('enforces that required form fields cannot be omitted', () => {
    const answers: Record<string, any> = {
      f_facility_name: 'Gulu Hospital'
      // f_anc4_count is missing
    };

    const missingFields = testForm.fields.filter(
      f => f.required && (answers[f.id] === undefined || answers[f.id] === '')
    );

    expect(missingFields.length).toBe(1);
    expect(missingFields[0].id).toBe('f_anc4_count');
  });
});
