'use client';

import { useEffect, useState, type ReactNode } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { getValidAccessToken, loginPath } from '@/lib/session';

export default function AuthGuard({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const verify = () => {
      const token = getValidAccessToken();
      if (!token) {
        router.replace(loginPath(pathname));
        return false;
      }
      setReady(true);
      return true;
    };

    if (!verify()) return;

    const recheck = () => {
      verify();
    };

    window.addEventListener('focus', recheck);
    document.addEventListener('visibilitychange', recheck);
    return () => {
      window.removeEventListener('focus', recheck);
      document.removeEventListener('visibilitychange', recheck);
    };
  }, [pathname, router]);

  if (!ready) return null;
  return children;
}
