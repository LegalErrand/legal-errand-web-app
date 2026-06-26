export function CategoryIcon({ category }: { category?: string }) {
  const cat = category?.toUpperCase();

  if (cat === 'RESEARCH')
    return (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path
          d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
        />
        <path
          d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2Z"
          stroke="currentColor"
          strokeWidth="1.8"
        />
      </svg>
    );

  if (cat === 'COMPLIANCE')
    return (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <rect x="2" y="7" width="20" height="15" rx="2" stroke="currentColor" strokeWidth="1.8" />
        <path
          d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"
          stroke="currentColor"
          strokeWidth="1.8"
        />
      </svg>
    );

  if (cat === 'INTERNAL')
    return (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path
          d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9l-6-6Z"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinejoin="round"
        />
        <path
          d="M14 3v6h6M9 13h6M9 17h4"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
        />
      </svg>
    );

  if (cat === 'EDUCATION')
    return (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path
          d="M22 10v6M2 10l10-5 10 5-10 5-10-5Z"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M6 12v5c3 3 9 3 12 0v-5"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
        />
      </svg>
    );

  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="1.8" />
      <path
        d="M8 12h8M8 8h8M8 16h5"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}
