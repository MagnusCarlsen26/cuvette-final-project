import React, { useEffect, useState } from 'react';
import styles from '../Dashboard.module.css';
import { apiGetTopProducts } from '../../api/client';

function Rating({ value }) {
  const full = Math.floor(value);
  const hasHalf = value - full >= 0.5 ? 1 : 0;
  const empty = 5 - full - hasHalf;
  return (
    <div className={styles.ratingRow}>
      {Array.from({ length: full }).map((_, index) => (
        <div key={`f${index}`} className={styles.ratingPill} />
      ))}
      {hasHalf ? <div className={styles.ratingPillHalf} /> : null}
      {Array.from({ length: empty }).map((_, index) => (
        <div key={`e${index}`} className={styles.ratingPillEmpty} />
      ))}
    </div>
  );
}

export default function TopProducts({ items }) {
  const [list, setList] = useState(items || []);
  const [loading, setLoading] = useState(!items || items.length === 0);

  useEffect(() => {
    if (items && items.length) return;
    let mounted = true;
    (async () => {
      try {
        const res = await apiGetTopProducts();
        const max = Math.max(1, ...res.map((r) => r.sales || 0));
        const mapped = res.map((r) => ({ name: r.name, rating: Math.max(2.5, Math.min(5, (r.sales / max) * 5)) }));
        if (mounted) setList(mapped);
      } catch (_err) {}
      finally { if (mounted) setLoading(false); }
    })();
    return () => { mounted = false; };
  }, [items]);

  return (
    <div className={styles.card}>
      <div className={styles.metricTitle}>Top Products</div>
      {loading ? (
        <div style={{ color: 'var(--color-text-muted)' }}>Loading...</div>
      ) : list.length === 0 ? (
        <div style={{ color: 'var(--color-text-muted)' }}>No products yet</div>
      ) : (
        list.map((item) => (
          <div key={item.name} className={styles.listItem}>
            <div>{item.name}</div>
            <Rating value={item.rating} />
          </div>
        ))
      )}
    </div>
  );
}


