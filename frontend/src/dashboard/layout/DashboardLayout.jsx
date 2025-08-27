import React from 'react';
import styles from './DashboardLayout.module.css';
import Sidebar from './Sidebar';
import Topbar from './Topbar';

export default function DashboardLayout({ children }) {
  return (
    <div className={styles.container}>
      <aside className={styles.sidebar}>
        <Sidebar />
      </aside>
      <main className={styles.main}>
        <Topbar />
        <div className={styles.content}>{children}</div>
      </main>
    </div>
  );
}


