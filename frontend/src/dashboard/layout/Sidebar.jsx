import React from 'react';
import { NavLink } from 'react-router-dom';
import styles from './Sidebar.module.css';
import BadgeSvg from '../../assets/badge.svg';

const navItems = [
  { to: '/dashboard/home', label: 'Home' },
  { to: '/dashboard/product', label: 'Product' },
  { to: '/dashboard/invoice', label: 'Invoice' },
  { to: '/dashboard/statistics', label: 'Statistics' },
  { to: '/dashboard/setting', label: 'Setting' },
];

export default function Sidebar() {
  return (
    <div className={styles.sidebar}>
      <div className={styles.logo}>
        <img src={BadgeSvg} alt="" className={styles.badge} />
      </div>
      <nav className={styles.nav}>
        {navItems.map((n) => (
          <NavLink
            key={n.to}
            to={n.to}
            className={({ isActive }) =>
              isActive ? `${styles.link} ${styles.active}` : styles.link
            }
          >
            {n.label}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}


