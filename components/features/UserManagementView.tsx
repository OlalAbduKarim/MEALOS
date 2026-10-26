import React, { useState } from 'react';
import { UserProfile, UserRole } from '../../types';
import Card from '../ui/Card';
import Button from '../ui/Button';
import { UsersIcon, ShieldCheckIcon, PlusIcon } from '../../constants';
import { mealStorage } from '../../services/mealStorage';

interface UserManagementViewProps {
  currentRole: UserRole;
  onRoleChange: (newRole: UserRole) => void;
}

const DEFAULT_USERS: UserProfile[] = [
  { id: 'u_1', name: 'Dr. David Ssemwogerere', email: 'david.s@ghea.org', role: 'meal_officer', organisationId: 'org_gh_health', activeProjectIds: ['proj_001'] },
  { id: 'u_2', name: 'Grace Auma', email: 'grace.a@ghea.org', role: 'enumerator', organisationId: 'org_gh_health', activeProjectIds: ['proj_001'] },
  { id: 'u_3', name: 'Fatima Al-Mansoor', email: 'fatima.m@ghea.org', role: 'reviewer', organisationId: 'org_gh_health', activeProjectIds: ['proj_001'] },
  { id: 'u_4', name: 'Jean-Paul Kamau', email: 'jp.kamau@ghea.org', role: 'project_manager', organisationId: 'org_gh_health', activeProjectIds: ['proj_001'] },
  { id: 'u_5', name: 'System Security Lead', email: 'security@ghea.org', role: 'platform_admin', organisationId: 'org_gh_health', activeProjectIds: [] },
];

const ROLE_PERMISSIONS: Record<UserRole, { label: string; desc: string; permissions: string[] }> = {
  platform_admin: {
    label: 'Platform Administrator',
    desc: 'Unrestricted system-wide configuration, database maintenance, and tenant isolation management.',
    permissions: ['System Admin', 'Manage All Orgs', 'Audit Logs', 'Database Backups', 'Security Configuration']
  },
  org_admin: {
    label: 'Organisation Administrator',
    desc: 'Manages organisation projects, team membership invitations, and institutional reporting policies.',
    permissions: ['Manage Projects', 'Invite Users', 'Configure Settings', 'Approve Reports', 'Full Read/Write']
  },
  project_manager: {
    label: 'Project Manager',
    desc: 'Supervises project activity timelines, budgets, risk registers, and operational deliverables.',
    permissions: ['Manage Workplans', 'Update Risks', 'View All Indicators', 'Sign-off Reports', 'Commission Evaluations']
  },
  meal_officer: {
    label: 'MEAL Lead / Officer',
    desc: 'Designs LogFrames, Theory of Change, Indicator PIRS, data collection forms, and quality checks.',
    permissions: ['Design Frameworks', 'Build Forms', 'Manage Indicators', 'Run DQA Checks', 'Generate Reports']
  },
  reviewer: {
    label: 'Data Quality Reviewer',
    desc: 'Validates raw field submissions against facility ledgers and approves them into indicator points.',
    permissions: ['Review Submissions', 'Approve Data Points', 'Return for Correction', 'Run DQA Cleaning']
  },
  enumerator: {
    label: 'Field Enumerator / Data Collector',
    desc: 'Performs mobile field surveys, captures geotagged observations, and saves draft records.',
    permissions: ['Fill Forms', 'Submit Field Data', 'Save Draft Submissions', 'Capture GPS']
  },
  analyst: {
    label: 'Statistical Analyst / Researcher',
    desc: 'Accesses verified data for statistical calculations, cross-tabulations, and disaggregation.',
    permissions: ['Statistical Analysis', 'Export Data', 'View Dashboards', 'Inspect Indicators']
  },
  viewer: {
    label: 'Donor / Read-Only Viewer',
    desc: 'Audits approved reports, indicator tracking tables, and high-level project dashboards.',
    permissions: ['View Dashboards', 'View Approved Reports', 'Read Only ITT']
  }
};

export const UserManagementView: React.FC<UserManagementViewProps> = ({ currentRole, onRoleChange }) => {
  const [users, setUsers] = useState<UserProfile[]>(DEFAULT_USERS);
  const [isAdding, setIsAdding] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<UserRole>('enumerator');

  const handleAddUser = () => {
    if (!name.trim() || !email.trim()) {
      alert('User name and email are required.');
      return;
    }
    const newUser: UserProfile = {
      id: `u_${Date.now()}`,
      name,
      email,
      role,
      organisationId: mealStorage.getActiveOrganisationId(),
      activeProjectIds: ['proj_001']
    };
    setUsers(prev => [...prev, newUser]);
    setIsAdding(false);
    setName('');
    setEmail('');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-5 rounded-lg border border-neutral-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 bg-blue-50 text-primary rounded-md">
              <UsersIcon className="w-6 h-6" />
            </span>
            <div>
              <h2 className="text-xl font-bold text-neutral-800">User Management & Role-Based Access Control (RBAC)</h2>
              <p className="text-xs text-neutral-500">
                Configure organizational roles, granular permissions, field enumerator access, and persona testing.
              </p>
            </div>
          </div>
        </div>

        <Button onClick={() => setIsAdding(true)} leftIcon={<PlusIcon />}>
          Invite Team Member
        </Button>
      </div>

      {/* Active Persona Tester Banner */}
      <div className="bg-neutral-900 text-white p-4 rounded-xl shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-[10px] uppercase font-bold tracking-wider text-neutral-400">Interactive Role Persona Switcher</span>
          <h3 className="text-base font-bold text-white">Current Active Persona: <span className="text-emerald-400">{ROLE_PERMISSIONS[currentRole]?.label}</span></h3>
          <p className="text-xs text-neutral-300 mt-0.5 max-w-xl">
            {ROLE_PERMISSIONS[currentRole]?.desc}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <label className="text-xs text-neutral-400 font-semibold">Simulate Role:</label>
          <select 
            className="bg-neutral-800 text-white border border-neutral-700 rounded px-3 py-1.5 text-xs font-semibold focus:ring-2 focus:ring-emerald-400"
            value={currentRole}
            onChange={(e) => onRoleChange(e.target.value as UserRole)}
          >
            {Object.entries(ROLE_PERMISSIONS).map(([rKey, rVal]) => (
              <option key={rKey} value={rKey}>{rVal.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Team Roster Table */}
      <div className="bg-white rounded-lg border border-neutral-200 shadow-sm overflow-hidden">
        <div className="p-4 bg-neutral-50 border-b border-neutral-200">
          <h3 className="text-sm font-bold text-neutral-800">Team Roster ({users.length})</h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-neutral-100 text-neutral-600 text-xs uppercase font-semibold border-b">
              <tr>
                <th className="py-2.5 px-4">User</th>
                <th className="py-2.5 px-4">Email</th>
                <th className="py-2.5 px-4">Role Assigned</th>
                <th className="py-2.5 px-4">Role Permissions Summary</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100 text-xs">
              {users.map(u => {
                const rInfo = ROLE_PERMISSIONS[u.role];
                return (
                  <tr key={u.id} className="hover:bg-neutral-50">
                    <td className="py-3 px-4 font-bold text-neutral-800">
                      {u.name}
                    </td>
                    <td className="py-3 px-4 font-mono text-neutral-500">
                      {u.email}
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded font-semibold bg-blue-50 text-primary">
                        {rInfo?.label || u.role}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-neutral-600">
                      {rInfo?.permissions.join(' · ')}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Invite Member Modal */}
      {isAdding && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 space-y-4">
            <h3 className="text-base font-bold text-neutral-800">Invite New Team Member</h3>

            <div>
              <label className="block text-xs font-semibold text-neutral-700 mb-1">Full Name *</label>
              <input 
                type="text" 
                className="w-full px-3 py-2 border border-neutral-300 rounded text-sm focus:ring-2 focus:ring-primary"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Mariam Namubiru"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-700 mb-1">Institutional Email *</label>
              <input 
                type="email" 
                className="w-full px-3 py-2 border border-neutral-300 rounded text-sm focus:ring-2 focus:ring-primary"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="e.g., mariam.n@ghea.org"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-700 mb-1">Functional MEAL Role</label>
              <select 
                className="w-full px-3 py-2 border border-neutral-300 rounded text-sm bg-white"
                value={role}
                onChange={(e) => setRole(e.target.value as UserRole)}
              >
                {Object.entries(ROLE_PERMISSIONS).map(([k, v]) => (
                  <option key={k} value={k}>{v.label}</option>
                ))}
              </select>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t">
              <Button size="sm" variant="secondary" onClick={() => setIsAdding(false)}>Cancel</Button>
              <Button size="sm" onClick={handleAddUser}>Send Invitation</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagementView;
