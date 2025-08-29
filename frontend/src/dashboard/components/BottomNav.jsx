import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import styles from '../Dashboard.module.css';
import homeIcon from '../../assets/dashboard/home.svg';
import productIcon from '../../assets/dashboard/product.svg';
import invoiceIcon from '../../assets/dashboard/invoice.svg';
import statisticsIcon from '../../assets/dashboard/statistics.svg';

const items = [
  { to: '/dashboard/home', label: 'Home', icon: () => (<img src={homeIcon} alt="" width={20} height={20} />) },
  { to: '/dashboard/product', label: 'Product', icon: () => (<img src={productIcon} alt="" width={20} height={20} />) },
  { to: '/dashboard/invoice', label: 'Invoice', icon: () => (<img src={invoiceIcon} alt="" width={20} height={20} />) },
  { to: '/dashboard/statistics', label: 'Statistics', icon: () => (<img src={statisticsIcon} alt="" width={20} height={20} />) }
];

export default function BottomNav() {
  const location = useLocation();
  const pathname = location?.pathname || '';
  return (
    <nav className={styles.bottomNav}>
      {items.map((i) => {
        const isActive = pathname === i.to || pathname.startsWith(i.to + '/');
        return (
          <NavLink
            key={i.to}
            to={i.to}
            className={`${styles.bottomNavItem} ${isActive ? styles.bottomNavItemActive : ''}`}
            aria-label={i.label}
            aria-current={isActive ? 'page' : undefined}
          >
            <span className={styles.bottomNavIcon} style={{ display: 'grid', placeItems: 'center' }}>{i.icon()}</span>
          </NavLink>
        );
      })}
    </nav>
  );
}


