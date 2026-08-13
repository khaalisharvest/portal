'use client';

import { useState, useEffect, useMemo } from 'react';

interface Settings {
  isEnabled: boolean;
  text: string;
  backgroundColor: string;
  textColor: string;
  speed: number;
}

export default function NotificationBar() {
  const [settings, setSettings] = useState<Settings | null>(null);

  useEffect(() => {
    fetchSettings();
    const id = setInterval(fetchSettings, 5 * 60 * 1000);
    return () => clearInterval(id);
  }, []);

  async function fetchSettings() {
    try {
      const res = await fetch('/api/v1/settings/notification-bar');
      if (!res.ok) return;
      const json = await res.json();
      const s = json.data ?? json;
      setSettings({
        isEnabled: Boolean(s.isEnabled),
        text: s.text ?? '',
        backgroundColor: s.backgroundColor ?? '#3d7a2e',
        textColor: s.textColor ?? '#ffffff',
        speed: typeof s.speed === 'number' ? s.speed : 50,
      });
    } catch {
      // silent — bar stays hidden on error
    }
  }

  const copies = useMemo(() => {
    if (!settings?.text) return [];
    const len = settings.text.length;
    const count = len < 20 ? 8 : len < 50 ? 6 : len < 100 ? 4 : 3;
    return Array<string>(count).fill(settings.text);
  }, [settings?.text]);

  if (!settings?.isEnabled || !settings?.text) return null;

  const duration = `${Math.max(10, Math.min(100, settings.speed))}s`;
  const translatePct = `${-(100 / copies.length)}%`;

  return (
    <div
      className="relative overflow-hidden w-full"
      style={{
        backgroundColor: settings.backgroundColor,
        color: settings.textColor,
        height: 40,
      }}
    >
      <div className="relative h-full w-full overflow-hidden">
        <div
          className="notification-scroll"
          style={{
            '--nb-duration': duration,
            '--nb-translate': translatePct,
          } as React.CSSProperties}
        >
          {copies.map((text, i) => (
            <span key={i} className="px-6 sm:px-10 text-xs sm:text-sm font-medium flex-shrink-0">
              {text}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
