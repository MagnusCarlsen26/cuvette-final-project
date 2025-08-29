import React from 'react';
import { useLocation } from 'react-router-dom';
import styles from '../Dashboard.module.css';
import badgeIcon from '../../assets/badge.svg';
import settingsIcon from '../../assets/dashboard/settings.svg';

export default function Topbar({ onMenuClick, title: titleOverride }) {
  const location = useLocation();
  const pathname = location?.pathname || '';
  const titleMap = {
    '/dashboard/home': 'Home',
    '/dashboard/product/add': 'Add Product',
    '/dashboard/product': 'Product',
    '/dashboard/invoice': 'Invoice',
    '/dashboard/statistics': 'Statistics',
    '/dashboard/setting': 'Setting'
  };
  const resolvedTitle = Object.keys(titleMap)
    .sort((a, b) => b.length - a.length)
    .find((p) => pathname.startsWith(p));

  function titleCase(str) {
    return String(str || '')
      .split(/[-_\s]+/)
      .filter(Boolean)
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ');
  }

  function deriveFromPath(path) {
    // Try to derive a meaningful title from the URL when not present in sidebar map
    const parts = String(path || '')
      .split('/')
      .filter(Boolean);
    // Prefer last segment that isn't an ObjectId-like or purely numeric
    for (let i = parts.length - 1; i >= 0; i--) {
      const seg = parts[i];
      if (/^[0-9a-fA-F]{24}$/.test(seg)) continue; // likely Mongo ObjectId
      if (/^\d+$/.test(seg)) continue; // numeric id
      return titleCase(seg);
    }
    return 'Dashboard';
  }

  const pageTitle = titleOverride || (resolvedTitle ? titleMap[resolvedTitle] : deriveFromPath(pathname));
  return (
    <div className={styles.topbar}>
      <div className={styles.topbarLeft}>
        <img src={badgeIcon} alt="Logo" className={styles.badgeIcon} />
        <div className={styles.topbarTitle}>{pageTitle}</div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        
        <button title="Settings" className={styles.settingsButton} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--color-text)' }} onClick={() => { window.location.href = '/dashboard/setting'; }}>
          <img src={settingsIcon} alt="" width={16} height={16} />
        </button>
      </div>
    </div>
  );
}


