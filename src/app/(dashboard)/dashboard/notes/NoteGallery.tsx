import type { NoteTemplate } from '@/lib';
import { Spinner } from '@/components';
import { CategoryIcon } from './CategoryIcon';
import styles from './page.module.scss';

interface Props {
  templates: NoteTemplate[];
  loading: boolean;
  creating: boolean;
  error: string;
  savedCount: number;
  onCreate: (tpl: NoteTemplate) => void;
  onViewSaved: () => void;
}

export function NoteGallery({
  templates,
  loading,
  creating,
  error,
  savedCount,
  onCreate,
  onViewSaved,
}: Props) {
  const blankTpl = templates.find((t) => t.id === 'blank');
  const iracTpl = templates.find((t) => t.id === 'irac');
  const proTemplates = templates.filter((t) => t.id !== 'blank' && t.id !== 'irac');

  return (
    <div className={styles.page}>
      <header className={styles.galleryBar}>
        <div>
          <h1 className={styles.galleryTitle}>Create New Legal Note</h1>
          <p className={styles.gallerySub}>
            Select a specialised template to structure your research or start with a blank canvas
            for custom drafting.
          </p>
        </div>
        <button className={styles.savedNotesBtn} onClick={onViewSaved}>
          Saved Notes
          {savedCount > 0 && <span className={styles.savedCount}>{savedCount}</span>}
        </button>
      </header>

      <div className={styles.galleryContent}>
        {error && (
          <p className={styles.error} role="alert">
            {error}
          </p>
        )}

        {loading ? (
          <div className={styles.proGrid}>
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className={styles.proCard} style={{ minHeight: 120, opacity: 0.4 }} />
            ))}
          </div>
        ) : (
          <>
            <section>
              <p className={styles.sectionLabel}>RECOMMENDED FOR YOU</p>
              <div className={styles.recommendedRow}>
                {blankTpl && (
                  <button
                    className={styles.blankCard}
                    onClick={() => onCreate(blankTpl)}
                    disabled={creating}
                  >
                    <div className={styles.blankIcon}>
                      <svg
                        width="28"
                        height="28"
                        viewBox="0 0 24 24"
                        fill="none"
                        aria-hidden="true"
                      >
                        <path
                          d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9l-6-6Z"
                          stroke="currentColor"
                          strokeWidth="1.8"
                          strokeLinejoin="round"
                        />
                        <path d="M14 3v6h6" stroke="currentColor" strokeWidth="1.8" />
                      </svg>
                    </div>
                    <span className={styles.blankLabel}>{blankTpl.name}</span>
                    <span className={styles.blankDesc}>{blankTpl.description}</span>
                    <span className={styles.selectFree}>Select free-form</span>
                  </button>
                )}

                {iracTpl && (
                  <div className={styles.featuredCard}>
                    <div className={styles.featuredImg} aria-hidden="true" />
                    <div className={styles.featuredBody}>
                      <div className={styles.featuredTags}>
                        <span className={styles.featuredTag}>Popular</span>
                        <span className={styles.featuredTag}>{iracTpl.category ?? 'Academic'}</span>
                      </div>
                      <h3 className={styles.featuredTitle}>{iracTpl.name}</h3>
                      <p className={styles.featuredDesc}>{iracTpl.description}</p>
                      <button
                        className={styles.useTemplateBtn}
                        onClick={() => onCreate(iracTpl)}
                        disabled={creating}
                      >
                        {creating ? (
                          <span className={styles.btnLoading}>
                            <Spinner size={14} light /> Creating…
                          </span>
                        ) : (
                          'Use Template'
                        )}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </section>

            {proTemplates.length > 0 && (
              <section>
                <p className={styles.sectionLabel}>PROFESSIONAL TEMPLATES</p>
                <div className={styles.proGrid}>
                  {proTemplates.map((tpl) => (
                    <button
                      key={tpl.id}
                      className={styles.proCard}
                      onClick={() => onCreate(tpl)}
                      disabled={creating}
                    >
                      <div className={styles.proIcon}>
                        <CategoryIcon category={tpl.category} />
                      </div>
                      <h3 className={styles.proTitle}>{tpl.name}</h3>
                      <p className={styles.proDesc}>{tpl.description}</p>
                      <div className={styles.proFooter}>
                        <span className={styles.proCategory}>{tpl.category}</span>
                        <svg
                          width="14"
                          height="14"
                          viewBox="0 0 24 24"
                          fill="none"
                          aria-hidden="true"
                        >
                          <path
                            d="M5 12h14M13 6l6 6-6 6"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      </div>
                    </button>
                  ))}
                </div>
              </section>
            )}
          </>
        )}
      </div>
    </div>
  );
}
