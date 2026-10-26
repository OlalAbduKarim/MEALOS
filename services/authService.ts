import { UserProfile, UserRole, Project, FormSubmission, AccountabilityComplaint } from '../types';
import { mealStorage, getSafeStorage } from './mealStorage';

export interface UserSession {
  user: UserProfile;
  token: string;
  isAuthenticated: boolean;
  loginTime: string;
  expiresAt: number;
}

// Canonical institutional demo users for demonstration and testing without hardcoded passwords
export const INSTITUTIONAL_USERS: UserProfile[] = [
  {
    id: 'user_admin_01',
    name: 'Dr. David Ssemwogerere',
    email: 'david.admin@ghea.org',
    role: 'platform_admin',
    organisationId: 'org_gh_health',
    activeProjectIds: ['proj_001']
  },
  {
    id: 'user_meal_02',
    name: 'Sarah Akello',
    email: 'sarah.meal@ghea.org',
    role: 'meal_officer',
    organisationId: 'org_gh_health',
    activeProjectIds: ['proj_001']
  },
  {
    id: 'user_pm_03',
    name: 'Jean-Paul Kamau',
    email: 'jp.kamau@ghea.org',
    role: 'project_manager',
    organisationId: 'org_gh_health',
    activeProjectIds: ['proj_001']
  },
  {
    id: 'user_reviewer_04',
    name: 'Fatima Al-Mansoor',
    email: 'fatima.rev@ghea.org',
    role: 'reviewer',
    organisationId: 'org_gh_health',
    activeProjectIds: ['proj_001']
  },
  {
    id: 'user_enum_05',
    name: 'Grace Auma',
    email: 'grace.enum@ghea.org',
    role: 'enumerator',
    organisationId: 'org_gh_health',
    activeProjectIds: ['proj_001']
  },
  {
    id: 'user_donor_06',
    name: 'Eleanor Vance (FCDO Donor Representative)',
    email: 'eleanor.vance@fcdo.gov.uk',
    role: 'viewer',
    organisationId: 'org_gh_health',
    activeProjectIds: ['proj_001']
  }
];

class AccessControlService {
  private currentSession: UserSession | null = null;

  constructor() {
    this.restoreSession();
  }

  private restoreSession(): void {
    try {
      const storage = getSafeStorage();
      const stored = storage.getItem('meal_active_session');
      if (stored) {
        const parsed: UserSession = JSON.parse(stored);
        if (parsed.expiresAt > Date.now()) {
          this.currentSession = parsed;
          return;
        }
      }
    } catch (e) {
      console.warn('Could not restore session:', e);
    }

    // Default authenticated session with MEAL Officer persona
    this.loginAs(INSTITUTIONAL_USERS[1]);
  }

  loginAs(userProfile: UserProfile): UserSession {
    const session: UserSession = {
      user: userProfile,
      token: `sess_${userProfile.id}_${Date.now()}_${Math.random().toString(36).substr(2, 8)}`,
      isAuthenticated: true,
      loginTime: new Date().toISOString(),
      expiresAt: Date.now() + 8 * 60 * 60 * 1000 // 8 hours valid
    };

    this.currentSession = session;
    try {
      const storage = getSafeStorage();
      storage.setItem('meal_active_session', JSON.stringify(session));
      storage.setItem('meal_current_role', userProfile.role);
      storage.setItem('meal_current_org_id', userProfile.organisationId);
    } catch (e) {
      console.warn('Session write failed:', e);
    }

    mealStorage.logAudit(
      userProfile.organisationId,
      userProfile.activeProjectIds[0],
      'User Authenticated',
      'UserProfile',
      userProfile.id,
      `Signed in as ${userProfile.name} (${userProfile.role})`
    );

    return session;
  }

  logout(): void {
    if (this.currentSession) {
      mealStorage.logAudit(
        this.currentSession.user.organisationId,
        undefined,
        'User Signed Out',
        'UserProfile',
        this.currentSession.user.id,
        `Session ended for ${this.currentSession.user.name}`
      );
    }
    this.currentSession = null;
    try {
      const storage = getSafeStorage();
      storage.removeItem('meal_active_session');
    } catch (e) {
      console.warn('Session remove failed:', e);
    }
  }

  getCurrentUser(): UserProfile {
    if (!this.currentSession || this.currentSession.expiresAt < Date.now()) {
      return INSTITUTIONAL_USERS[1]; // Fallback to MEAL officer
    }
    return this.currentSession.user;
  }

  getCurrentRole(): UserRole {
    return this.getCurrentUser().role;
  }

  // --- Granular Security Policy Checks ---

  /**
   * Organisation Isolation Check:
   * Confirms user is authorized for the target organisation.
   */
  canAccessOrganisation(targetOrgId: string): boolean {
    const user = this.getCurrentUser();
    if (user.role === 'platform_admin') return true;
    return user.organisationId === targetOrgId;
  }

  /**
   * Project Access Check:
   * Confirms user can view the specific project.
   */
  canAccessProject(project: Project | null): boolean {
    if (!project) return false;
    const user = this.getCurrentUser();
    if (user.role === 'platform_admin') return true;
    if (project.organisationId && project.organisationId !== user.organisationId) return false;
    if (user.role === 'org_admin' || user.role === 'meal_officer') return true;
    if (user.activeProjectIds.length === 0) return true;
    return user.activeProjectIds.includes(project.id);
  }

  /**
   * Project Modification Check (Create, Edit, Delete Project):
   * Strictly forbids donor (viewer) and enumerator.
   */
  canMutateProject(project?: Project | null): boolean {
    const role = this.getCurrentRole();
    if (role === 'viewer' || role === 'enumerator' || role === 'analyst') return false;
    if (role === 'platform_admin' || role === 'org_admin' || role === 'project_manager') return true;
    return false;
  }

  /**
   * Indicator Mutation Check (Add, Edit, Delete Indicator):
   * Strictly forbids donor (viewer), enumerator.
   */
  canMutateIndicator(): boolean {
    const role = this.getCurrentRole();
    return role === 'platform_admin' || role === 'org_admin' || role === 'meal_officer' || role === 'project_manager';
  }

  /**
   * Data Point & Submission Approval Check:
   * Rule 1: Must hold reviewer, meal_officer, org_admin, or platform_admin role.
   * Rule 2: Anti-Self-Approval Policy: An enumerator/collector cannot approve their own submission!
   */
  canApproveSubmission(submission: FormSubmission): { allowed: boolean; reason?: string } {
    const user = this.getCurrentUser();
    const role = user.role;

    if (role === 'viewer') {
      return { allowed: false, reason: 'Donor / Viewers have strictly read-only access.' };
    }

    if (role === 'enumerator') {
      return { allowed: false, reason: 'Field Enumerators cannot approve submissions.' };
    }

    if (role === 'analyst') {
      return { allowed: false, reason: 'Statistical Analysts cannot approve raw field records.' };
    }

    // Anti-Self-Approval Enforcement
    if (submission.enumeratorId === user.id) {
      return { allowed: false, reason: 'Policy Violation: Field collectors cannot approve their own submissions.' };
    }

    const authorizedRoles: UserRole[] = ['platform_admin', 'org_admin', 'meal_officer', 'reviewer'];
    if (!authorizedRoles.includes(role)) {
      return { allowed: false, reason: `Role ${role} is not authorized to approve submissions.` };
    }

    return { allowed: true };
  }

  /**
   * Safeguarding & Confidential Grievances Access Check:
   * Core Humanitarian Standard Commitment 5 requires strict confidentiality.
   * Restricts sensitive records from Donors, Enumerators, and general staff.
   */
  canAccessSafeguardingRecord(complaint: AccountabilityComplaint): boolean {
    if (!complaint.isSafeguardingSensitive) return true;
    const role = this.getCurrentRole();
    // Only platform admin, org admin, and designated meal lead can access sensitive cases
    return role === 'platform_admin' || role === 'org_admin' || role === 'meal_officer';
  }

  /**
   * Report Publication & Sign-off Check:
   */
  canPublishReport(): boolean {
    const role = this.getCurrentRole();
    return role === 'platform_admin' || role === 'org_admin' || role === 'project_manager' || role === 'meal_officer';
  }

  /**
   * Audit Log Inspection Check:
   */
  canViewAuditLogs(): boolean {
    const role = this.getCurrentRole();
    return role === 'platform_admin' || role === 'org_admin' || role === 'meal_officer';
  }

  /**
   * General Read-Only Guard:
   */
  isReadOnly(): boolean {
    return this.getCurrentRole() === 'viewer';
  }
}

export const accessControl = new AccessControlService();
