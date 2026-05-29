import { Navbar, WaitlistForm } from "@/components";
import { FEATURES, STATS } from "@/lib";
import styles from './page.module.scss';

export default function WaitlistPage() {
  return (
    <div className={styles.page}>
      <Navbar />

      <section className={styles.hero}>
        <div className={styles.left}>
          <p className={styles.eyebrow}>For Undergraduate Law Students Globally</p>

          <h1 className={styles.headline}>
            The study tool your lecturer{' '}
            <span>never gave you.</span>
          </h1>

          <p className={styles.description}>
            LegalErrand uses AI to breakdown court cases, simplify legal
            concepts, and prepare you for your exams.
            <br />
            Built specifically for law undergraduates across the globe, from
            year one to finals.
          </p>

          <div className={styles.stats}>
            {STATS.map((s) => (
              <div key={s.label} className={styles.stat}>
                <div className={styles.statValue}>{s.value}</div>
                <div className={styles.statLabel}>{s.label}</div>
              </div>
            ))}
          </div>

          <div className={styles.features}>
            {FEATURES.map((f) => (
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
