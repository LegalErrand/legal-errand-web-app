import { NIGERIAN_UNIVERSITIES } from '@/lib';
import type { BioDataFormErrors } from '@/lib';
import { SearchableSelect, CountrySelect } from '@/components';
import styles from './page.module.scss';

export interface BioDataCredentialsProps {
  country: string;
  city: string;
  school: string;
  phone: string;
  fieldErrors: BioDataFormErrors;
  onCountryChange: (value: string) => void;
  onCityChange: (value: string) => void;
  onSchoolChange: (value: string) => void;
  onPhoneChange: (value: string) => void;
}

const SCHOOL_OPTIONS = NIGERIAN_UNIVERSITIES as unknown as string[];

const isKnownSchool = (v: string) => !v || SCHOOL_OPTIONS.includes(v);

export default function BioDataCredentials(props: BioDataCredentialsProps) {
  const {
    country,
    city,
    school,
    phone,
    fieldErrors,
    onCountryChange,
    onCityChange,
    onSchoolChange,
    onPhoneChange,
  } = props;

  const schoolIsOther = school !== '' && !isKnownSchool(school);
  const schoolSelectValue = schoolIsOther ? 'Other' : school;

  function handleSchoolSelect(value: string) {
    onSchoolChange(value === 'Other' ? '' : value);
  }

  return (
    <div className={styles.section}>
      <h2 className={styles.sectionTitle}>Other Credentials</h2>
      <div className={styles.credsGrid}>
        <div className={styles.field}>
          <label className={styles.label}>
            Country of Residence <span className={styles.req}>*</span>
          </label>
          <CountrySelect value={country} onChange={onCountryChange} error={fieldErrors.country} />
        </div>

        <div className={styles.field}>
          <label className={styles.label}>
            City <span className={styles.req}>*</span>
          </label>
          <input
            className={styles.input}
            type="text"
            placeholder="E.g Lagos"
            value={city}
            onChange={(e) => onCityChange(e.target.value)}
            aria-invalid={!!fieldErrors.city}
          />
          {fieldErrors.city && <span className={styles.fieldError}>{fieldErrors.city}</span>}
        </div>

        <div className={styles.field}>
          <label className={styles.label}>
            Law School <span className={styles.req}>*</span>
          </label>
          <SearchableSelect
            value={schoolSelectValue}
            onChange={handleSchoolSelect}
            options={SCHOOL_OPTIONS}
            placeholder="Select your law school"
            searchPlaceholder="Search schools..."
            error={fieldErrors.schoolName}
          />
          {(schoolIsOther || schoolSelectValue === 'Other') && (
            <input
              className={`${styles.input} ${styles.inputMt}`}
              type="text"
              placeholder="Enter your law school name"
              value={school}
              onChange={(e) => onSchoolChange(e.target.value)}
              aria-invalid={!!fieldErrors.schoolName}
            />
          )}
          {fieldErrors.schoolName && (
            <span className={styles.fieldError}>{fieldErrors.schoolName}</span>
          )}
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
              placeholder="8012345678"
              value={phone}
              onChange={(e) => onPhoneChange(e.target.value)}
              aria-invalid={!!fieldErrors.phoneNumber}
            />
          </div>
          {fieldErrors.phoneNumber && (
            <span className={styles.fieldError}>{fieldErrors.phoneNumber}</span>
          )}
        </div>
      </div>
    </div>
  );
}
