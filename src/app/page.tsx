import Link from 'next/link';
import Image from 'next/image';
import { LandingRedirect, Navbar, AnimateOnScroll, PricingGrid } from '@/components';
import styles from './page.module.scss';

// ─── Icon components ──────────────────────────────────────────────────────────

function IconBook() {
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
}
function IconBrain() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M12 5a7 7 0 0 1 7 7c0 2.5-1.3 4.7-3.3 6H8.3A6.97 6.97 0 0 1 5 12a7 7 0 0 1 7-7Z"
        stroke="currentColor"
        strokeWidth="1.8"
      />
      <path
        d="M9 18v3M15 18v3M9 21h6"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}
function IconChat() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
    </svg>
  );
}
function IconTarget() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.8" />
      <circle cx="12" cy="12" r="6" stroke="currentColor" strokeWidth="1.8" />
      <circle cx="12" cy="12" r="2" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  );
}
function IconSearch() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="1.8" />
      <path d="M21 21l-4.35-4.35" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}
function IconChart() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M18 20V10M12 20V4M6 20v-6"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}
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
function IconPlay() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.8" />
      <path d="M10 8l6 4-6 4V8Z" fill="currentColor" />
    </svg>
  );
}

// ─── Data ─────────────────────────────────────────────────────────────────────

const PAIN_POINTS = [
  {
    icon: '/images/landing-page/textbook-icon.svg',
    title: 'Textbooks cost ₦50,000+ per semester',
    body: "Most students can't afford the full set of recommended textbooks every semester.",
  },
  {
    icon: '/images/landing-page/case-law-icon.svg',
    title: 'Case law is dense and confusing',
    body: 'Inaccessible judgments are written in complex language with little explanation or structure.',
  },
  {
    icon: '/images/landing-page/no-clear-icon.svg',
    title: 'No clear way to measure progress',
    body: "Students study for hours but have no idea if they're improving their legal reasoning.",
  },
];

const FEATURES_GRID = [
  {
    icon: <IconBook />,
    tag: 'NEW',
    tagVariant: 'new' as const,
    title: 'Smart Legal Note Builder',
    body: 'Construct structured, citation-ready notes with AI assistance. Auto-fill case law, statutes, and doctrines as you write. Export in multiple formats.',
  },
  {
    icon: <IconBrain />,
    tag: 'AI',
    tagVariant: 'default' as const,
    title: 'AI Study Assistant',
    body: 'Instant answers to complex legal questions. Switch between direct explanations and Socratic tutoring based on your learning preference.',
  },
  {
    icon: <IconChat />,
    tag: 'BETA',
    tagVariant: 'beta' as const,
    title: 'Socratic Tutor Mode',
    body: 'Develop deep legal reasoning through guided questioning. The AI challenges your thinking without giving away answers — the way great tutors do.',
  },
  {
    icon: <IconTarget />,
    tag: 'PRACTICE',
    tagVariant: 'default' as const,
    title: 'Adaptive Practice Tests',
    body: 'Take past NSS MCQ and essay questions that adapt to your weaknesses. Get detailed performance analysis.',
  },
  {
    icon: <IconSearch />,
    tag: 'LIBRARY',
    tagVariant: 'new' as const,
    title: 'Case Law Library',
    body: 'Browse and search 1,500+ Nigerian judgments from NigeriaLII — Supreme Court, Court of Appeal, and High Courts — with subject tagging for study and research.',
  },
  {
    icon: <IconChart />,
    tag: 'PROGRESS',
    tagVariant: 'default' as const,
    title: 'Progress Dashboard',
    body: 'Track your learning across all subjects and practice areas. Visualise your path to exam day.',
  },
];

const UNIVERSITIES = [
  'Ahmadu Bello University',
  'University of Lagos',
  'University of Ibadan',
  'Obafemi Awolowo University',
  'University of Benin',
];

const PRICING = [
  {
    name: 'Free',
    price: '₦0',
    priceSub: 'Free forever. No credit card.',
    highlight: false,
    cta: 'Start for Free',
    ctaHref: '/signup',
    features: [
      'AI Study Assistant: 10 queries / month',
      'Digital Library: library + 5 uploads',
      'Smart Notes Builder: basic notes',
      'Case Law Explainer: 3 / month',
      'Progress Dashboard: basic stats',
      'Reasoning Questions: 5 / month',
      'AI Socratic Tutor: 5 sessions / month',
      'Legal Reasoning Score: basic score',
      'Legal Research: 5 / month, basic search',
      'Daily Quiz: full access',
      'Test & Exam Prep: quick quiz only',
      'Flashcards: 10 cards',
      'Writing & Citation Assistant: essay planning only',
      'Study Planner & Timetable: manual tasks',
      'Community Hub: read + 5 posts / day',
      'Scholarships Portal: view + 5 applications / month',
    ],
  },
  {
    name: 'Plus',
    price: '₦1,800',
    priceSub: 'per month. Cancel anytime.',
    highlight: true,
    cta: 'Get Plus',
    ctaHref: '/signup',
    features: [
      'AI Study Assistant: 100 queries / month',
      'Digital Library: library + 25 uploads',
      'Smart Notes Builder: notes + AI summarise & expand',
      'Case Law Explainer: 15 / day',
      'Progress Dashboard: stats + weak-area flags',
      'Reasoning Questions: 20 / day + feedback',
      'AI Socratic Tutor: 10 sessions / day',
      'Legal Reasoning Score: score + subject breakdown',
      'Legal Research: 20 / day + AI assistant',
      'Daily Quiz: full access + history',
      'Test & Exam Prep: quick quiz + practice tests',
      'Flashcards: 300 cards + community decks',
      'Writing & Citation Assistant: planning + draft review',
      'Study Planner & Timetable: AI plan (monthly)',
      'Community Hub: unlimited posts',
      'Scholarships Portal: view + 15 applications / month',
    ],
  },
  {
    name: 'Premium',
    price: '₦3,500',
    priceSub: 'per month. Cancel anytime.',
    highlight: false,
    cta: 'Get Premium',
    ctaHref: '/signup',
    features: [
      'AI Study Assistant: 500 queries / month',
      'Digital Library: library + 100 uploads',
      'Smart Notes Builder: notes + AI scoring (50 notes / mo)',
      'Case Law Explainer: 50 / day',
      'Progress Dashboard: full analytics + weekly AI insights',
      'Reasoning Questions: 75 / day + feedback',
      'AI Socratic Tutor: 30 sessions / day',
      'Legal Reasoning Score: breakdown + monthly AI study plan',
      'Legal Research: 50 / day + AI + basic citation links',
      'Daily Quiz: full access + history + basic analytics',
      'Test & Exam Prep: all modes + 15 mock exams / month',
      'Flashcards: 1,500 cards + community decks',
      'Writing & Citation Assistant: planning + full review (20 drafts / mo)',
      'Study Planner & Timetable: AI plan + daily dynamic adjustment',
      'Community Hub: unlimited posts + standard support',
      'Scholarships Portal: view + 50 applications / mo + basic drafting',
    ],
  },
  {
    name: 'Ultimate',
    price: '₦5,000',
    priceSub: 'per month. Cancel anytime.',
    highlight: false,
    dark: true,
    cta: 'Get Ultimate',
    ctaHref: '/signup',
    features: [
      'AI Study Assistant: unlimited (fair use)',
      'Digital Library: unlimited uploads + marketplace',
      'Smart Notes Builder: full AI quality scoring & suggestions',
      'Case Law Explainer: unlimited',
      'Progress Dashboard: full analytics + AI insights (real-time)',
      'Reasoning Questions: unlimited + detailed feedback',
      'AI Socratic Tutor: unlimited sessions',
      'Legal Reasoning Score: full breakdown + dynamic AI study plan',
      'Legal Research: unlimited + AI assistant + citation mapping',
      'Daily Quiz: full access + history + analytics',
      'Test & Exam Prep: all modes + unlimited mock exams',
      'Flashcards: unlimited + community decks',
      'Writing & Citation Assistant: all writing modes',
      'Study Planner & Timetable: full AI planning + reminders',
      'Community Hub: unlimited posts + priority support',
      'Scholarships Portal: unlimited + AI application tools',
    ],
  },
];

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function LandingPage() {
  return (
    <div className={styles.page}>
      <LandingRedirect />
      <AnimateOnScroll />
      <Navbar />

      {/* ── HERO ──────────────────────────────────────────────────────── */}
      <section className={styles.hero}>
        <div className={styles.heroLeft}>
          <h1 className={styles.headline}>
            The Study Tool Your Lecturer
            <br />
            <span>never gave you</span>
          </h1>
          <p className={styles.heroCopy}>
            The AI-native learning platform built specifically for law students to understand
            complex cases instantly, build strong legal reasoning, and prepare for exams with
            confidence.
          </p>
          <div className={styles.heroActions}>
            <Link href="/signup" className={styles.primaryBtn}>
              Start Learning Free
            </Link>
            <a href="#how-it-works" className={styles.ghostBtn}>
              <IconPlay /> Watch AI Tutor Demo
            </a>
          </div>
          <div className={styles.avatarRow}>
            <Image
              src="/images/landing-page/students-avatars.png"
              alt="Students using LegalErrand"
              width={120}
              height={44}
              className={styles.avatarStack}
              style={{ width: 'auto', height: '44px' }}
            />
            <span className={styles.avatarText}>5,358+ Students already learning</span>
          </div>
        </div>
        <div className={styles.heroRight}>
          <div className={styles.heroImgWrap}>
            <Image
              src="/images/landing-page/hero-image.png"
              alt="LegalErrand dashboard on laptop and phone"
              fill
              priority
              sizes="(max-width: 900px) 100vw, 540px"
              className={styles.heroImg}
            />
          </div>
        </div>
      </section>

      {/* ── TRUSTED BY ────────────────────────────────────────────────── */}
      <div className={styles.trustedWrap} data-animate="fade">
        <p className={styles.trustedLabel}>Trusted by students at</p>
        <div className={styles.trustedLogos}>
          {UNIVERSITIES.map((u) => (
            <span key={u} className={styles.trustedLogo}>
              {u}
            </span>
          ))}
        </div>
      </div>

      {/* ── PAIN POINTS ───────────────────────────────────────────────── */}
      <section className={styles.painSection}>
        <h2 className={styles.sectionHeading} data-animate>
          Law School is hard enough.
          <br />
          Your tools shouldn&apos;t make it harder.
        </h2>
        <div className={styles.painGrid}>
          {PAIN_POINTS.map((p, i) => (
            <div
              key={p.title}
              className={styles.painCard}
              data-animate
              data-animate-delay={i * 100}
            >
              <div className={styles.painIconWrap}>
                <Image src={p.icon} alt="" width={40} height={40} aria-hidden="true" />
              </div>
              <h3 className={styles.painTitle}>{p.title}</h3>
              <p className={styles.painBody}>{p.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── FEATURES ──────────────────────────────────────────────────── */}
      <section className={styles.featuresSection} id="features">
        <h2 className={styles.sectionHeading} data-animate>
          Everything you need to <span>conquer</span> the Bar
        </h2>
        <div className={styles.featuresGrid} id="for-students">
          {FEATURES_GRID.map((f, i) => (
            <div
              key={f.title}
              className={styles.featureCard}
              data-animate
              data-animate-delay={i * 80}
            >
              <div className={styles.featureIconWrap}>{f.icon}</div>
              <span
                className={[
                  styles.featureTag,
                  f.tagVariant === 'new'
                    ? styles.featureTagNew
                    : f.tagVariant === 'beta'
                      ? styles.featureTagBeta
                      : styles.featureTagDefault,
                ].join(' ')}
              >
                {f.tag}
              </span>
              <h3 className={styles.featureTitle}>{f.title}</h3>
              <p className={styles.featureBody}>{f.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── TWO MODES ─────────────────────────────────────────────────── */}
      <section className={styles.modesSection} id="how-it-works">
        <div className={styles.modesLeft} data-animate="slide-right">
          <h2 className={styles.sectionHeading}>Two Modes. One Goal</h2>
          <p className={styles.modesCopy}>
            The AI Study Assistant adapts to how you learn. Get direct answers when you&apos;re
            pressed for time, or engage Socratic mode to build the deep reasoning the bar examiners
            demand.
          </p>
          <div className={styles.modeCards}>
            <div className={styles.modeCard}>
              <span className={styles.modeDot} />
              <div>
                <p className={styles.modeTitle}>Direct AI Answers</p>
                <p className={styles.modeDesc}>
                  Stay in the flow. A keyword search and one click reveals relevant case law,
                  statutes, and refined legal discourse with well-reasoned legal authorities.
                </p>
              </div>
            </div>
            <div className={styles.modeCard}>
              <span className={styles.modeDot} style={{ background: '#2563eb' }} />
              <div>
                <p className={styles.modeTitle}>Socratic Tutor Mode</p>
                <p className={styles.modeDesc}>
                  Socratic mode AI learns what you know, guiding you to construct answers through
                  reasoning. Builds the critical analysis skills examiners look for.
                </p>
              </div>
            </div>
          </div>
        </div>
        <div className={styles.modesRight} data-animate="slide-left">
          <div className={styles.laptopsImgWrap}>
            <Image
              src="/images/landing-page/ai-authour-laptops.png"
              alt="LegalErrand AI chat interface on multiple devices"
              width={500}
              height={420}
              className={styles.laptopsImg}
              style={{ width: '100%', height: 'auto' }}
            />
          </div>
        </div>
      </section>

      {/* ── FOR GLOBAL STUDENTS ───────────────────────────────────────── */}
      <section className={styles.globalSection}>
        <div className={styles.globalInner}>
          <div className={styles.globalLeft} data-animate="slide-right">
            <h2 className={styles.sectionHeading}>
              Built specifically for global
              <br />
              law students.
            </h2>
            <p className={styles.globalCopy}>
              Every feature, example, and case reference is grounded in international law and
              tailored to the reality of studying law worldwide.
            </p>
            <ul className={styles.globalList}>
              <li>
                <IconCheck variant="blue" /> Global cases &amp; statutes — International treaties,
                landmark Supreme Court decisions, and key legal frameworks from multiple
                jurisdictions.
              </li>
              <li>
                <IconCheck variant="blue" /> Past exam questions from top law schools worldwide
                including Harvard, Oxford, Yale, and more.
              </li>
              <li>
                <IconCheck variant="blue" /> Generous free tier plus low-cost amazing premium
                features
              </li>
            </ul>
          </div>
          <div className={styles.globalRight} data-animate="slide-left">
            <div className={styles.testimonialCard}>
              <p className={styles.testimonialQuote}>
                &ldquo;I used to spend hours trying to understand cases. With LegalErrand, I get
                explanations in seconds and my notes have actually improved. My Legal Reasoning
                Score went from 58 to 91 in six weeks.&rdquo;
              </p>
              <div className={styles.testimonialAuthor}>
                <div className={styles.testimonialAvatar}>
                  <Image
                    src="/images/landing-page/students-avatars.png"
                    alt="Student"
                    fill
                    sizes="48px"
                    style={{ objectFit: 'cover', objectPosition: 'center' }}
                  />
                </div>
                <div>
                  <p className={styles.testimonialName}>Chidinma Adeyemi</p>
                  <p className={styles.testimonialSchool}>300 Level · University of Lagos</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── PRICING ───────────────────────────────────────────────────── */}
      <section className={styles.pricingSection} id="pricing">
        <h2 className={styles.sectionHeading} data-animate>
          Simple, <span>Transparent</span>, Affordable
        </h2>
        <PricingGrid plans={PRICING} />
      </section>

      {/* ── CTA ───────────────────────────────────────────────────────── */}
      <section className={styles.ctaSection} data-animate="fade">
        <h2 className={styles.ctaHeading}>
          Your Call To The Bar Starts <span>Here</span>
        </h2>
        <p className={styles.ctaCopy}>
          Join thousands of law students around the globe who choose the smarter path to bar exam
          success. Free to start. Cancel anytime.
        </p>
        <div className={styles.ctaActions}>
          <Link href="/signup" className={styles.primaryBtn}>
            Create an Account
          </Link>
          <a href="#features" className={styles.ghostBtnLight}>
            Explore All Features
          </a>
        </div>
      </section>

      {/* ── FOOTER ────────────────────────────────────────────────────── */}
      <footer className={styles.footer}>
        <div className={styles.footerInner}>
          <div className={styles.footerBrand}>
            <Image src="/logo.svg" alt="LegalErrand" width={130} height={30} />
            <p className={styles.footerTagline}>
              Nigeria&apos;s first AI native law exam preparation platform.
              <br />
              Built for the next generation of legal minds.
            </p>
          </div>
          <div className={styles.footerMeta}>
            <nav className={styles.footerLinks} aria-label="Legal">
              <Link href="/privacy">Privacy</Link>
              <Link href="/terms-of-use">Terms of Use</Link>
            </nav>
            <p className={styles.footerCopy}>© 2026 LegalErrand. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
