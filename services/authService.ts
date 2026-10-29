import { UserProfile, UserRole, Project, FormSubmission, AccountabilityComplaint, Organisation } from '../types';
import { mealStorage, getSafeStorage } from './mealStorage';
import { supabase } from './supabaseClient';

export interface UserSession {
  user: UserProfile;
  token: string;
  isAuthenticated: boolean;
  loginTime: string;
  expiresAt: number;
}

// Reference institutional profiles for testing & permission verification fixtures
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
    name: 'Eleanor Vance',
    email: 'eleanor.vance@fcdo.gov.uk',
    role: 'viewer',
    organisationId: 'org_gh_health',
    activeProjectIds: ['proj_001']
  }
];

const GUEST_USER: UserProfile = {
  id: 'guest',
  name: 'Guest User',
  email: '',
  role: 'viewer',
  organisationId: '',
  activeProjectIds: []
};

class AccessControlService {
  private currentSession: UserSession | null = null;
  private authSubscribers: Array<(session: UserSession | null) => void> = [];

  constructor() {
    this.restoreSession();
    this.initSupabaseAuth();
  }

  private async initSupabaseAuth() {
    if (!supabase) return;
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        await this.syncSupabaseUser(session.user, session.access_token);
      }

      supabase.auth.onAuthStateChange(async (event, session) => {
        if (event === 'SIGNED_IN' && session?.user) {
          await this.syncSupabaseUser(session.user, session.access_token);
        } else if (event === 'SIGNED_OUT') {
          this.currentSession = null;
          this.persistSession(null);
          this.notifySubscribers();
        }
      });
    } catch (e) {
      console.warn('[AuthService] Supabase session check notice:', e);
    }
  }

  private async syncSupabaseUser(sbUser: any, token: string) {
    let profile: UserProfile | null = null;
    if (supabase) {
      try {
        const { data } = await supabase.from('user_profiles').select('*').eq('id', sbUser.id).maybeSingle();
        if (data) {
          profile = {
            id: data.id,
            email: data.email,
            name: data.name,
            role: data.role as UserRole,
            organisationId: data.organisation_id,
            activeProjectIds: data.active_project_ids || []
          };
        }
      } catch (err) {
        console.warn('[AuthService] User profile query notice:', err);
      }
    }

    if (!profile) {
      const metadata = sbUser.user_metadata || {};
      const orgId = metadata.organisation_id || `org_${sbUser.id.substring(0, 8)}`;
      profile = {
        id: sbUser.id,
        email: sbUser.email || '',
        name: metadata.name || sbUser.email?.split('@')[0] || 'MEAL Professional',
        role: (metadata.role as UserRole) || 'meal_officer',
        organisationId: orgId,
        activeProjectIds: []
      };

      // Persist profile to Supabase user_profiles if connected
      if (supabase) {
        try {
          // Check if organisation exists
          const { data: existingOrg } = await supabase.from('organisations').select('id').eq('id', orgId).maybeSingle();
          if (!existingOrg) {
            await supabase.from('organisations').insert({
              id: orgId,
              name: metadata.organisation_name || `${profile.name}'s Organisation`,
              code: 'ORG',
              currency: 'USD ($)'
            });
          }

          await supabase.from('user_profiles').upsert({
            id: profile.id,
            email: profile.email,
            name: profile.name,
            role: profile.role,
            organisation_id: profile.organisationId,
            active_project_ids: profile.activeProjectIds
          });
        } catch (e) {
          console.warn('[AuthService] Profile auto-provision notice:', e);
        }
      }
    }

    const session: UserSession = {
      user: profile,
      token: token || `sess_${profile.id}`,
      isAuthenticated: true,
      loginTime: new Date().toISOString(),
      expiresAt: Date.now() + 24 * 60 * 60 * 1000
    };

    this.currentSession = session;
    this.persistSession(session);
    this.notifySubscribers();
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
    // No mock auto-login. Start unauthenticated if no stored valid session.
    this.currentSession = null;
  }

  private persistSession(session: UserSession | null): void {
    try {
      const storage = getSafeStorage();
      if (session) {
        storage.setItem('meal_active_session', JSON.stringify(session));
        storage.setItem('meal_current_role', session.user.role);
        storage.setItem('meal_current_org_id', session.user.organisationId);
      } else {
        storage.removeItem('meal_active_session');
      }
    } catch (e) {
      console.warn('Session persistence error:', e);
    }
  }

  private notifySubscribers(): void {
    this.authSubscribers.forEach(cb => {
      try { cb(this.currentSession); } catch (e) { console.error(e); }
    });
  }

  public onAuthChange(callback: (session: UserSession | null) => void): () => void {
    this.authSubscribers.push(callback);
    callback(this.currentSession);
    return () => {
      this.authSubscribers = this.authSubscribers.filter(cb => cb !== callback);
    };
  }

  // --- Real Supabase Auth Methods ---
  async signUp(email: string, password: string, name: string, role: UserRole, orgName?: string): Promise<{ success: boolean; error?: string }> {
    if (!supabase) {
      return { success: false, error: 'Database authentication client is unavailable.' };
    }
    try {
      const orgId = `org_${Math.random().toString(36).substring(2, 9)}`;
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name,
            role,
            organisation_id: orgId,
            organisation_name: orgName || `${name}'s Organisation`
          }
        }
      });

      if (error) {
        return { success: false, error: error.message };
      }

      if (data.user) {
        // Create initial organisation
        await supabase.from('organisations').insert({
          id: orgId,
          name: orgName || `${name}'s Organisation`,
          code: orgName ? orgName.substring(0, 4).toUpperCase() : 'MEAL',
          currency: 'USD ($)'
        });

        // Create user profile
        await supabase.from('user_profiles').insert({
          id: data.user.id,
          email: data.user.email!,
          name,
          role,
          organisation_id: orgId,
          active_project_ids: []
        });

        if (data.session) {
          await this.syncSupabaseUser(data.user, data.session.access_token);
        }
      }

      return { success: true };
    } catch (e: any) {
      return { success: false, error: e.message || 'An unexpected error occurred during registration.' };
    }
  }

  async signIn(email: string, password: string): Promise<{ success: boolean; error?: string }> {
    if (!supabase) {
      return { success: false, error: 'Database authentication client is unavailable.' };
    }
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        return { success: false, error: error.message };
      }

      if (data.session && data.user) {
        await this.syncSupabaseUser(data.user, data.session.access_token);
      }

      return { success: true };
    } catch (e: any) {
      return { success: false, error: e.message || 'Failed to authenticate user.' };
    }
  }

  async signOut(): Promise<void> {
    if (supabase) {
      try {
        await supabase.auth.signOut();
      } catch (e) {
        console.warn('Supabase signOut notice:', e);
      }
    }
    this.logout();
  }

  async resetPassword(email: string): Promise<{ success: boolean; error?: string }> {
    if (!supabase) {
      return { success: false, error: 'Database authentication client is unavailable.' };
    }
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email);
      if (error) return { success: false, error: error.message };
      return { success: true };
    } catch (e: any) {
      return { success: false, error: e.message || 'Failed to request password reset.' };
    }
  }

  loginAs(userProfile: UserProfile): UserSession {
    const session: UserSession = {
      user: userProfile,
      token: `sess_${userProfile.id}_${Date.now()}`,
      isAuthenticated: true,
      loginTime: new Date().toISOString(),
      expiresAt: Date.now() + 8 * 60 * 60 * 1000
    };

    this.currentSession = session;
    this.persistSession(session);
    this.notifySubscribers();

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
    this.persistSession(null);
    this.notifySubscribers();
  }

  getCurrentSession(): UserSession | null {
    return this.currentSession;
  }

  isAuthenticated(): boolean {
    return this.currentSession !== null && this.currentSession.expiresAt > Date.now();
  }

  getCurrentUser(): UserProfile {
    if (!this.currentSession || this.currentSession.expiresAt < Date.now()) {
      return GUEST_USER;
    }
    return this.currentSession.user;
  }

  getCurrentRole(): UserRole {
    return this.getCurrentUser().role;
  }

  // --- Granular Security Policy Checks ---
  canAccessOrganisation(targetOrgId: string): boolean {
    const user = this.getCurrentUser();
    if (user.role === 'platform_admin') return true;
    return user.organisationId === targetOrgId;
  }

  canAccessProject(project: Project | null): boolean {
    if (!project) return false;
    const user = this.getCurrentUser();
    if (user.role === 'platform_admin') return true;
    if (project.organisationId && user.organisationId && project.organisationId !== user.organisationId) return false;
    if (user.role === 'org_admin' || user.role === 'meal_officer') return true;
    if (user.activeProjectIds.length === 0) return true;
    return user.activeProjectIds.includes(project.id);
  }

  canMutateProject(project?: Project | null): boolean {
    const role = this.getCurrentRole();
    if (role === 'viewer' || role === 'enumerator' || role === 'analyst') return false;
    if (role === 'platform_admin' || role === 'org_admin' || role === 'project_manager') return true;
    return false;
  }

  canMutateIndicator(): boolean {
    const role = this.getCurrentRole();
    return role === 'platform_admin' || role === 'org_admin' || role === 'meal_officer' || role === 'project_manager';
  }

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

    if (submission.enumeratorId === user.id) {
      return { allowed: false, reason: 'Policy Violation: Field collectors cannot approve their own submissions.' };
    }

    const authorizedRoles: UserRole[] = ['platform_admin', 'org_admin', 'meal_officer', 'reviewer'];
    if (!authorizedRoles.includes(role)) {
      return { allowed: false, reason: `Role ${role} is not authorized to approve submissions.` };
    }

    return { allowed: true };
  }

  canAccessSafeguardingRecord(complaint: AccountabilityComplaint): boolean {
    if (!complaint.isSafeguardingSensitive) return true;
    const role = this.getCurrentRole();
    return role === 'platform_admin' || role === 'org_admin' || role === 'meal_officer';
  }

  canPublishReport(): boolean {
    const role = this.getCurrentRole();
    return role === 'platform_admin' || role === 'org_admin' || role === 'project_manager' || role === 'meal_officer';
  }

  canViewAuditLogs(): boolean {
    const role = this.getCurrentRole();
    return role === 'platform_admin' || role === 'org_admin' || role === 'meal_officer';
  }

  isReadOnly(): boolean {
    return this.getCurrentRole() === 'viewer';
  }
}

export const accessControl = new AccessControlService();
