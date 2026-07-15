import { NLS_CAMPUSES, NIGERIAN_UNIVERSITIES, COUNTRY_DIAL_CODES } from '@/lib';
import type { BioDataFormErrors } from '@/lib';
import { SearchableSelect, CountrySelect } from '@/components';
import styles from './page.module.scss';

export interface BioDataCredentialsProps {
  country: string;
  city: string;
  school: string;
  phone: string;
  accountType: string;
  fieldErrors: BioDataFormErrors;
  onCountryChange: (value: string) => void;
  onCityChange: (value: string) => void;
  onSchoolChange: (value: string) => void;
  onPhoneChange: (value: string) => void;
}

const NLS_OPTIONS = [...NLS_CAMPUSES, 'Other'] as string[];
const UNI_OPTIONS = [...NIGERIAN_UNIVERSITIES, 'Other'] as string[];

function isKnownOption(v: string, options: string[]) {
  return !v || options.includes(v);
}

export default function BioDataCredentials(props: BioDataCredentialsProps) {
  const {
    country,
    city,
    school,
    phone,
    accountType,
    fieldErrors,
    onCountryChange,
    onCityChange,
    onSchoolChange,
    onPhoneChange,
  } = props;

  const isLawSchool = accountType === 'Law School Student';
  const schoolOptions = isLawSchool ? NLS_OPTIONS : UNI_OPTIONS;
  const schoolLabel = isLawSchool ? 'Law School' : 'University / Campus';
  const schoolPlaceholder = isLawSchool ? 'Select your NLS campus' : 'Select your university';
  const searchPlaceholder = isLawSchool ? 'Search campuses...' : 'Search universities...';

  const dialCode = COUNTRY_DIAL_CODES[country] ?? '+234';
  const schoolIsOther =
    school !== '' &&
    !isKnownOption(
      school,
      schoolOptions.filter((o) => o !== 'Other')
    );
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
            {schoolLabel} <span className={styles.req}>*</span>
          </label>
          <SearchableSelect
            value={schoolSelectValue}
            onChange={handleSchoolSelect}
            options={schoolOptions}
            placeholder={schoolPlaceholder}
            searchPlaceholder={searchPlaceholder}
            error={fieldErrors.schoolName}
          />
          {(schoolIsOther || schoolSelectValue === 'Other') && (
            <input
              className={`${styles.input} ${styles.inputMt}`}
              type="text"
              placeholder={
                isLawSchool ? 'Enter your law school name' : 'Enter your university name'
              }
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
            <span className={styles.phonePrefix}>{dialCode}</span>
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
