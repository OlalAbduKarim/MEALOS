import React, { useState } from 'react';
import { Project, AccountabilityComplaint } from '../../types';
import Card from '../ui/Card';
import Button from '../ui/Button';
import { PlusIcon, ShieldCheckIcon, ChatAlt2Icon } from '../../constants';
import { mealStorage } from '../../services/mealStorage';
import { accessControl } from '../../services/authService';

interface AccountabilityViewProps {
  activeProject: Project | null;
}

export const AccountabilityView: React.FC<AccountabilityViewProps> = ({ activeProject }) => {
  const [complaints, setComplaints] = useState<AccountabilityComplaint[]>(() => {
    return mealStorage.getComplaints(activeProject?.id);
  });

  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [isLogging, setIsLogging] = useState(false);
  const [selectedComplaint, setSelectedComplaint] = useState<AccountabilityComplaint | null>(null);
  const [resolutionText, setResolutionText] = useState('');

  // New Complaint Form State
  const [cat, setCat] = useState<AccountabilityComplaint['category']>('Service Delivery');
  const [channel, setChannel] = useState<AccountabilityComplaint['channel']>('Suggestion Box');
  const [isAnon, setIsAnon] = useState(true);
  const [complainantName, setComplainantName] = useState('');
  const [desc, setDesc] = useState('');
  const [isSafeguarding, setIsSafeguarding] = useState(false);

  const reload = () => {
    setComplaints(mealStorage.getComplaints(activeProject?.id));
  };

  const handleSaveComplaint = () => {
    if (!activeProject || !desc.trim()) {
      alert('Description of complaint or feedback is required.');
      return;
    }

    const refNum = `COMP-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`;
    const newComplaint: AccountabilityComplaint = {
      id: `comp_${Date.now()}`,
      projectId: activeProject.id,
      referenceCode: refNum,
      category: cat,
      channel,
      isAnonymous: isAnon,
      complainantName: isAnon ? undefined : complainantName,
      description: desc,
      isSafeguardingSensitive: isSafeguarding,
      status: 'received',
      assignedTo: isSafeguarding ? 'Lead Safeguarding Officer' : 'Field MEAL Officer',
      dateReceived: new Date().toISOString().split('T')[0]
    };

    mealStorage.saveComplaint(newComplaint);
    reload();
    setIsLogging(false);
    setDesc('');
    setComplainantName('');
  };

  const handleUpdateStatus = (comp: AccountabilityComplaint, newStatus: AccountabilityComplaint['status']) => {
    const updated: AccountabilityComplaint = {
      ...comp,
      status: newStatus,
      resolutionSummary: resolutionText || comp.resolutionSummary,
      resolvedAt: newStatus === 'resolved' || newStatus === 'closed' ? new Date().toISOString() : undefined
    };
    mealStorage.saveComplaint(updated);
    reload();
    setSelectedComplaint(null);
    setResolutionText('');
  };

  const hiddenSafeguardingCount = complaints.filter(
    c => c.isSafeguardingSensitive && !accessControl.canAccessSafeguardingRecord(c)
  ).length;

  const filtered = complaints.filter(c => {
    if (categoryFilter !== 'all' && c.category !== categoryFilter) return false;
    if (c.isSafeguardingSensitive && !accessControl.canAccessSafeguardingRecord(c)) {
      return false;
    }
    return true;
  });

  if (!activeProject) {
    return (
      <div className="p-8 text-center bg-white rounded-lg border border-neutral-200">
        <p className="text-neutral-600">Please select an active project to view Accountability & Safeguarding.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-5 rounded-lg border border-neutral-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 bg-rose-50 text-rose-700 rounded-md">
              <ChatAlt2Icon className="w-6 h-6" />
            </span>
            <div>
              <h2 className="text-xl font-bold text-neutral-800">Accountability, Beneficiary Feedback & Safeguarding</h2>
              <p className="text-xs text-neutral-500">
                Community complaints response mechanism (CRM), confidential safeguarding channel, and closed-loop feedback.
              </p>
            </div>
          </div>
        </div>

        <Button onClick={() => setIsLogging(true)} leftIcon={<PlusIcon />}>
          Log Feedback / Complaint
        </Button>
      </div>

      {/* Safeguarding notice banner */}
      <div className="bg-amber-50 border-l-4 border-amber-500 p-4 rounded-r-lg text-xs text-amber-900 flex items-start gap-3">
        <ShieldCheckIcon className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
        <div>
          <strong className="font-bold">Core Humanitarian Standard (CHS) Commitment 5:</strong> Communities and people affected by crisis have access to safe, confidential, and responsive mechanisms to voice feedback and report sensitive concerns.
        </div>
      </div>

      {hiddenSafeguardingCount > 0 && (
        <div className="bg-rose-50 border border-rose-200 p-3 rounded-lg text-xs text-rose-800 flex items-center gap-2">
          <span className="font-bold text-sm">🔒</span>
          <span>
            <strong>Confidential Protection Notice:</strong> {hiddenSafeguardingCount} sensitive safeguarding record(s) are active in this project and withheld under confidentiality rules for your current role ({accessControl.getCurrentRole()}). Access is restricted strictly to authorized Safeguarding Leads and Platform Administrators.
          </span>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center gap-2 bg-neutral-100 p-1.5 rounded-lg text-xs">
        {['all', 'Service Delivery', 'Staff Conduct', 'Safeguarding', 'Fraud/Corruption', 'Feedback'].map(c => (
          <button
            key={c}
            onClick={() => setCategoryFilter(c)}
            className={`px-3 py-1 rounded font-semibold capitalize transition ${
              categoryFilter === c ? 'bg-white text-primary shadow-xs' : 'text-neutral-600 hover:text-neutral-900'
            }`}
          >
            {c}
          </button>
        ))}
      </div>

      {/* Complaints List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filtered.map(comp => {
          const isSafeguard = comp.isSafeguardingSensitive;
          const statusBg: Record<string, string> = {
            received: 'bg-blue-100 text-blue-800',
            under_investigation: 'bg-amber-100 text-amber-800',
            resolved: 'bg-emerald-100 text-emerald-800',
            closed: 'bg-neutral-100 text-neutral-700'
          };

          return (
            <Card key={comp.id} className="flex flex-col justify-between hover:shadow-md transition">
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="font-mono text-xs font-bold text-neutral-800 bg-neutral-100 px-2 py-0.5 rounded">
                    {comp.referenceCode}
                  </span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${statusBg[comp.status] || 'bg-neutral-100'}`}>
                    {comp.status.replace('_', ' ')}
                  </span>
                </div>

                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs font-bold text-primary">{comp.category}</span>
                  <span className="text-[10px] text-neutral-400">via {comp.channel}</span>
                  {isSafeguard && (
                    <span className="px-1.5 py-0.2 bg-red-100 text-red-800 text-[10px] font-black rounded uppercase">
                      Safeguarding
                    </span>
                  )}
                </div>

                <p className="text-xs text-neutral-700 line-clamp-3 mb-3 leading-relaxed">
                  {comp.description}
                </p>

                {comp.resolutionSummary && (
                  <div className="p-2.5 bg-emerald-50 rounded border border-emerald-200 text-xs text-emerald-900 mb-3">
                    <strong>Resolution:</strong> {comp.resolutionSummary}
                  </div>
                )}
              </div>

              <div className="pt-3 border-t border-neutral-100 flex items-center justify-between text-xs text-neutral-500">
                <span>Received: {comp.dateReceived}</span>
                <Button size="sm" variant="secondary" onClick={() => setSelectedComplaint(comp)}>
                  Manage Case
                </Button>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Case Management Modal */}
      {selectedComplaint && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b">
              <div>
                <span className="text-xs text-neutral-400 font-mono">Case Dossier</span>
                <h4 className="text-base font-bold text-neutral-800">{selectedComplaint.referenceCode}</h4>
              </div>
              <button onClick={() => setSelectedComplaint(null)} className="text-neutral-400 hover:text-neutral-700 font-bold">✕</button>
            </div>

            <div className="bg-neutral-50 p-3 rounded text-xs space-y-1.5 border border-neutral-200">
              <p><strong>Category:</strong> {selectedComplaint.category}</p>
              <p><strong>Channel:</strong> {selectedComplaint.channel}</p>
              <p><strong>Complainant:</strong> {selectedComplaint.isAnonymous ? 'Anonymous' : (selectedComplaint.complainantName || 'Identified')}</p>
              <p><strong>Assigned Officer:</strong> {selectedComplaint.assignedTo}</p>
              <p className="pt-1 text-neutral-800"><strong>Full Narrative:</strong> {selectedComplaint.description}</p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-700 mb-1">
                Resolution Action Summary / Remediation Notes:
              </label>
              <textarea 
                rows={3}
                className="w-full px-3 py-2 border border-neutral-300 rounded text-xs focus:ring-2 focus:ring-primary"
                value={resolutionText}
                onChange={(e) => setResolutionText(e.target.value)}
                placeholder="Detail the investigation findings, corrective actions taken, and communication back to the community..."
              />
            </div>

            <div className="flex items-center justify-between pt-3 border-t">
              <Button size="sm" variant="secondary" onClick={() => handleUpdateStatus(selectedComplaint, 'under_investigation')}>
                Set Under Investigation
              </Button>
              <Button size="sm" onClick={() => handleUpdateStatus(selectedComplaint, 'resolved')}>
                Mark Case Resolved
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Log New Complaint Modal */}
      {isLogging && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full p-6 space-y-4">
            <h3 className="text-base font-bold text-neutral-800">Log Community Feedback or Complaint</h3>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1">Category</label>
                <select className="w-full px-3 py-2 border border-neutral-300 rounded text-xs bg-white" value={cat} onChange={(e) => setCat(e.target.value as any)}>
                  <option value="Service Delivery">Service Delivery</option>
                  <option value="Staff Conduct">Staff Conduct</option>
                  <option value="Fraud/Corruption">Fraud / Corruption</option>
                  <option value="Safeguarding">Safeguarding / Protection</option>
                  <option value="Feedback">General Program Feedback</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1">Intake Channel</label>
                <select className="w-full px-3 py-2 border border-neutral-300 rounded text-xs bg-white" value={channel} onChange={(e) => setChannel(e.target.value as any)}>
                  <option value="Suggestion Box">Suggestion Box</option>
                  <option value="Helpline">Toll-Free Helpline</option>
                  <option value="Community Meeting">Community Town Hall</option>
                  <option value="Digital Portal">Digital Portal</option>
                </select>
              </div>
            </div>

            <div className="p-3 bg-neutral-50 rounded border border-neutral-200 space-y-2">
              <label className="flex items-center gap-2 text-xs font-semibold text-neutral-700 cursor-pointer">
                <input type="checkbox" checked={isAnon} onChange={(e) => setIsAnon(e.target.checked)} className="text-primary rounded" />
                Submit Anonymously (Protect Complainant Identity)
              </label>

              {!isAnon && (
                <input 
                  type="text" 
                  className="w-full px-3 py-1.5 border border-neutral-300 rounded text-xs" 
                  placeholder="Complainant Name or Contact"
                  value={complainantName}
                  onChange={(e) => setComplainantName(e.target.value)}
                />
              )}

              <label className="flex items-center gap-2 text-xs font-semibold text-red-700 cursor-pointer pt-1 border-t border-neutral-200">
                <input type="checkbox" checked={isSafeguarding} onChange={(e) => setIsSafeguarding(e.target.checked)} className="text-red-600 rounded" />
                Flag as Sensitive Safeguarding Report (Restricted Access)
              </label>
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-700 mb-1">Detailed Description of Incident / Feedback *</label>
              <textarea 
                rows={3} 
                className="w-full px-3 py-2 border border-neutral-300 rounded text-xs focus:ring-2 focus:ring-primary"
                value={desc}
                onChange={(e) => setDesc(e.target.value)}
                placeholder="What occurred, when, where, and any immediate safety concerns..."
              />
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t">
              <Button size="sm" variant="secondary" onClick={() => setIsLogging(false)}>Cancel</Button>
              <Button size="sm" onClick={handleSaveComplaint}>Log Record</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AccountabilityView;
