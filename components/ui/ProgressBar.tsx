
import React from 'react';
import { IndicatorStatus } from '../../types';

interface ProgressBarProps {
  value: number; // current value
  max?: number;   // maximum value, defaults to 100 for percentages
  label?: string;
  status: IndicatorStatus; // New prop to control color
}

const ProgressBar: React.FC<ProgressBarProps> = ({ value, max = 100, label, status }) => {
  const percentage = max > 0 ? Math.min(Math.max((value / max) * 100, 0), 100) : 0;
  
  let barColor = 'bg-primary'; // Default or N/A
  switch (status) {
    case IndicatorStatus.ON_TRACK:
      barColor = 'bg-green-500';
      break;
    case IndicatorStatus.AT_RISK:
      barColor = 'bg-yellow-500';
      break;
    case IndicatorStatus.OFF_TRACK:
      barColor = 'bg-red-500';
      break;
    case IndicatorStatus.NO_DATA:
      barColor = 'bg-neutral-400';
       break;
    case IndicatorStatus.NOT_APPLICABLE:
    default:
        barColor = 'bg-neutral-300'; // A neutral color for N/A or no specific status
        break;
  }


  return (
    <div>
      {label && <p className="text-sm text-neutral-600 mb-1">{label}: {value.toLocaleString()} / {max.toLocaleString()}</p>}
      <div className="w-full bg-neutral-200 rounded-full h-2.5 dark:bg-neutral-300">
        <div
          className={`${barColor} h-2.5 rounded-full transition-all duration-500 ease-out`}
          style={{ width: `${percentage}%` }}
          role="progressbar"
          aria-valuenow={percentage}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`Progress: ${percentage.toFixed(0)}%`}
        ></div>
      </div>
      <p className="text-xs text-neutral-500 mt-1 text-right">{percentage.toFixed(0)}%</p>
    </div>
  );
};

export default ProgressBar;
