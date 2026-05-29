'use client';

import { useEffect } from 'react';
import Image from 'next/image';
import { WHATSAPP_SHARE_TEXT } from '@/lib';
import styles from './SuccessModal.module.scss';

interface SuccessModalProps {
  onClose: () => void;
}

export default function SuccessModal({ onClose }: SuccessModalProps) {
  // Lock body scroll while modal is open
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  // Close on Escape key
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  async function handleWhatsApp() {
    const url = `https://wa.me/?text=${encodeURIComponent(WHATSAPP_SHARE_TEXT)}`;
    try {
      await navigator.clipboard.writeText(WHATSAPP_SHARE_TEXT);
    } catch {
      // clipboard unavailable — proceed without copy
    }
    window.open(url, '_blank', 'noopener,noreferrer');
  }

  return (
    <div
      className={styles.overlay}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      role="dialog"
      aria-modal="true"
      aria-label="You're on the waitlist"
    >
      <div className={styles.modal}>
        <button className={styles.closeBtn} onClick={onClose} aria-label="Close">
          <span aria-hidden="true">✕</span>
        </button>

        <div className={styles.logoRow}>
          <Image src="/logo.svg" alt="LegalErrand" width={160} height={36} priority />
        </div>

        <p className={styles.eyebrow}>You&apos;re in! — Welcome Onboard</p>

        <h2 className={styles.heading}>
          Welcome to <span className={styles.brand}>LegalErrand Academy.</span>
        </h2>

        <hr className={styles.divider} />

        <p className={styles.body}>
          You just joined a group of law students who decided to{' '}
          <span className={styles.highlight}>study smarter.</span>
        </p>

        <p className={styles.body}>
          We&apos;ll send you weekly updates. Every feature we ship, every milestone we hit —
          you&apos;ll watch LegalErrand Academy come to life.
        </p>

        <div className={styles.shareSection}>
          <p className={styles.shareLabel}>Share with a course mate</p>
          <button className={styles.whatsappBtn} onClick={handleWhatsApp}>
            <WhatsAppIcon />
            Copy &amp; Share on WhatsApp
          </button>
        </div>
      </div>
    </div>
  );
}

function WhatsAppIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M12 2C6.477 2 2 6.477 2 12c0 1.89.525 3.66 1.438 5.168L2 22l4.977-1.41A9.955 9.955 0 0012 22c5.523 0 10-4.477 10-10S17.523 2 12 2z"
        fill="#25D366"
      />
      <path
        d="M16.75 14.79c-.25-.125-1.478-.729-1.706-.812-.228-.083-.394-.125-.56.125-.166.25-.645.812-.79.979-.146.166-.291.187-.541.062-.25-.125-1.055-.389-2.01-1.24-.743-.663-1.244-1.48-1.39-1.73-.145-.25-.016-.385.11-.51.112-.112.25-.291.374-.437.125-.146.166-.25.25-.416.083-.167.041-.313-.021-.438-.062-.125-.56-1.349-.767-1.848-.202-.485-.407-.418-.56-.426l-.477-.008c-.166 0-.437.062-.666.313-.229.25-.875.854-.875 2.083 0 1.23.896 2.418 1.02 2.585.125.166 1.762 2.69 4.27 3.772.597.257 1.062.41 1.424.524.599.19 1.144.163 1.574.099.48-.072 1.479-.604 1.687-1.188.208-.583.208-1.083.145-1.188-.062-.104-.229-.166-.479-.291z"
        fill="white"
      />
    </svg>
  );
}
