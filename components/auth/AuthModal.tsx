import React, { useState } from 'react';
import { UserRole } from '../../types';
import { accessControl } from '../../services/authService';
import Modal from '../ui/Modal';
import Input from '../ui/Input';
import Button from '../ui/Button';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAuthSuccess?: () => void;
}

type AuthMode = 'sign_in' | 'sign_up' | 'forgot_password';

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, onAuthSuccess }) => {
  const [mode, setMode] = useState<AuthMode>('sign_in');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [orgName, setOrgName] = useState('');
  const [role, setRole] = useState<UserRole>('meal_officer');

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const resetForm = () => {
    setEmail('');
    setPassword('');
    setName('');
    setOrgName('');
    setRole('meal_officer');
    setErrorMessage(null);
    setSuccessMessage(null);
  };

  const handleModeChange = (newMode: AuthMode) => {
    setMode(newMode);
    setErrorMessage(null);
    setSuccessMessage(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);
    setIsLoading(true);

    try {
      if (mode === 'sign_in') {
        const res = await accessControl.signIn(email.trim(), password);
        if (!res.success) {
          setErrorMessage(res.error || 'Invalid email or password.');
        } else {
          setSuccessMessage('Signed in successfully.');
          setTimeout(() => {
            resetForm();
            onClose();
            onAuthSuccess?.();
          }, 400);
        }
      } else if (mode === 'sign_up') {
        if (!name.trim()) {
          setErrorMessage('Full name is required.');
          setIsLoading(false);
          return;
        }
        if (password.length < 6) {
          setErrorMessage('Password must be at least 6 characters long.');
          setIsLoading(false);
          return;
        }

        const res = await accessControl.signUp(email.trim(), password, name.trim(), role, orgName.trim() || undefined);
        if (!res.success) {
          setErrorMessage(res.error || 'Failed to create account.');
        } else {
          setSuccessMessage('Account created and registered with Supabase! You are now signed in.');
          setTimeout(() => {
            resetForm();
            onClose();
            onAuthSuccess?.();
          }, 600);
        }
      } else if (mode === 'forgot_password') {
        const res = await accessControl.resetPassword(email.trim());
        if (!res.success) {
          setErrorMessage(res.error || 'Could not send reset link.');
        } else {
          setSuccessMessage('Password reset instructions sent to your email.');
        }
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'An unexpected authentication error occurred.');
    } finally {
      setIsLoading(false);
    }
  };

  const modalTitle = 
    mode === 'sign_in' ? 'Sign In to MEAL Insights OS' :
    mode === 'sign_up' ? 'Create Institutional Account' :
    'Reset Account Password';

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={modalTitle} size="md">
      <div className="space-y-4">
        {errorMessage && (
          <div className="p-3 bg-red-50 border border-red-200 rounded text-xs text-red-700 flex items-start gap-2">
            <span className="font-bold">Error:</span>
            <span>{errorMessage}</span>
          </div>
        )}

        {successMessage && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded text-xs text-emerald-800 flex items-start gap-2">
            <span className="font-bold">Success:</span>
            <span>{successMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3.5">
          {mode === 'sign_up' && (
            <>
              <Input
                label="Full Name"
                id="auth_name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Sarah Akello"
                required
              />
              <Input
                label="Organisation Name"
                id="auth_org"
                value={orgName}
                onChange={(e) => setOrgName(e.target.value)}
                placeholder="e.g. Save Communities International"
                required
              />
              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1">
                  Designated Institutional Role
                </label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as UserRole)}
                  className="w-full border border-neutral-300 rounded px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                >
                  <option value="meal_officer">MEAL Lead / Officer (Full Framework & Data Tools)</option>
                  <option value="project_manager">Project Manager (Timeline & Workplan Supervisor)</option>
                  <option value="reviewer">Data Quality Reviewer (Verification & Approval)</option>
                  <option value="enumerator">Field Enumerator (Data Collection & Submissions)</option>
                  <option value="org_admin">Organisation Administrator (Full Tenant Admin)</option>
                  <option value="analyst">Statistical Analyst (Dashboards & Analysis)</option>
                  <option value="viewer">Donor / Read-Only Auditor</option>
                </select>
              </div>
            </>
          )}

          <Input
            label="Email Address"
            id="auth_email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@organisation.org"
            required
          />

          {mode !== 'forgot_password' && (
            <div>
              <Input
                label="Password"
                id="auth_password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
              />
              {mode === 'sign_in' && (
                <div className="text-right mt-1">
                  <button
                    type="button"
                    onClick={() => handleModeChange('forgot_password')}
                    className="text-xs text-primary hover:underline"
                  >
                    Forgot password?
                  </button>
                </div>
              )}
            </div>
          )}

          <div className="pt-2">
            <Button
              type="submit"
              variant="primary"
              className="w-full justify-center"
              disabled={isLoading}
            >
              {isLoading ? 'Processing...' : (
                mode === 'sign_in' ? 'Sign In' :
                mode === 'sign_up' ? 'Register Account' :
                'Send Reset Link'
              )}
            </Button>
          </div>
        </form>

        <div className="border-t border-neutral-200 pt-3 text-center text-xs text-neutral-600">
          {mode === 'sign_in' ? (
            <p>
              Don't have an account yet?{' '}
              <button
                type="button"
                onClick={() => handleModeChange('sign_up')}
                className="font-semibold text-primary hover:underline"
              >
                Create Account
              </button>
            </p>
          ) : (
            <p>
              Already registered?{' '}
              <button
                type="button"
                onClick={() => handleModeChange('sign_in')}
                className="font-semibold text-primary hover:underline"
              >
                Sign In
              </button>
            </p>
          )}
        </div>
      </div>
    </Modal>
  );
};

export default AuthModal;
