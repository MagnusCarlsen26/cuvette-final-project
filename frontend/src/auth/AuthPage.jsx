import React, { useState } from 'react';
import styles from './AuthPage.module.css';
import BadgeSvg from '../assets/badge.svg';
import HeroSvg from '../assets/hero.svg';
import EyeIcon from '../components/EyeIcon';

function TextInput({ id, label, type = 'text', placeholder, value, onChange, autoComplete }) {
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

function PasswordInput({ id, label, placeholder, value, onChange }) {
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
          autoComplete="new-password"
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

function AuthForm({ mode, onToggleMode }) {
  const isSignup = mode === 'signup';
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const handleSubmit = (event) => {
    event.preventDefault();
    // TODO: wire to backend
    // eslint-disable-next-line no-alert
    alert(`${isSignup ? 'Sign up' : 'Sign in'} clicked`);
  };

  return (
    <div className={styles.formCard}>
      <h2 className={styles.title}>{isSignup ? 'Create an account' : 'Welcome back'}</h2>
      <p className={styles.subtitle}>{isSignup ? 'Start inventory management.' : 'Sign in to continue.'}</p>
      <form onSubmit={handleSubmit}>
        {isSignup && (
          <TextInput
            id="name"
            label="Name"
            placeholder="Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoComplete="name"
          />
        )}
        <TextInput
          id="email"
          label="Email"
          type="email"
          placeholder="Example@email.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="email"
        />
        <PasswordInput
          id="password"
          label={isSignup ? 'Create Password' : 'Password'}
          placeholder="at least 8 characters"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        {isSignup && (
          <PasswordInput
            id="confirmPassword"
            label="Confirm Password"
            placeholder="at least 8 characters"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
          />
        )}
        <button className={styles.primaryButton} type="submit">
          {isSignup ? 'Sign up' : 'Sign in'}
        </button>
      </form>
      <div className={styles.switchRow}>
        {isSignup ? 'Do you have an account?' : "Don't have an account?"}{' '}
        <button type="button" className={styles.linkButton} onClick={onToggleMode}>
          {isSignup ? 'Sign in' : 'Sign up'}
        </button>
      </div>
    </div>
  );
}

export default function AuthPage() {
  const [mode, setMode] = useState('signup'); // 'signup' | 'login'

  return (
    <div className={styles.wrapper}>
      <div className={styles.leftPanel}>
        <AuthForm
          mode={mode}
          onToggleMode={() => setMode(mode === 'signup' ? 'login' : 'signup')}
        />
      </div>
      <div className={styles.rightPanel}>
        <div className={styles.branding}>
          <h1 className={styles.welcomeHeading}>Welcome to</h1>
          <h1 className={styles.companyHeading}>Company Name</h1>
        </div>
        <div className={styles.illustrations}>
          <img src={BadgeSvg} alt="Analytics badge" className={styles.smallBadgeSvg} />
          <img src={HeroSvg} alt="Team working on charts" className={styles.heroSvg} />
        </div>
      </div>
    </div>
  );
}


