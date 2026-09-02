import type { Metadata } from 'next';
import Link from 'next/link';
import styles from '../legal.module.scss';

export const metadata: Metadata = {
  title: 'Terms of Use',
  description:
    'Terms governing your use of LegalErrand, the AI study platform for Nigerian law students.',
  alternates: { canonical: '/terms-of-use' },
};

const UPDATED = '2 September 2026';

export default function TermsOfUsePage() {
  return (
    <article>
      <p className={styles.kicker}>Legal</p>
      <h1 className={styles.title}>Terms of Use</h1>
      <p className={styles.updated}>Effective {UPDATED}</p>
      <p className={styles.lead}>
        These terms are a contract between you and LegalErrand for use of our website and study
        platform. By creating an account or using the Service, you agree to them. If you do not
        agree, do not use LegalErrand.
      </p>

      <ol className={styles.toc}>
        <li>
          <a href="#service">1. The Service</a>
        </li>
        <li>
          <a href="#eligibility">2. Eligibility and accounts</a>
        </li>
        <li>
          <a href="#conduct">3. Acceptable use</a>
        </li>
        <li>
          <a href="#content">4. Your content and AI</a>
        </li>
        <li>
          <a href="#advice">5. Not legal advice</a>
        </li>
        <li>
          <a href="#plans">6. Plans and fees</a>
        </li>
        <li>
          <a href="#ip">7. Intellectual property</a>
        </li>
        <li>
          <a href="#liability">8. Disclaimers and liability</a>
        </li>
        <li>
          <a href="#end">9. Suspension and termination</a>
        </li>
        <li>
          <a href="#law">10. Governing law</a>
        </li>
      </ol>

      <section className={styles.section} id="service">
        <h2>1. The Service</h2>
        <p>
          LegalErrand provides study tools for law students, including case explanation, notes, a
          document library, research search, quizzes, progress tracking, and AI tutoring. We may
          change, add, or remove features. We do not guarantee uninterrupted availability.
        </p>
      </section>

      <section className={styles.section} id="eligibility">
        <h2>2. Eligibility and accounts</h2>
        <p>
          You must be at least 16 (or older if your local law requires it) and able to form a
          binding contract. You are responsible for the accuracy of the information you submit and
          for keeping your password and devices secure.
        </p>
        <p>
          You may sign up with email or Google. One person should keep one account. You must not
          share login details or let others sit exams or complete assessments through your account.
        </p>
        <p>
          We may refuse, suspend, or close accounts that violate these terms or that we reasonably
          believe are abusive, fraudulent, or unlawful.
        </p>
      </section>

      <section className={styles.section} id="conduct">
        <h2>3. Acceptable use</h2>
        <p>You agree not to:</p>
        <ul>
          <li>Use the Service for anything illegal under Nigerian or applicable law</li>
          <li>Upload malware, scrape the Service in a way that harms it, or attempt to break in</li>
          <li>Harass others or post unlawful, defamatory, or infringing material</li>
          <li>
            Reverse engineer the platform except where the law allows, or resell access without our
            permission
          </li>
          <li>
            Use AI features to generate content you then present as your unaided academic work where
            your institution forbids it — you remain responsible for academic integrity rules at
            your school
          </li>
        </ul>
      </section>

      <section className={styles.section} id="content">
        <h2>4. Your content and AI</h2>
        <p>
          You retain rights in notes, uploads, and other material you put into LegalErrand. You
          grant us a licence to host, process, and display that material solely to provide and
          improve the Service (including sending it to AI providers when you use those features).
        </p>
        <p>
          You must have the right to upload what you upload. Do not submit confidential client
          matter unless you are authorised to do so. We may remove content that we reasonably
          believe breaches these terms or the law.
        </p>
        <p>
          AI-generated text is produced automatically. It may be wrong, outdated, or incomplete. You
          are responsible for checking primary sources (statutes, law reports, and your course
          materials) before relying on any output in an exam, assignment, or professional setting.
        </p>
      </section>

      <section className={styles.section} id="advice">
        <h2>5. Not legal advice</h2>
        <p>
          LegalErrand is an educational product. We are not a law firm. Nothing on the Service is
          legal advice, a solicitor–client relationship, or a substitute for qualified counsel.
          Nigerian law and procedure change; always verify against official sources.
        </p>
      </section>

      <section className={styles.section} id="plans">
        <h2>6. Plans and fees</h2>
        <p>
          Some features are available on a free plan with usage limits (for example daily AI
          queries). Paid plans, if offered, are described at signup or in the product. Fees are
          charged in the currency shown at checkout. Except where Nigerian consumer law requires
          otherwise, fees are non-refundable once a billing period has started.
        </p>
        <p>We may change prices or limits with reasonable notice for future periods.</p>
      </section>

      <section className={styles.section} id="ip">
        <h2>7. Intellectual property</h2>
        <p>
          The LegalErrand name, logos, software, and curated library materials we provide remain
          ours or our licensors’. You may use them only as needed to use the Service. You may not
          copy our question banks, case explainers, or other proprietary collections for a competing
          product.
        </p>
        <p>
          Court judgments and statutes displayed for study may be public documents; presentation,
          selection, and our original commentary are protected where applicable.
        </p>
      </section>

      <section className={styles.section} id="liability">
        <h2>8. Disclaimers and liability</h2>
        <p>
          The Service is provided “as is”. To the fullest extent permitted by law, we disclaim
          implied warranties of merchantability, fitness for a particular purpose, and
          non-infringement. We do not warrant that AI answers or research results are accurate or
          complete.
        </p>
        <p>
          To the fullest extent permitted by Nigerian law, LegalErrand is not liable for lost marks,
          failed exams, lost profits, or indirect or consequential loss. Our total liability for any
          claim relating to the Service is limited to the amount you paid us in the 12 months before
          the claim, or ₦10,000 if you have paid nothing.
        </p>
        <p>Nothing in these terms limits liability that cannot be limited by law.</p>
      </section>

      <section className={styles.section} id="end">
        <h2>9. Suspension and termination</h2>
        <p>
          You may stop using the Service and request account deletion as described in our{' '}
          <Link href="/privacy">Privacy Policy</Link>. We may suspend or terminate access if you
          breach these terms, if we must do so by law, or if we discontinue the Service. On
          termination, your licence to use the platform ends. Sections that by nature should survive
          (including intellectual property, disclaimers, and governing law) remain in effect.
        </p>
      </section>

      <section className={styles.section} id="law">
        <h2>10. Governing law</h2>
        <p>
          These terms are governed by the laws of the Federal Republic of Nigeria. Courts in Nigeria
          have exclusive jurisdiction, except that we may seek injunctive relief in any forum to
          protect our intellectual property or the security of the Service.
        </p>
        <p>
          We may update these terms by posting a new version on this page. Material changes will be
          reflected in the effective date. Continued use after the update constitutes acceptance.
        </p>
        <p>
          Contact: <a href="mailto:info@legalerrand.com">info@legalerrand.com</a>. See also our{' '}
          <Link href="/privacy">Privacy Policy</Link>.
        </p>
      </section>
    </article>
  );
}
