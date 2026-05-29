import Link from "next/link";
import { FileTextIcon } from "../icons";
import styles from "./DocCard.module.scss";

interface DocCardProps {
  id: string;
  title: string;
  subject?: string;
  description?: string;
  href: string;
}

export function DocCard({ id: _id, title, subject, description, href }: DocCardProps) {
  return (
    <div className={styles.card}>
      <div className={styles.thumb}>
        <div className={styles.thumbInner}>
          <FileTextIcon size={36} color="rgba(255,255,255,0.6)" />
          {subject && <span className={styles.thumbLabel}>{subject}</span>}
        </div>
      </div>
      <div className={styles.body}>
        <Link href={href} className={styles.title}>{title}</Link>
        {(description ?? subject) && (
          <p className={styles.desc}>{description ?? subject}</p>
        )}
        <Link href={href} className={styles.readBtn}>Read</Link>
      </div>
    </div>
  );
}
