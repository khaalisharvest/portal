import Link from 'next/link';

interface AttentionCardProps {
  label: string;
  count: number;
  href: string;
  cta: string;
  color?: 'amber' | 'red' | 'blue';
}

const COLOR_MAP = {
  amber: { bg: 'bg-secondary-50 border-secondary-200', count: 'text-secondary-700', dot: 'bg-secondary-400' },
  red:   { bg: 'bg-error-50 border-error-200',         count: 'text-error-700',     dot: 'bg-error-400' },
  blue:  { bg: 'bg-blue-50 border-blue-200',           count: 'text-blue-700',      dot: 'bg-blue-400' },
};

export default function AttentionCard({ label, count, href, cta, color = 'amber' }: AttentionCardProps) {
  const c = COLOR_MAP[color];
  return (
    <div className={`flex items-center justify-between p-4 rounded-xl border ${c.bg}`}>
      <div className="flex items-center gap-3">
        <div className={`w-2 h-2 rounded-full ${c.dot} animate-pulse`} />
        <div>
          <p className={`text-lg font-bold ${c.count}`}>{count}</p>
          <p className="text-xs text-neutral-600">{label}</p>
        </div>
      </div>
      <Link href={href} className="text-xs font-medium text-neutral-500 hover:text-neutral-800 transition-colors whitespace-nowrap">
        {cta} →
      </Link>
    </div>
  );
}
