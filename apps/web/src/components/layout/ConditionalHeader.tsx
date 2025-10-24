'use client';

import { usePathname } from 'next/navigation';
import Header from './Header';

export default function ConditionalHeader() {
  const pathname = usePathname();
  
  // Hide header for admin dashboard pages
  if (pathname.startsWith('/admin/')) {
    return null;
  }
  
  return <Header />;
}
