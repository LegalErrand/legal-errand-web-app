'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getValidAccessToken } from '@/lib';

export default function LandingRedirect() {
  const router = useRouter();

  useEffect(() => {
    if (getValidAccessToken()) {
      router.replace('/dashboard');
    }
  }, [router]);

  return null;
}
