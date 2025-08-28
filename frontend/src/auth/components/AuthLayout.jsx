import React from 'react';
import styles from '../AuthPage.module.css';
import BadgeSvg from '../../assets/badge.svg';

export default function AuthLayout({ title, subtitle, children, footer, heroSrc }) {
  return (
    <div className={styles.wrapper}>
      <div className={styles.leftPanel}>
        <div className={styles.formCard}>
          <h2 className={styles.title}>{title}</h2>
          {subtitle ? <p className={styles.subtitle}>{subtitle}</p> : null}
          {children}
          {footer ? <div className={styles.switchRow}>{footer}</div> : null}
        </div>
      </div>
      <div className={styles.rightPanel}>
        <div className={styles.brandingContainer}>
          <div className={styles.branding}>
            <h1 className={styles.welcomeHeading}>Welcome to</h1>
            <h1 className={styles.companyHeading}>Company Name</h1>
          </div>
          <img src={BadgeSvg} alt="Analytics badge" className={styles.smallBadgeSvg} />          
        </div>
        <div className={styles.illustrations}>
          <img src={heroSrc} alt="Page illustration" className={styles.heroSvg} />
        </div>
      </div>
    </div>
  );
}


