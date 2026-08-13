interface Rule { label: string; ok: boolean }

export default function PasswordHint({ password }: { password: string }) {
  if (!password) return null;

  const rules: Rule[] = [
    { label: 'At least 8 characters',  ok: password.length >= 8 },
    { label: 'One uppercase letter',   ok: /[A-Z]/.test(password) },
    { label: 'One lowercase letter',   ok: /[a-z]/.test(password) },
    { label: 'One number',             ok: /[0-9]/.test(password) },
  ];

  return (
    <div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1">
      {rules.map(r => (
        <div key={r.label} className={`flex items-center gap-1.5 text-xs transition-colors ${r.ok ? 'text-primary-600' : 'text-neutral-400'}`}>
          <svg className="w-3 h-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
            {r.ok
              ? <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              : <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            }
          </svg>
          {r.label}
        </div>
      ))}
    </div>
  );
}
