import React, { useEffect, useState } from 'react';
import DashboardLayout from '../DashboardLayout';
import styles from '../Dashboard.module.css';
import TopProducts from '../components/TopProducts';
import SalesPurchaseChart from '../components/SalesPurchaseChart';
import { apiGetKpis } from '../../api/client';
import productSmall from '../../assets/dashboard/product.svg';
import trendSmall from '../../assets/dashboard/statistics.svg';

export default function Statistics() {
  const [kpis, setKpis] = useState({ revenue: 0, sold: 0, inStock: 0 });
  useEffect(() => {
    (async () => {
      try {
        const data = await apiGetKpis({ period: 'monthly' });
        setKpis({ revenue: data.revenue || 0, sold: data.sold || 0, inStock: data.inStock || 0 });
      } catch (_e) {}
    })();
  }, []);
  return (
    <DashboardLayout>
      <div className={styles.grid}>
        <div style={{ gridColumn: '1 / -1' }} className={styles.statsCardsGrid}>
          <div className={styles.card} style={{ background: '#d8bf54', color: '#111827' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontWeight: 500 }}>Total Revenue</div>
              <div style={{ fontSize: 12 }}>₹</div>
            </div>
            <div style={{ fontSize: 28, fontWeight: 800, marginTop: 8 }}>₹{Number(kpis.revenue).toLocaleString('en-IN')}</div>
            <div style={{ fontSize: 12, marginTop: 6 }}>+20.1% from last month</div>
          </div>

          <div className={styles.card} style={{ background: '#18e7c9', color: '#111827' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontWeight: 500 }}>Products Sold</div>
              <img src={productSmall} alt="" width={16} height={16} style={{ opacity: 0.6 }} />
            </div>
            <div style={{ fontSize: 28, fontWeight: 800, marginTop: 8 }}>{Number(kpis.sold).toLocaleString('en-IN')}</div>
            <div style={{ fontSize: 12, marginTop: 6 }}>+180.1% from last month</div>
          </div>

          <div className={styles.card} style={{ background: '#d695ec', color: '#111827' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontWeight: 500 }}>Products In Stock</div>
              <img src={trendSmall} alt="" width={16} height={16} style={{ opacity: 0.6 }} />
            </div>
            <div style={{ fontSize: 28, fontWeight: 800, marginTop: 8 }}>{Number(kpis.inStock).toLocaleString('en-IN')}</div>
            <div style={{ fontSize: 12, marginTop: 6 }}>+19% from last month</div>
          </div>
        </div>

        <div style={{ display: 'grid', gap: 16 }}>
          <SalesPurchaseChart />
        </div>
        <div className={styles.rightCol}>
          <TopProducts />
        </div>
      </div>
    </DashboardLayout>
  );
}


