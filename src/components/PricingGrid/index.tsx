'use client';

import { useState } from 'react';
import Link from 'next/link';
import styles from '@/app/page.module.scss';

const VISIBLE_COUNT = 5;

export type PricingPlan = {
  name: string;
  price: string;
  priceSub: string;
  highlight: boolean;
  dark?: boolean;
  cta: string;
  ctaHref: string;
  features: string[];
};

function IconCheck({ variant = 'orange' }: { variant?: 'green' | 'blue' | 'orange' }) {
  const fill = variant === 'blue' ? '#2563eb' : variant === 'green' ? '#16A34A' : '#d97706';
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="10" fill={fill} />
      <path
        d="M8 12l3 3 5-5"
        stroke="white"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function FeatureItem({ feature }: { feature: string }) {
  return (
    <li>
      <IconCheck variant="orange" />
      {feature}
    </li>
  );
}

function PricingCard({ plan, index }: { plan: PricingPlan; index: number }) {
  const [expanded, setExpanded] = useState(false);
  const primaryFeatures = plan.features.slice(0, VISIBLE_COUNT);
  const extraFeatures = plan.features.slice(VISIBLE_COUNT);
  const hiddenCount = extraFeatures.length;

  return (
    <div
      className={[
        styles.pricingCard,
        plan.highlight ? styles.pricingCardHighlight : '',
        plan.dark ? styles.pricingCardDark : '',
      ]
        .filter(Boolean)
        .join(' ')}
      data-animate
      data-animate-delay={index * 100}
    >
      <p className={styles.pricingTier}>{plan.name}</p>
      <div className={styles.pricingPriceRow}>
        <span className={styles.pricingPrice}>{plan.price}</span>
      </div>
      <p className={styles.pricingPriceSub}>{plan.priceSub}</p>

      <div className={styles.pricingFeaturesBlock}>
        <ul className={styles.pricingFeatures}>
          {primaryFeatures.map((f) => (
            <FeatureItem key={`${plan.name}-primary-${f}`} feature={f} />
          ))}
        </ul>

        {hiddenCount > 0 && (
          <div
            className={[styles.pricingMore, expanded ? styles.pricingMoreOpen : '']
              .filter(Boolean)
              .join(' ')}
            aria-hidden={!expanded}
          >
            <div className={styles.pricingMoreInner}>
              <ul className={styles.pricingFeatures}>
                {extraFeatures.map((f, i) => (
                  <li
                    key={`${plan.name}-extra-${f}`}
                    className={styles.pricingFeatureExtra}
                    style={{ transitionDelay: expanded ? `${i * 35}ms` : '0ms' }}
                  >
                    <IconCheck variant="orange" />
                    {f}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </div>

      {hiddenCount > 0 && (
        <button
          type="button"
          className={styles.pricingToggle}
          onClick={() => setExpanded((open) => !open)}
          aria-expanded={expanded}
        >
          {expanded ? 'Show less' : `Show ${hiddenCount} more features`}
          <span
            className={[styles.pricingToggleIcon, expanded ? styles.pricingToggleIconOpen : '']
              .filter(Boolean)
              .join(' ')}
            aria-hidden="true"
          >
            ▾
          </span>
        </button>
      )}

      <Link
        href={plan.ctaHref}
        className={[
          styles.pricingBtn,
          plan.name !== 'Free' && !plan.dark ? styles.pricingBtnPrimary : '',
          plan.dark ? styles.pricingBtnDark : '',
        ]
          .filter(Boolean)
          .join(' ')}
      >
        {plan.cta}
      </Link>
    </div>
  );
}

export default function PricingGrid({ plans }: { plans: PricingPlan[] }) {
  return (
    <div className={styles.pricingGrid}>
      {plans.map((plan, i) => (
        <PricingCard key={plan.name} plan={plan} index={i} />
      ))}
    </div>
  );
}
