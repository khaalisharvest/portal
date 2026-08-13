const STATUS_MAP: Record<string, { bg: string; text: string; label: string }> = {
  pending:    { bg: 'bg-secondary-100', text: 'text-secondary-700', label: 'Pending' },
  confirmed:  { bg: 'bg-primary-100',   text: 'text-primary-700',   label: 'Confirmed' },
  processing: { bg: 'bg-blue-100',      text: 'text-blue-700',      label: 'Processing' },
  shipped:    { bg: 'bg-indigo-100',    text: 'text-indigo-700',    label: 'Shipped' },
  delivered:  { bg: 'bg-teal-100',      text: 'text-teal-700',      label: 'Delivered' },
  cancelled:  { bg: 'bg-error-100',     text: 'text-error-700',     label: 'Cancelled' },
  refunded:   { bg: 'bg-neutral-100',   text: 'text-neutral-600',   label: 'Refunded' },
  approved:   { bg: 'bg-primary-100',   text: 'text-primary-700',   label: 'Approved' },
  rejected:   { bg: 'bg-error-100',     text: 'text-error-700',     label: 'Rejected' },
  read:       { bg: 'bg-blue-100',      text: 'text-blue-700',      label: 'Read' },
  replied:    { bg: 'bg-teal-100',      text: 'text-teal-700',      label: 'Replied' },
  archived:   { bg: 'bg-neutral-100',   text: 'text-neutral-600',   label: 'Archived' },
  active:     { bg: 'bg-primary-100',   text: 'text-primary-700',   label: 'Active' },
  inactive:   { bg: 'bg-neutral-100',   text: 'text-neutral-600',   label: 'Inactive' },
  paid:       { bg: 'bg-primary-100',   text: 'text-primary-700',   label: 'Paid' },
  failed:     { bg: 'bg-error-100',     text: 'text-error-700',     label: 'Failed' },
};

interface StatusBadgeProps {
  status: string;
  customLabel?: string;
}

export default function StatusBadge({ status, customLabel }: StatusBadgeProps) {
  const config = STATUS_MAP[status?.toLowerCase()] ?? { bg: 'bg-neutral-100', text: 'text-neutral-600', label: status };
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>
      {customLabel ?? config.label}
    </span>
  );
}
