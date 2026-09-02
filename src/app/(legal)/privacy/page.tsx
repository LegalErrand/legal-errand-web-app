import type { Metadata } from 'next';
import Link from 'next/link';
import styles from '../legal.module.scss';

export const dynamic = 'force-static';

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description:
    'How LegalErrand collects, uses, and protects personal data for Nigerian law students using our AI study platform.',
  alternates: { canonical: '/privacy' },
};

const UPDATED = '2 September 2026';

export default function PrivacyPage() {
  return (
    <article>
      <p className={styles.kicker}>Legal</p>
      <h1 className={styles.title}>Privacy Policy</h1>
      <p className={styles.updated}>Effective {UPDATED}</p>
      <p className={styles.lead}>
        This policy explains what personal information LegalErrand collects when you use our website
        and study platform, why we use it, and the choices you have. We process data in line with
        the Nigeria Data Protection Act 2023 (NDPA) and the Nigeria Data Protection Regulation.
      </p>

      <ol className={styles.toc}>
        <li>
          <a href="#who">1. Who we are</a>
        </li>
        <li>
          <a href="#collect">2. Information we collect</a>
        </li>
        <li>
          <a href="#use">3. How we use your information</a>
        </li>
        <li>
          <a href="#google">4. Google sign-in</a>
        </li>
        <li>
          <a href="#ai">5. AI features and your content</a>
        </li>
        <li>
          <a href="#share">6. Who we share data with</a>
        </li>
        <li>
          <a href="#security">7. Storage and security</a>
        </li>
        <li>
          <a href="#rights">8. Your rights</a>
        </li>
        <li>
          <a href="#cookies">9. Cookies and local storage</a>
        </li>
        <li>
          <a href="#children">10. Age</a>
        </li>
        <li>
          <a href="#contact">11. Changes and contact</a>
        </li>
      </ol>

      <section className={styles.section} id="who">
        <h2>1. Who we are</h2>
        <p>
          LegalErrand (“we”, “us”) operates the LegalErrand website and AI-native study platform for
          law students at <Link href="/">legalerrand.com</Link> and related subdomains (together,
          the “Service”).
        </p>
        <p>
          For privacy questions or NDPA requests, email{' '}
          <a href="mailto:info@legalerrand.com">info@legalerrand.com</a>.
        </p>
      </section>

      <section className={styles.section} id="collect">
        <h2>2. Information we collect</h2>
        <h3>Account and profile</h3>
        <p>When you register, sign in, or complete your profile we may collect:</p>
        <ul>
          <li>Name, email address, and password (stored as a one-way hash)</li>
          <li>
            If you use Google sign-in: your Google account ID, verified email address, and name, as
            provided by Google
          </li>
          <li>Account type (undergraduate or law school student)</li>
          <li>
            Optional profile details such as school, country, city, phone number, username, and
            avatar
          </li>
          <li>Referral codes if you join through another student</li>
        </ul>
        <h3>Study activity</h3>
        <p>
          To run the product we store notes, research sessions, quiz attempts, library uploads,
          bookmarks, AI chat and tutoring sessions, goals, and similar study records you create.
        </p>
        <h3>Technical data</h3>
        <p>
          We automatically collect IP address, device and browser type, pages visited, and
          approximate usage timestamps. We use this to operate, secure, and improve the Service
          (including rate limiting sign-in attempts).
        </p>
        <h3>Payments</h3>
        <p>
          If you subscribe to a paid plan, payment details are processed by our payment provider. We
          do not store full card numbers on our servers.
        </p>
      </section>

      <section className={styles.section} id="use">
        <h2>3. How we use your information</h2>
        <p>We use personal data to:</p>
        <ul>
          <li>Create and authenticate your account (email and password, or Google)</li>
          <li>Send verification and password-reset codes by email</li>
          <li>Provide study tools, save your work, and personalise progress</li>
          <li>Process AI requests you submit (questions, notes, documents, research queries)</li>
          <li>Prevent abuse, spam, and unauthorised access</li>
          <li>Diagnose errors (including via error monitoring) and understand product usage</li>
          <li>Communicate service updates and respond to support requests</li>
        </ul>
        <p>
          We rely on performance of our contract with you, your consent where required (for example
          certain cookies or optional profile fields), and our legitimate interests in running a
          secure educational product, consistent with the NDPA.
        </p>
      </section>

      <section className={styles.section} id="google">
        <h2>4. Google sign-in</h2>
        <p>
          If you choose “Sign in with Google”, Google authenticates you. We then receive a limited
          set of Google user data: your Google account ID, verified email address, and name. We do
          not receive your Google password, Gmail contents, Drive files, contacts, calendar, or
          other Google product data.
        </p>
        <p>We use that Google user data only to:</p>
        <ul>
          <li>
            Create your LegalErrand account, or link it to an existing account with the same email
          </li>
          <li>Sign you in on later visits</li>
          <li>Show your name and email in the product and in account-related messages</li>
        </ul>
        <p>
          We do not sell Google user data. We do not use it for advertising, retargeting, or
          credit-worthiness. We do not use it to train general-purpose AI models. We do not transfer
          Google user data to third parties except our hosting and database providers as needed to
          operate the Service, or if required by law.
        </p>
        <p>
          LegalErrand’s use and transfer to any other app of information received from Google APIs
          will adhere to the{' '}
          <a
            href="https://developers.google.com/terms/api-services-user-data-policy"
            rel="noopener noreferrer"
            target="_blank"
          >
            Google API Services User Data Policy
          </a>
          , including the Limited Use requirements.
        </p>
        <p>
          Google’s own processing is described in the{' '}
          <a href="https://policies.google.com/privacy" rel="noopener noreferrer" target="_blank">
            Google Privacy Policy
          </a>
          . You can revoke LegalErrand’s access from your{' '}
          <a
            href="https://myaccount.google.com/permissions"
            rel="noopener noreferrer"
            target="_blank"
          >
            Google account permissions
          </a>
          . After you revoke access you may still need a LegalErrand password to sign in. To delete
          the Google data we hold, email{' '}
          <a href="mailto:info@legalerrand.com">info@legalerrand.com</a> or delete your LegalErrand
          account.
        </p>
      </section>

      <section className={styles.section} id="ai">
        <h2>5. AI features and your content</h2>
        <p>
          Features such as AI chat, case explainer, research, note analysis, and Socratic tutoring
          send the text or documents you provide to our AI providers so we can generate a response.
          Do not upload material you are not allowed to share (for example confidential client
          files, if you are not authorised to process them).
        </p>
        <p>
          AI output can be incomplete or incorrect. It is a study aid, not legal advice and not a
          substitute for your own reading of primary sources.
        </p>
      </section>

      <section className={styles.section} id="share">
        <h2>6. Who we share data with</h2>
        <p>We share data with service providers who help us run LegalErrand, including:</p>
        <ul>
          <li>Hosting and database providers</li>
          <li>Cloud file storage for documents and avatars you upload</li>
          <li>Email delivery for OTPs and transactional messages</li>
          <li>AI model providers that process prompts you submit</li>
          <li>Analytics and error-monitoring tools</li>
        </ul>
        <p>
          We do not sell your personal information, including information received from Google. We
          may disclose data if required by Nigerian law or to protect the Service, our users, or our
          legal rights.
        </p>
      </section>

      <section className={styles.section} id="security">
        <h2>7. Storage and security</h2>
        <p>
          Account and study data are stored in databases and object storage we control through our
          hosting providers. Some providers process data outside Nigeria. Where that happens, we
          take steps appropriate under the NDPA to protect the transfer.
        </p>
        <p>
          We use encryption in transit, hashed passwords, access controls, and rate limiting. No
          internet service is perfectly secure; please use a strong unique password and keep your
          sign-in details private.
        </p>
        <p>
          We keep account data while your account is active. After deletion or prolonged inactivity
          we remove or anonymise personal data within a reasonable period, except where we must
          retain records for security, dispute resolution, or legal obligations.
        </p>
      </section>

      <section className={styles.section} id="rights">
        <h2>8. Your rights</h2>
        <p>Subject to the NDPA, you may request to:</p>
        <ul>
          <li>Access the personal data we hold about you</li>
          <li>Correct inaccurate data</li>
          <li>Delete your account and associated personal data</li>
          <li>Object to or restrict certain processing</li>
          <li>Withdraw consent where processing is based on consent</li>
        </ul>
        <p>
          Email <a href="mailto:info@legalerrand.com">info@legalerrand.com</a> from the address on
          your account. You may also lodge a complaint with the Nigeria Data Protection Commission.
        </p>
      </section>

      <section className={styles.section} id="cookies">
        <h2>9. Cookies and local storage</h2>
        <p>
          We use essential storage in your browser (including local storage) to keep you signed in
          (access tokens) and to remember onboarding details. Analytics tools may set cookies to
          understand how the site is used. You can block non-essential cookies in your browser; the
          Service may not function fully without essential storage.
        </p>
      </section>

      <section className={styles.section} id="children">
        <h2>10. Age</h2>
        <p>
          LegalErrand is built for university and law-school students. You must be at least 16, or
          the minimum age required to hold an account in your jurisdiction. We do not knowingly
          collect personal data from children below that age. If you believe we have, contact us and
          we will delete it.
        </p>
      </section>

      <section className={styles.section} id="contact">
        <h2>11. Changes and contact</h2>
        <p>
          We may update this policy as the product or the law changes. The “Effective” date above
          will change when we do. Continued use after an update means you accept the revised policy.
        </p>
        <p>
          Questions: <a href="mailto:info@legalerrand.com">info@legalerrand.com</a>. Related
          document: <Link href="/terms-of-use">Terms of Use</Link>.
        </p>
      </section>
    </article>
  );
}
