import Image from 'next/image';
import Link from 'next/link';
import styles from './Navbar.module.scss';

export default function Navbar() {
  return (
    <nav className={styles.navbar}>
      <div className={styles.inner}>
        <div className={styles.logo}>
          <Image
            src="/logo.svg"
            alt="LegalErrand"
            width={148}
            height={34}
            priority
            style={{ height: '32px', width: 'auto' }}
          />
        </div>
        <ul className={styles.navLinks}>
          <li>
            <a href="#features" className={styles.navLink}>
              Features
            </a>
          </li>
          <li>
            <a href="#how-it-works" className={styles.navLink}>
              How it works
            </a>
          </li>
          <li>
            <a href="#for-students" className={styles.navLink}>
              For students
            </a>
          </li>
          <li>
            <a href="#pricing" className={styles.navLink}>
              Pricing
            </a>
          </li>
        </ul>
        <div className={styles.actions}>
          <Link href="/login" className={styles.loginBtn}>
            Log in
          </Link>
          <Link href="/signup" className={styles.ctaBtn}>
            Get Started
          </Link>
        </div>
      </div>
    </nav>
  );
}
