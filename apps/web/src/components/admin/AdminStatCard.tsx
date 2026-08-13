import { ReactNode } from 'react';

interface AdminStatCardProps {
  label: string;
  value: string | number;
  trend?: { delta: string | number; up: boolean };
  icon: ReactNode;
  color?: 'green' | 'amber' | 'blue' | 'purple';
}

const COLOR_MAP = {
  green:  { bg: 'bg-primary-50',   text: 'text-primary-700',   icon: 'bg-primary-100   text-primary-600'   },
  amber:  { bg: 'bg-secondary-50', text: 'text-secondary-700', icon: 'bg-secondary-100 text-secondary-600' },
  blue:   { bg: 'bg-blue-50',      text: 'text-blue-700',      icon: 'bg-blue-100      text-blue-600'      },
  purple: { bg: 'bg-purple-50',    text: 'text-purple-700',    icon: 'bg-purple-100    text-purple-600'    },
};

export default function AdminStatCard({ label, value, trend, icon, color = 'green' }: AdminStatCardProps) {
  const c = COLOR_MAP[color];
  return (
    <div className={`${c.bg} rounded-xl p-5 border border-white`}>
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-medium text-neutral-500 uppercase tracking-wide">{label}</span>
        <div className={`${c.icon} p-2 rounded-lg [&_svg]:w-5 [&_svg]:h-5`}>
          {icon}
        </div>
      </div>
      <p className={`text-2xl font-bold ${c.text}`}>{value}</p>
      {trend && (
        <p className={`text-xs mt-1 flex items-center gap-1 ${trend.up ? 'text-green-600' : 'text-red-500'}`}>
          <span>{trend.up ? '▲' : '▼'}</span>
          <span>{trend.delta}</span>
        </p>
      )}
    </div>
  );
}
