import Image from 'next/image';
import Link from 'next/link';
import styles from './Navbar.module.scss';

export default function Navbar() {
  return (
    <nav className={styles.navbar}>
      <div className={styles.inner}>
        <div className={styles.logo}>
          <Image src="/logo.svg" alt="LegalErrand" width={160} height={36} priority />
        </div>
        <Link href="/signup" className={styles.ctaBtn}>
          Get Started
        </Link>
      </div>
    </nav>
  );
}
