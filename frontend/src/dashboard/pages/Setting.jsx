import React, { useEffect, useState } from 'react';
import DashboardLayout from '../DashboardLayout';
import layoutStyles from '../Dashboard.module.css';
import styles from './Setting.module.css';
import metricsStyles from './Invoice.module.css';
import deleteInvoiceIcon from '../../assets/icons/deleteInvoice.svg';
import { useAuth } from '../../auth/AuthContext';
import { apiGetMe, apiUpdateProfile } from '../../api/client';

export default function Setting() {
  const { logout } = useAuth();
  const [activeTab, setActiveTab] = useState('profile');
  const [profileForm, setProfileForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    currentPassword: '',
    password: '',
    confirmPassword: '',
  });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const accounts = ['Acount01_@gmail.com', 'Acount02_@gmail.com'];
  const [selectedAccount, setSelectedAccount] = useState(null);

  const handleInputChange = (event) => {
    const { name, value } = event.target;
    setProfileForm((prev) => ({ ...prev, [name]: value }));
  };

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const me = await apiGetMe();
        if (!mounted) return;
        const firstName = (me && typeof me.firstName === 'string') ? me.firstName : (() => {
          const parts = String(me?.name || '').trim().split(' ').filter(Boolean);
          return parts.slice(0, -1).join(' ') || (parts[0] || '');
        })();
        const lastName = (me && typeof me.lastName === 'string') ? me.lastName : (() => {
          const parts = String(me?.name || '').trim().split(' ').filter(Boolean);
          return parts.length > 1 ? parts.slice(-1)[0] : '';
        })();
        setProfileForm((prev) => ({
          ...prev,
          firstName,
          lastName,
          email: me?.email || ''
        }));
      } catch (_) {
        // ignore load error in demo
      }
    })();
    return () => { mounted = false; };
  }, []);

  const handleProfileSubmit = async (event) => {
    event.preventDefault();
    setMessage('');
    if ((profileForm.password || profileForm.confirmPassword) && profileForm.password !== profileForm.confirmPassword) {
      setMessage('Passwords do not match');
      return;
    }
    const name = `${profileForm.firstName} ${profileForm.lastName}`.trim();
    const body = { name, firstName: profileForm.firstName, lastName: profileForm.lastName, email: profileForm.email };
    if (profileForm.password) {
      body.newPassword = profileForm.password;
      body.currentPassword = profileForm.currentPassword || '';
    }
    try {
      setSaving(true);
      await apiUpdateProfile(body);
      setMessage('Profile updated');
      setProfileForm((prev) => ({ ...prev, currentPassword: '', password: '', confirmPassword: '' }));
    } catch (err) {
      setMessage(err.message || 'Failed to update');
    } finally {
      setSaving(false);
    }
  };

  const handleAccountClick = (email) => {
    setSelectedAccount((prev) => (prev === email ? null : email));
  };

  return (
    <DashboardLayout>
      <div className={layoutStyles.card}>
        <div className={styles.tabsRow}>
          <button className={`${styles.tabBtn} ${activeTab === 'profile' ? styles.tabActive : ''}`} onClick={() => setActiveTab('profile')}>Edit Profile</button>
          <button className={`${styles.tabBtn} ${activeTab === 'account' ? styles.tabActive : ''}`} onClick={() => setActiveTab('account')}>Account management</button>
        </div>

        {activeTab === 'profile' ? (
          <form className={styles.formGrid} onSubmit={handleProfileSubmit} noValidate>
            <div className={styles.formGroup}>
              <label className={styles.label} htmlFor="firstName">First name</label>
              <input
                id="firstName"
                name="firstName"
                type="text"
                className={styles.input}
                value={profileForm.firstName}
                onChange={handleInputChange}
                autoComplete="given-name"
                required
                placeholder="First name"
              />
            </div>
            <div className={styles.formGroup}>
              <label className={styles.label} htmlFor="lastName">Last name</label>
              <input
                id="lastName"
                name="lastName"
                type="text"
                className={styles.input}
                value={profileForm.lastName}
                onChange={handleInputChange}
                autoComplete="family-name"
                required
                placeholder="Last name"
              />
            </div>
            <div className={styles.formGroup}>
              <label className={styles.label} htmlFor="email">Email</label>
              <input
                id="email"
                name="email"
                type="email"
                className={styles.input}
                value={profileForm.email}
                onChange={handleInputChange}
                autoComplete="email"
                required
                placeholder="you@example.com"
              />
            </div>
            <div className={styles.formGroup}>
              <label className={styles.label} htmlFor="currentPassword">Current Password</label>
              <input
                id="currentPassword"
                name="currentPassword"
                type="password"
                className={styles.input}
                value={profileForm.currentPassword}
                onChange={handleInputChange}
                autoComplete="off"
                placeholder="Current password (required to change password)"
              />
            </div>
            <div className={styles.formGroup}>
              <label className={styles.label} htmlFor="password">Password</label>
              <input
                id="password"
                name="password"
                type="password"
                className={styles.input}
                value={profileForm.password}
                onChange={handleInputChange}
                autoComplete="new-password"
                required
                placeholder="New password"
              />
            </div>
            <div className={styles.formGroup}>
              <label className={styles.label} htmlFor="confirmPassword">Confirm Password</label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                className={styles.input}
                value={profileForm.confirmPassword}
                onChange={handleInputChange}
                autoComplete="new-password"
                required
                placeholder="Confirm new password"
              />
            </div>
            {message ? <div style={{ color: message === 'Profile updated' ? '#16a34a' : '#dc2626', marginTop: -4 }}>{message}</div> : null}
            <div className={styles.actionsRow}>
              <button type="submit" className={styles.primaryBtn} disabled={saving}>{saving ? 'Saving…' : 'Save'}</button>
            </div>
          </form>
        ) : (
          <div className={styles.accountPane}>
            <div className={styles.section}>
              <div className={styles.sectionTitle}>Identity verification</div>
              <div className={styles.verifiedRow}>Verified</div>
            </div>

            <div className={styles.section}>
              <div className={styles.sectionTitle}>Add Accounts</div>
              {accounts.map((email) => (
                <div
                  key={email}
                  className={styles.accountRow}
                  onClick={() => handleAccountClick(email)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') handleAccountClick(email);
                  }}
                  aria-selected={selectedAccount === email}
                >
                  <input
                    type="radio"
                    name="accountSelect"
                    checked={selectedAccount === email}
                    onChange={() => setSelectedAccount(email)}
                    onClick={(e) => e.stopPropagation()}
                    aria-label={`Select ${email}`}
                  />
                  <div className={styles.accountEmail}>{email}</div>
                  <div className={styles.inlineMenu}>
                    {selectedAccount === email && (
                      <div
                        className={metricsStyles.menuItem}
                        role="button"
                        tabIndex={0}
                        onClick={(e) => {
                          e.stopPropagation();
                          // TODO: Hook into delete action for selected account
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            e.stopPropagation();
                            // TODO: Hook into delete action for selected account
                          }
                        }}
                        title="Delete"
                        style={{ display: 'inline-flex' }}
                      >
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                          <img src={deleteInvoiceIcon} alt="Delete" width="16" height="16" />
                          Delete
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className={styles.footerActions}>
              <button className={styles.logoutBtn} onClick={logout}>Log Out</button>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}


