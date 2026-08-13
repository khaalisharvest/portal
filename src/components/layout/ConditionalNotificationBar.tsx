'use client';

import { usePathname } from 'next/navigation';
import NotificationBar from '@/components/ui/NotificationBar';

export default function ConditionalNotificationBar() {
  const pathname = usePathname();
  if (pathname.startsWith('/admin/')) return null;
  return <NotificationBar />;
}
