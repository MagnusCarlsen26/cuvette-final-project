import React, { useState } from 'react';
import styles from '../AuthPage.module.css';
import EyeIcon from '../../components/EyeIcon';

export function TextInput({ id, label, type = 'text', placeholder, value, onChange, autoComplete }) {
  return (
    <div className={styles.field}>
      <label htmlFor={id} className={styles.label}>{label}</label>
      <input
        id={id}
        className={styles.input}
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        autoComplete={autoComplete}
      />
    </div>
  );
}

export function PasswordInput({ id, label, placeholder, value, onChange, autoComplete = 'new-password' }) {
  const [isVisible, setIsVisible] = useState(false);
  const inputType = isVisible ? 'text' : 'password';
  return (
    <div className={styles.field}>
      <label htmlFor={id} className={styles.label}>{label}</label>
      <div className={styles.passwordWrapper}>
        <input
          id={id}
          className={styles.input}
          type={inputType}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          autoComplete={autoComplete}
        />
        <button
          type="button"
          className={styles.eyeButton}
          aria-label={isVisible ? 'Hide password' : 'Show password'}
          onClick={() => setIsVisible(!isVisible)}
        >
          <EyeIcon />
        </button>
      </div>
    </div>
  );
}


