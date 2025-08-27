import React from 'react';
import styles from './Topbar.module.css';

export default function Topbar() {
  return (
    <div className={styles.topbar}>
      <div className={styles.title}>Product</div>
      <div className={styles.search}>
        <input placeholder="Search here..." />
      </div>
    </div>
  );
}


