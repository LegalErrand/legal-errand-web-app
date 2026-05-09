import type { BioDataFormErrors } from '@/lib/validation';
import styles from './page.module.scss';

const COUNTRIES = ['Nigeria', 'Ghana', 'Kenya', 'South Africa', 'United Kingdom', 'United States'] as const;

export interface BioDataCredentialsProps {
  country: string;
  city: string;
  school: string;
  level: string;
  matric: string;
  phone: string;
  fieldErrors: BioDataFormErrors;
  onCountryChange: (value: string) => void;
  onCityChange: (value: string) => void;
  onSchoolChange: (value: string) => void;
  onLevelChange: (value: string) => void;
  onMatricChange: (value: string) => void;
  onPhoneChange: (value: string) => void;
}

export default function BioDataCredentials(props: BioDataCredentialsProps) {
  const {
    country,
    city,
    school,
    level,
    matric,
    phone,
    fieldErrors,
    onCountryChange,
    onCityChange,
    onSchoolChange,
    onLevelChange,
    onMatricChange,
    onPhoneChange,
  } = props;

  return (
    <div className={styles.section}>
      <h2 className={styles.sectionTitle}>Other Credentials</h2>
      <div className={styles.credsGrid}>
        <div className={styles.field}>
          <label className={styles.label}>
            Country of Residence <span className={styles.req}>*</span>
          </label>
          <div className={styles.selectWrap}>
            <select
              className={styles.select}
              value={country}
              onChange={(e) => onCountryChange(e.target.value)}
              aria-invalid={!!fieldErrors.country}
            >
              <option value="">Select Country</option>
              {COUNTRIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
          {fieldErrors.country && <span className={styles.fieldError}>{fieldErrors.country}</span>}
        </div>
        <div className={styles.field}>
          <label className={styles.label}>
            City <span className={styles.req}>*</span>
          </label>
          <input
            className={styles.input}
            type="text"
            placeholder="E.g London"
            value={city}
            onChange={(e) => onCityChange(e.target.value)}
            aria-invalid={!!fieldErrors.city}
          />
          {fieldErrors.city && <span className={styles.fieldError}>{fieldErrors.city}</span>}
        </div>
        <div className={styles.field}>
          <label className={styles.label}>
            School Name <span className={styles.req}>*</span>
          </label>
          <input
            className={styles.input}
            type="text"
            placeholder="e.g Yabatech"
            value={school}
            onChange={(e) => onSchoolChange(e.target.value)}
            aria-invalid={!!fieldErrors.schoolName}
          />
          {fieldErrors.schoolName && <span className={styles.fieldError}>{fieldErrors.schoolName}</span>}
        </div>
        <div className={styles.field}>
          <label className={styles.label}>
            Level/Year <span className={styles.req}>*</span>
          </label>
          <input
            className={styles.input}
            type="text"
            placeholder="Current year Level e.g 1st year"
            value={level}
            onChange={(e) => onLevelChange(e.target.value)}
            aria-invalid={!!fieldErrors.levelYear}
          />
          {fieldErrors.levelYear && <span className={styles.fieldError}>{fieldErrors.levelYear}</span>}
        </div>
        <div className={styles.field}>
          <label className={styles.label}>
            Matric Number <span className={styles.optional}>Optional</span>
          </label>
          <input
            className={styles.input}
            type="text"
            placeholder="Enter your Matric Number"
            value={matric}
            onChange={(e) => onMatricChange(e.target.value)}
          />
        </div>
        <div className={styles.field}>
          <label className={styles.label}>
            Phone Number <span className={styles.req}>*</span>
          </label>
          <div className={styles.phoneWrap}>
            <span className={styles.phonePrefix}>+234</span>
            <input
              className={`${styles.input} ${styles.phoneInput}`}
              type="tel"
              value={phone}
              onChange={(e) => onPhoneChange(e.target.value)}
              aria-invalid={!!fieldErrors.phoneNumber}
            />
          </div>
          {fieldErrors.phoneNumber && <span className={styles.fieldError}>{fieldErrors.phoneNumber}</span>}
        </div>
      </div>
    </div>
  );
}
