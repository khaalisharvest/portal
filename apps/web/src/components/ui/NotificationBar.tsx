'use client';

import { useState, useEffect, useMemo } from 'react';

interface Settings {
  isEnabled:       boolean;
  text:            string;
  backgroundColor: string;
  textColor:       string;
  speed:           number;
  link:            string;
}

const SESSION_KEY = 'kh_nb_dismissed';

export default function NotificationBar() {
  const [settings, setSettings]   = useState<Settings | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setDismissed(sessionStorage.getItem(SESSION_KEY) === '1');
    }
    load();
    const id = setInterval(load, 5 * 60 * 1000);
    return () => clearInterval(id);
  }, []);

  async function load() {
    try {
      const res  = await fetch('/api/v1/settings/notification-bar');
      if (!res.ok) return;
      const json = await res.json();
      const s    = json.data ?? json;
      setSettings({
        isEnabled:       Boolean(s.isEnabled),
        text:            s.text ?? '',
        backgroundColor: s.backgroundColor ?? '#3d7a2e',
        textColor:       s.textColor ?? '#ffffff',
        speed:           typeof s.speed === 'number' ? s.speed : 30,
        link:            s.link ?? '',
      });
    } catch { /* silent */ }
  }

  const dismiss = () => {
    setDismissed(true);
    sessionStorage.setItem(SESSION_KEY, '1');
  };

  /*
   * Doubled content: set A + set B (identical).
   * Animation moves exactly -50% = one set width → seamless loop.
   * Enough copies to fill any viewport width so the bar always looks full.
   * Spacing is IDENTICAL at every position — no junction inconsistency.
   */
  const items = useMemo(() => {
    if (!settings?.text) return [];
    // Estimate px per copy: ~9px/char at text-sm + fixed 72px for the separator slot
    const perCopy = settings.text.length * 9 + 72;
    // Fill at least 2× the widest common screen (2560px) so no gap ever shows
    const setSize = Math.max(4, Math.ceil(5120 / perCopy));
    const half    = Array<string>(setSize).fill(settings.text);
    return [...half, ...half];            // doubled → -50% loops seamlessly
  }, [settings?.text]);

  if (!settings?.isEnabled || !settings?.text || dismissed) return null;

  const duration = `${Math.max(10, Math.min(100, settings.speed))}s`;
  const hasLink  = Boolean(settings.link?.trim());

  const ribbon = (
    <div
      className="relative h-full w-full overflow-hidden"
      style={{ '--nb-duration': duration } as React.CSSProperties}
    >
      <div className="nb-track">
        {items.map((text, i) => (
          <span
            key={i}
            className="inline-flex items-center flex-shrink-0 text-xs sm:text-sm font-medium"
            style={{ paddingInline: '2rem' }}
          >
            {text}
            <span style={{ marginLeft: '2rem', opacity: 0.35, fontWeight: 300 }}>|</span>
          </span>
        ))}
      </div>
    </div>
  );

  return (
    <div
      role="banner"
      aria-label="Announcement"
      className="relative overflow-hidden w-full flex items-center"
      style={{ backgroundColor: settings.backgroundColor, color: settings.textColor, height: 44 }}
    >
      <div className="flex-1 relative h-full overflow-hidden">
        {hasLink ? (
          <a href={settings.link} target="_blank" rel="noopener noreferrer"
            className="block w-full h-full" aria-label="View announcement">
            {ribbon}
          </a>
        ) : ribbon}
      </div>

      <button
        onClick={dismiss}
        aria-label="Close announcement"
        className="flex-shrink-0 w-10 h-full flex items-center justify-center opacity-50 hover:opacity-100 transition-opacity"
        style={{ color: settings.textColor }}
      >
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/>
        </svg>
      </button>
    </div>
  );
}
