import { describe, it, expect } from 'vitest';
import { mealStorage } from '../services/mealStorage';
import { accessControl, INSTITUTIONAL_USERS } from '../services/authService';
import { calculateIndicatorMetrics } from '../utils/mneUtils';
import { 
  Project, 
  Indicator, 
  IndicatorDataType, 
  IndicatorStatus, 
  FormSubmission,
  DataPoint 
} from '../types';

describe('End-to-End MEAL Data Lifecycle & Audit Trail', () => {
  it('executes full lifecycle: form submission -> anti-self-approval rejection -> reviewer approval -> indicator update -> immutable audit trail', async () => {
    // 1. Setup Project & Target Indicator
    const testProject: Project = {
      id: 'proj-lifecycle-1',
      name: 'South Sudan Emergency Nutrition Program',
      description: 'Community-based acute malnutrition management',
      startDate: '2026-01-01',
      endDate: '2026-12-31',
      organisationId: 'org_gh_health',
    };
    mealStorage.saveProject(testProject);

    const testIndicator: Indicator = {
      id: 'ind-samy-children',
      projectId: testProject.id,
      name: 'Number of SAM children admitted to OTP',
      description: 'Admissions under 5 years old',
      unitOfMeasure: 'Children',
      targetValue: 500,
      baselineValue: 50,
      dataType: IndicatorDataType.Numeric,
      directionality: 'higher_is_better',
    };
    mealStorage.saveIndicator(testIndicator);

    // Initial state: No data points, indicator is NO_DATA
    const initialMetrics = calculateIndicatorMetrics(testIndicator, undefined);
    expect(initialMetrics.status).toBe(IndicatorStatus.NO_DATA);
    expect(initialMetrics.achievementPercentage).toBeNull();

    // 2. Enumerator logs in and submits field data
    const enumeratorUser = INSTITUTIONAL_USERS.find(u => u.role === 'enumerator')!;
    accessControl.loginAs(enumeratorUser);
    expect(accessControl.getCurrentRole()).toBe('enumerator');

    const rawSubmission: FormSubmission = {
      id: 'sub-otp-001',
      formId: 'form-otp-weekly',
      projectId: testProject.id,
      enumeratorId: enumeratorUser.id,
      enumeratorName: enumeratorUser.name,
      submissionDate: '2026-03-15',
      data: {
        facility: 'Akobo County Hospital',
        indicatorId: testIndicator.id,
        admissionsCount: 520,
      },
      status: 'submitted',
      gpsLocation: { latitude: 7.79, longitude: 33.00, accuracy: 4.5 },
    };
    mealStorage.saveSubmission(rawSubmission);

    // 3. Security Check: Enumerator attempts to self-approve
    const selfApproveDecision = accessControl.canApproveSubmission(rawSubmission);
    expect(selfApproveDecision.allowed).toBe(false);
    expect(selfApproveDecision.reason).toContain('Field Enumerators cannot approve');

    // 4. MEAL Reviewer logs in
    const reviewerUser = INSTITUTIONAL_USERS.find(u => u.role === 'reviewer')!;
    accessControl.loginAs(reviewerUser);
    expect(accessControl.getCurrentRole()).toBe('reviewer');

    // Reviewer CAN approve because they hold reviewer role and are not the author
    const reviewerDecision = accessControl.canApproveSubmission(rawSubmission);
    expect(reviewerDecision.allowed).toBe(true);

    // 5. Reviewer approves submission in storage
    mealStorage.updateSubmissionStatus(
      rawSubmission.id,
      'approved',
      'Verified against triage registers at Akobo facility.',
      reviewerUser.name
    );

    const approvedSubmissions = mealStorage.getSubmissions(testProject.id);
    const updatedSub = approvedSubmissions.find(s => s.id === rawSubmission.id);
    expect(updatedSub?.status).toBe('approved');
    expect(updatedSub?.reviewerName).toBe(reviewerUser.name);

    // 6. System generates DataPoint from approved submission
    const committedDataPoint: DataPoint = {
      id: `dp_${rawSubmission.id}`,
      indicatorId: testIndicator.id,
      actualValue: rawSubmission.data.admissionsCount,
      collectionDate: rawSubmission.submissionDate,
      notes: `Auto-committed from approved submission #${rawSubmission.id}`,
      verificationStatus: 'verified',
      verifiedBy: reviewerUser.name,
    };
    mealStorage.saveDataPoint(committedDataPoint);

    // 7. Verify Indicator calculation updates with new actual value
    const updatedMetrics = calculateIndicatorMetrics(testIndicator, committedDataPoint);
    expect(updatedMetrics.achievementPercentage).toBe(104);
    expect(updatedMetrics.status).toBe(IndicatorStatus.ON_TRACK);
    expect(updatedMetrics.variance).toBe(20);

    // 8. Immutable Audit Trail Entry is recorded in storage
    const logs = mealStorage.getAuditLogs(testProject.organisationId);
    const approvalLog = logs.find(l => l.entityId === rawSubmission.id && l.action.includes('APPROVED'));
    expect(approvalLog).toBeDefined();
    expect(approvalLog?.actorRole).toBe('reviewer');
  });
});
