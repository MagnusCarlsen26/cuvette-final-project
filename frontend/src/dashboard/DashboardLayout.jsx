import React, { useState, useEffect } from 'react';
import styles from './Dashboard.module.css';
import Sidebar from './components/Sidebar';
import Topbar from './components/Topbar';
import BottomNav from './components/BottomNav';

export default function DashboardLayout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (sidebarOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [sidebarOpen]);

  return (
    <div className={styles.wrapper}>
      <Sidebar className={`${styles.sidebar} ${sidebarOpen ? styles.sidebarOpen : ''}`} onNavigate={() => setSidebarOpen(false)} />
      <div className={styles.main}>
        <Topbar onMenuClick={() => setSidebarOpen(true)} />
        <div className={`${styles.content} ${styles.contentPaddingBottom}`}>{children}</div>
        <BottomNav />
      </div>
      {sidebarOpen ? <div className={styles.backdrop} onClick={() => setSidebarOpen(false)} /> : null}
    </div>
  );
}