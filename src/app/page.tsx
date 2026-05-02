import Navbar from '@/components/Navbar';
import WaitlistForm from '@/components/WaitlistForm';
import styles from './page.module.scss';

const FEATURES = [
  'AI that breaks down any judgment, ratio decidendi, obiter dicta, key principles in plain English.',
  'Exam prep tailored to Nigerian Bar and semester exams with practice questions and model answers.',
  'Search thousands of Nigerian court judgments and legal precedents instantly.',
  'Study guides for contracts, torts, criminal law, constitutional law and more.',
];

const STATS = [
  { value: '100', label: 'Free Founding Spots' },
  { value: '3+', label: 'Study Tools Built' },
  { value: '0', label: 'Cost to Join' },
];

export default function WaitlistPage() {
  return (
    <div className={styles.page}>
      <Navbar />

      <section className={styles.hero}>
        <div className={styles.left}>
          <p className={styles.eyebrow}>For Nigerian Law Undergraduates</p>

          <h1 className={styles.headline}>
            The study tool your lecturer{' '}
            <span>never gave you.</span>
          </h1>

          <p className={styles.description}>
            LegalErrand uses AI to breakdown court cases, simplify legal
            concepts, and prepare you for your exams.
            <br />
            Built specifically for Nigerian law undergraduates from 100 level to finals.
          </p>

          <div className={styles.stats}>
            {STATS.map(s => (
              <div key={s.label} className={styles.stat}>
                <div className={styles.statValue}>{s.value}</div>
                <div className={styles.statLabel}>{s.label}</div>
              </div>
            ))}
          </div>

          <div className={styles.features}>
            {FEATURES.map(f => (
              <div key={f} className={styles.featureItem}>{f}</div>
            ))}
          </div>
        </div>

        <div className={styles.right}>
          <WaitlistForm />
        </div>
      </section>
    </div>
  );
}
