import React, { useState } from 'react';
import { Project, GeoSite } from '../../types';
import Card from '../ui/Card';
import Button from '../ui/Button';
import { MapIcon, BriefcaseIcon } from '../../constants';
import { mealStorage } from '../../services/mealStorage';

interface ProjectMapViewProps {
  activeProject: Project | null;
}

export const ProjectMapView: React.FC<ProjectMapViewProps> = ({ activeProject }) => {
  const [sites] = useState<GeoSite[]>(() => {
    return mealStorage.getGeoSites(activeProject?.id);
  });
  const [selectedSite, setSelectedSite] = useState<GeoSite | null>(sites[0] || null);
  const [filterType, setFilterType] = useState<string>('all');

  const filteredSites = sites.filter(s => {
    if (filterType !== 'all' && s.type !== filterType) return false;
    return true;
  });

  const totalBeneficiaries = sites.reduce((sum, s) => sum + s.beneficiariesTargeted, 0);

  if (!activeProject) {
    return (
      <div className="p-8 text-center bg-white rounded-lg border border-neutral-200">
        <MapIcon className="w-12 h-12 text-neutral-400 mx-auto mb-2" />
        <p className="text-neutral-600">Please select an active project to view GIS spatial monitoring.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-5 rounded-lg border border-neutral-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 bg-blue-50 text-primary rounded-md">
              <MapIcon className="w-6 h-6" />
            </span>
            <div>
              <h2 className="text-xl font-bold text-neutral-800">GIS & Spatial Project Monitoring</h2>
              <p className="text-xs text-neutral-500">
                Geotagged health facilities, coverage zones, and field operational coordinates for {activeProject.name}.
              </p>
            </div>
          </div>
        </div>

        {/* Layer Filters */}
        <div className="flex items-center gap-2 bg-neutral-100 p-1 rounded-lg text-xs">
          {['all', 'health_facility', 'community_center'].map(type => (
            <button
              key={type}
              onClick={() => setFilterType(type)}
              className={`px-3 py-1 rounded font-semibold capitalize transition ${
                filterType === type ? 'bg-white text-primary shadow-xs' : 'text-neutral-600 hover:text-neutral-900'
              }`}
            >
              {type.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Spatial Map Canvas */}
        <div className="lg:col-span-2 bg-slate-900 rounded-xl p-5 shadow-lg border border-slate-800 relative overflow-hidden min-h-[440px] flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-slate-400 border-b border-slate-800 pb-3">
            <span className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              Live Field Coordinates (WGS-84 Projection)
            </span>
            <span>Target Population: <strong className="text-white font-bold">{totalBeneficiaries.toLocaleString()}</strong></span>
          </div>

          {/* Interactive Scaled SVG Map Canvas */}
          <div className="relative my-4 flex-1 flex items-center justify-center">
            <svg viewBox="0 0 600 360" className="w-full h-auto max-h-[340px]">
              {/* Regional Districts Boundaries */}
              <path 
                d="M 50 120 Q 150 40 300 80 T 550 140 L 520 300 Q 300 360 80 320 Z" 
                fill="#1e293b" 
                stroke="#334155" 
                strokeWidth="2" 
              />
              <path 
                d="M 80 140 Q 200 130 280 200 L 260 310 Q 140 310 80 280 Z" 
                fill="#0f172a" 
                stroke="#475569" 
                strokeWidth="1.5"
                strokeDasharray="4 4" 
              />
              <path 
                d="M 280 200 Q 380 120 520 180 L 480 310 Q 360 340 260 310 Z" 
                fill="#1e293b" 
                stroke="#475569" 
                strokeWidth="1.5"
                strokeDasharray="4 4" 
              />

              {/* District Labels */}
              <text x="140" y="240" fill="#64748b" fontSize="11" fontWeight="bold">Central District</text>
              <text x="360" y="250" fill="#64748b" fontSize="11" fontWeight="bold">East Coast District</text>
              <text x="240" y="110" fill="#64748b" fontSize="11" fontWeight="bold">North Highlands</text>

              {/* Geo Facility Pins */}
              {filteredSites.map((site, idx) => {
                // Approximate coordinate projection to canvas
                const cx = 120 + (idx * 110);
                const cy = 150 + ((idx % 2 === 0 ? -1 : 1) * 45);
                const isSelected = selectedSite?.id === site.id;

                return (
                  <g 
                    key={site.id} 
                    onClick={() => setSelectedSite(site)}
                    className="cursor-pointer group"
                  >
                    {/* Ripple ring */}
                    <circle cx={cx} cy={cy} r={isSelected ? "18" : "12"} fill="rgba(59, 130, 246, 0.2)" />
                    <circle 
                      cx={cx} 
                      cy={cy} 
                      r={isSelected ? "8" : "6"} 
                      fill={isSelected ? "#3b82f6" : "#10b981"} 
                      stroke="#ffffff" 
                      strokeWidth="2" 
                    />
                    <text 
                      x={cx + 12} 
                      y={cy + 4} 
                      fill="#e2e8f0" 
                      fontSize="10" 
                      fontWeight="bold"
                      className="group-hover:fill-blue-400 transition"
                    >
                      {site.name}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>

          <div className="flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-slate-800">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" /> Health Center</span>
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-blue-500 inline-block" /> Selected Hub</span>
            </div>
            <span>Click any node to inspect site specifics</span>
          </div>
        </div>

        {/* Selected Site Details Card */}
        <div className="space-y-4">
          <Card className="p-5 border border-neutral-200">
            <span className="text-xs font-bold text-neutral-400 uppercase tracking-wider block mb-1">
              Selected Site Dossier
            </span>

            {selectedSite ? (
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-bold text-neutral-800">{selectedSite.name}</h3>
                  <span className="text-xs text-neutral-500 font-mono">
                    {selectedSite.district} · {selectedSite.type.replace('_', ' ').toUpperCase()}
                  </span>
                </div>

                <div className="bg-neutral-50 p-3 rounded border border-neutral-200 text-xs space-y-2">
                  <div className="flex justify-between">
                    <span className="text-neutral-500">Latitude / Longitude:</span>
                    <strong className="font-mono text-neutral-800">{selectedSite.latitude.toFixed(4)}, {selectedSite.longitude.toFixed(4)}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-neutral-500">Target Beneficiaries:</span>
                    <strong className="text-primary font-bold">{selectedSite.beneficiariesTargeted.toLocaleString()}</strong>
                  </div>
                </div>

                <div>
                  <span className="text-xs font-bold text-neutral-700 block mb-1.5">Tracked MEAL Indicators at Site:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedSite.indicatorsMeasured.map(ind => (
                      <span key={ind} className="px-2 py-0.5 bg-blue-50 text-blue-800 text-[11px] font-semibold rounded">
                        {ind}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="pt-2">
                  <Button size="sm" variant="secondary" className="w-full">
                    Download Geotagged Shapefile (GeoJSON)
                  </Button>
                </div>
              </div>
            ) : (
              <p className="text-xs text-neutral-500">Select a point on the map to inspect.</p>
            )}
          </Card>

          {/* Quick List of Sites */}
          <Card className="p-4 border border-neutral-200">
            <h4 className="text-xs font-bold text-neutral-700 uppercase tracking-wider mb-2">
              Project Implementation Sites ({filteredSites.length})
            </h4>
            <div className="space-y-1.5 max-h-56 overflow-y-auto text-xs">
              {filteredSites.map(site => (
                <div 
                  key={site.id} 
                  onClick={() => setSelectedSite(site)}
                  className={`p-2 rounded cursor-pointer transition flex items-center justify-between ${
                    selectedSite?.id === site.id ? 'bg-blue-50 text-primary font-bold' : 'hover:bg-neutral-50 text-neutral-700'
                  }`}
                >
                  <span>{site.name}</span>
                  <span className="text-[10px] text-neutral-400 font-mono">{site.district}</span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ProjectMapView;
