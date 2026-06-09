import Image from 'next/image';
import { AvatarUploader } from '@/components';
import styles from './page.module.scss';

export interface BioDataProfileCardProps {
  token: string;
  sessionEmail: string;
  avatarUrl: string | null;
  username: string;
  firstName: string;
  lastName: string;
  editing: boolean;
  onAvatarSuccess: (url: string) => void;
  onToggleEditing: () => void;
  onUsernameChange: (value: string) => void;
  onFirstNameChange: (value: string) => void;
  onLastNameChange: (value: string) => void;
}

export default function BioDataProfileCard(props: BioDataProfileCardProps) {
  const {
    token,
    sessionEmail,
    avatarUrl,
    username,
    firstName,
    lastName,
    editing,
    onAvatarSuccess,
    onToggleEditing,
    onUsernameChange,
    onFirstNameChange,
    onLastNameChange,
  } = props;

  return (
    <div className={styles.section}>
      <div className={styles.sectionHeader}>
        <h2 className={styles.sectionTitle}>Bio Data</h2>
        <button type="button" className={styles.editBtn} onClick={onToggleEditing}>
          {editing ? 'Done' : 'Edit Bio Data'}
        </button>
      </div>
      <div className={styles.bioBody}>
        <div className={styles.avatarCol}>
          <div className={styles.avatarWrap}>
            {avatarUrl ? (
              <img src={avatarUrl} alt="Avatar" className={styles.avatarImg} />
            ) : (
              <Image
                src="/icons/avatar.svg"
                alt="Avatar placeholder"
                width={80}
                height={80}
                className={styles.avatarPlaceholder}
              />
            )}
          </div>
          <AvatarUploader
            token={token}
            onSuccess={onAvatarSuccess}
            onPreview={(url) => url && onAvatarSuccess(url)}
          />
          <p className={styles.avatarHint}>JPEG, PNG, or WebP, up to 5 MB</p>
        </div>

        <div className={styles.bioFields}>
          <div className={styles.row}>
            <div className={styles.field}>
              <label className={styles.label}>
                School Email Address
                <span className={styles.verified}>Verified</span>
              </label>
              <input className={styles.input} type="email" value={sessionEmail} readOnly />
            </div>
            <div className={styles.field}>
              <label className={styles.label}>
                Username
                <span className={styles.optional}>Optional</span>
              </label>
              <input
                className={styles.input}
                type="text"
                placeholder="Choose a Username"
                value={username}
                onChange={(e) => onUsernameChange(e.target.value)}
                disabled={!editing}
              />
            </div>
          </div>
          <div className={styles.row}>
            <div className={styles.field}>
              <label className={styles.label}>First Name</label>
              <input
                className={styles.input}
                type="text"
                value={firstName}
                onChange={(e) => onFirstNameChange(e.target.value)}
                disabled={!editing}
              />
            </div>
            <div className={styles.field}>
              <label className={styles.label}>
                Last Name
                {editing && <span className={styles.editingBadge}>Editing</span>}
              </label>
              <input
                className={styles.input}
                type="text"
                value={lastName}
                onChange={(e) => onLastNameChange(e.target.value)}
                disabled={!editing}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
