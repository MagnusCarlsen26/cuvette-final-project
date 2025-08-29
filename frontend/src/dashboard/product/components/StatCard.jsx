import React from 'react';
import styles from './StatCard.module.css';
import { DummyCategoriesIcon, DummyProductsIcon, DummyTopIcon, DummyLowIcon } from '../icons/DummyIcons';

const iconMap = {
  categories: DummyCategoriesIcon,
  products: DummyProductsIcon,
  top: DummyTopIcon,
  low: DummyLowIcon,
};

export default function StatCard({ label, value, sublabel, currency, icon }) {
  const Icon = iconMap[icon] || DummyProductsIcon;
  return (
    <div className={styles.card}>
      <div className={styles.row}>
        <div className={styles.icon}><Icon /></div>
        <div className={styles.meta}>
          <div className={styles.label}>{label}</div>
          <div className={styles.value}>{currency ? `${currency}${value}` : value}</div>
        </div>
      </div>
      <div className={styles.sublabel}>{sublabel}</div>
    </div>
  );
}


