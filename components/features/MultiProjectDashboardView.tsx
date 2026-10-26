import React from 'react';
import { Project, Indicator, DataPoint } from '../../types';
import Card from '../ui/Card';
import Button from '../ui/Button';
import { CollectionIcon, BriefcaseIcon, ChartBarIcon } from '../../constants';
import { calculateIndicatorMetrics } from '../../utils/mneUtils';

interface MultiProjectDashboardViewProps {
  projects: Project[];
  indicators: Indicator[];
  dataPoints: DataPoint[];
  onSelectProject: (projectId: string) => void;
}

export const MultiProjectDashboardView: React.FC<MultiProjectDashboardViewProps> = ({
  projects,
  indicators,
  dataPoints,
  onSelectProject
}) => {
  // Aggregate stats across all projects
  const totalProjects = projects.length;
  const totalIndicators = indicators.length;

  let totalOnTrack = 0;
  let totalAtRisk = 0;
  let totalOffTrack = 0;
  let totalNoData = 0;

  indicators.forEach(ind => {
    const points = dataPoints
      .filter(dp => dp.indicatorId === ind.id)
      .sort((a, b) => new Date(b.collectionDate).getTime() - new Date(a.collectionDate).getTime());
    const latest = points[0];
    const metrics = calculateIndicatorMetrics(ind, latest);

    if (metrics.status === 'On Track') totalOnTrack++;
    else if (metrics.status === 'At Risk') totalAtRisk++;
    else if (metrics.status === 'Off Track') totalOffTrack++;
    else totalNoData++;
  });

  const onTrackPct = totalIndicators > 0 ? Math.round((totalOnTrack / totalIndicators) * 100) : 0;
  const atRiskPct = totalIndicators > 0 ? Math.round((totalAtRisk / totalIndicators) * 100) : 0;
  const offTrackPct = totalIndicators > 0 ? Math.round((totalOffTrack / totalIndicators) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-5 rounded-lg border border-neutral-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="p-2.5 bg-blue-50 text-primary rounded-lg">
            <CollectionIcon className="w-7 h-7" />
          </span>
          <div>
            <h2 className="text-xl font-bold text-neutral-800">Portfolio & Multi-Project Overview</h2>
            <p className="text-xs text-neutral-500">
              Cross-project performance synthesis, indicator health distribution, and institutional portfolio tracking.
            </p>
          </div>
        </div>
      </div>

      {/* KPI Cards Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4 bg-white border border-neutral-200">
          <span className="text-xs font-semibold text-neutral-500 uppercase tracking-wider block">Active Programmes</span>
          <span className="text-3xl font-extrabold text-neutral-900 mt-1 block">{totalProjects}</span>
          <span className="text-xs text-neutral-400 mt-1 block">Cross-country portfolio</span>
        </Card>

        <Card className="p-4 bg-white border border-neutral-200">
          <span className="text-xs font-semibold text-neutral-500 uppercase tracking-wider block">Total M&E Indicators</span>
          <span className="text-3xl font-extrabold text-primary mt-1 block">{totalIndicators}</span>
          <span className="text-xs text-neutral-400 mt-1 block">Output, outcome & impact metrics</span>
        </Card>

        <Card className="p-4 bg-white border border-neutral-200">
          <span className="text-xs font-semibold text-neutral-500 uppercase tracking-wider block">Portfolio On-Track Rate</span>
          <span className="text-3xl font-extrabold text-emerald-600 mt-1 block">{onTrackPct}%</span>
          <div className="w-full bg-neutral-100 rounded-full h-1.5 mt-2">
            <div className="bg-emerald-500 h-1.5 rounded-full" style={{ width: `${onTrackPct}%` }} />
          </div>
        </Card>

        <Card className="p-4 bg-white border border-neutral-200">
          <span className="text-xs font-semibold text-neutral-500 uppercase tracking-wider block">At Risk / Off Track</span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-3xl font-extrabold text-amber-600">{totalAtRisk}</span>
            <span className="text-xs text-neutral-500">at risk</span>
            <span className="text-3xl font-extrabold text-rose-600 ml-2">{totalOffTrack}</span>
            <span className="text-xs text-neutral-500">off track</span>
          </div>
          <span className="text-xs text-neutral-400 mt-1 block">Requires adaptive management</span>
        </Card>
      </div>

      {/* Cross-Project Comparison Table */}
      <div className="bg-white rounded-lg border border-neutral-200 shadow-sm overflow-hidden">
        <div className="p-4 bg-neutral-50 border-b border-neutral-200 flex items-center justify-between">
          <h3 className="text-sm font-bold text-neutral-800">Project Performance Matrix</h3>
          <span className="text-xs text-neutral-500">Click any project to enter its dedicated M&E space</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-neutral-100 text-neutral-600 text-xs uppercase font-semibold border-b">
              <tr>
                <th className="py-3 px-4">Project Name & Code</th>
                <th className="py-3 px-4">Sector / Thematic</th>
                <th className="py-3 px-4">Period</th>
                <th className="py-3 px-4">Indicators</th>
                <th className="py-3 px-4">Indicator Health</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {projects.map(proj => {
                const projIndicators = indicators.filter(i => i.projectId === proj.id);
                let onTrackCount = 0;
                let atRiskCount = 0;
                let offTrackCount = 0;

                projIndicators.forEach(ind => {
                  const pts = dataPoints
                    .filter(dp => dp.indicatorId === ind.id)
                    .sort((a, b) => new Date(b.collectionDate).getTime() - new Date(a.collectionDate).getTime());
                  const m = calculateIndicatorMetrics(ind, pts[0]);
                  if (m.status === 'On Track') onTrackCount++;
                  else if (m.status === 'At Risk') atRiskCount++;
                  else if (m.status === 'Off Track') offTrackCount++;
                });

                const total = projIndicators.length;
                const onTrackRatio = total > 0 ? (onTrackCount / total) * 100 : 0;
                const atRiskRatio = total > 0 ? (atRiskCount / total) * 100 : 0;
                const offTrackRatio = total > 0 ? (offTrackCount / total) * 100 : 0;

                return (
                  <tr key={proj.id} className="hover:bg-neutral-50 transition">
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-neutral-800">{proj.name}</div>
                      <div className="text-xs text-neutral-400 font-mono">{proj.code || proj.id}</div>
                    </td>
                    <td className="py-3.5 px-4 text-xs text-neutral-600">
                      {proj.sector || 'Community Development'}
                    </td>
                    <td className="py-3.5 px-4 text-xs text-neutral-500 font-mono">
                      {proj.startDate} → {proj.endDate}
                    </td>
                    <td className="py-3.5 px-4 font-bold text-neutral-800 text-xs">
                      {total}
                    </td>
                    <td className="py-3.5 px-4">
                      {total > 0 ? (
                        <div className="space-y-1">
                          <div className="flex h-2 rounded-full overflow-hidden w-36 bg-neutral-100">
                            <div style={{ width: `${onTrackRatio}%` }} className="bg-emerald-500" title={`On Track: ${onTrackCount}`} />
                            <div style={{ width: `${atRiskRatio}%` }} className="bg-amber-500" title={`At Risk: ${atRiskCount}`} />
                            <div style={{ width: `${offTrackRatio}%` }} className="bg-rose-500" title={`Off Track: ${offTrackCount}`} />
                          </div>
                          <div className="text-[11px] text-neutral-500 font-medium">
                            <span className="text-emerald-700 font-bold">{onTrackCount} On</span> · 
                            <span className="text-amber-700 font-bold ml-1">{atRiskCount} Risk</span> · 
                            <span className="text-rose-700 font-bold ml-1">{offTrackCount} Off</span>
                          </div>
                        </div>
                      ) : (
                        <span className="text-xs text-neutral-400 italic">No indicators defined</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <Button 
                        size="sm" 
                        variant="primary" 
                        onClick={() => onSelectProject(proj.id)}
                      >
                        Open Project Space
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default MultiProjectDashboardView;
