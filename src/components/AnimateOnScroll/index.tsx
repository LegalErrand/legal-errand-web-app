'use client';

import { useEffect } from 'react';

export default function AnimateOnScroll() {
  useEffect(() => {
    const els = document.querySelectorAll<HTMLElement>('[data-animate]');

    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            const el = e.target as HTMLElement;
            const delay = el.dataset.animateDelay ?? '0';
            setTimeout(() => el.classList.add('is-visible'), Number(delay));
            obs.unobserve(el);
          }
        });
      },
      { threshold: 0.12 }
    );

    els.forEach((el) => obs.observe(el));
    return () => obs.disconnect();
  }, []);

  return null;
}
