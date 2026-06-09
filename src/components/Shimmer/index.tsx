import styles from './Shimmer.module.scss';

interface ShimmerProps {
  width?: string | number;
  height?: string | number;
  radius?: string | number;
  className?: string;
}

export function Shimmer({ width = '100%', height = 16, radius = 6, className }: ShimmerProps) {
  return (
    <span
      className={`${styles.shimmer}${className ? ` ${className}` : ''}`}
      style={{ width, height, borderRadius: radius }}
      aria-hidden="true"
    />
  );
}

export function ShimmerCard({ lines = 3 }: { lines?: number }) {
  return (
    <div className={styles.card}>
      <Shimmer height={18} width="60%" radius={6} />
      {Array.from({ length: lines }).map((_, i) => (
        <Shimmer key={i} height={13} width={i === lines - 1 ? '75%' : '100%'} radius={4} />
      ))}
    </div>
  );
}

export function ShimmerResultItem() {
  return (
    <div className={styles.resultItem}>
      <div className={styles.resultTop}>
        <Shimmer height={16} width="70%" />
        <Shimmer height={12} width={40} />
      </div>
      <Shimmer height={10} width={90} radius={100} />
      <Shimmer height={4} width="100%" radius={2} />
      <Shimmer height={13} width="100%" />
      <Shimmer height={13} width="85%" />
    </div>
  );
}

export function ShimmerNoteCard() {
  return (
    <div className={styles.noteCard}>
      <Shimmer height={12} width={60} radius={4} />
      <Shimmer height={15} width="80%" radius={5} />
      <Shimmer height={12} width="100%" radius={4} />
      <Shimmer height={12} width="65%" radius={4} />
    </div>
  );
}

export function ShimmerAnalysis() {
  return (
    <div className={styles.analysis}>
      {[80, 60, 100, 90, 75].map((w, i) => (
        <Shimmer key={i} height={13} width={`${w}%`} radius={4} />
      ))}
    </div>
  );
}
