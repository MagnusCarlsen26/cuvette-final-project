import React, { useEffect, useState } from 'react';
import DashboardLayout from '../DashboardLayout';
import ProductsTable from './components/ProductsTable';
import MetricBar from '../components/MetricBar';
import styles from './ProductPage.module.css';
import dashboardStyles from '../Dashboard.module.css';
import { apiGetProducts, apiOrderProductQuantity, apiUploadProductsCsv, apiGetProductMetrics } from '../../api/client';

export default function ProductPage() {
  const [showAddModal, setShowAddModal] = useState(false);
  const [showCsvModal, setShowCsvModal] = useState(false);
  const [page, setPage] = useState(1);
  const [rows, setRows] = useState([]);
  const [totalPages, setTotalPages] = useState(1);
  const [orderRow, setOrderRow] = useState(null);
  const [orderQty, setOrderQty] = useState(1);
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState({ total: 0, inStock: 0, lowStock: 0, outOfStock: 0, expired: 0, categories: 0, topSellingCount: 0, topSellingRevenue: 0 });
  const [metricsLoading, setMetricsLoading] = useState(true);
  const pageSize = 10;

  async function loadProducts(p = page) {
    setLoading(true);
    try {
      const res = await apiGetProducts({ page: p, limit: pageSize });
      const mapped = (res.items || []).map((it) => ({
        _id: it._id || it.id,
        name: it.name,
        price: it.price,
        quantity: it.quantity,
        threshold: it.threshold,
        expiry: it.expiryDate ? new Date(it.expiryDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: '2-digit' }) : '-',
        status: it.status
      }));
      setRows(mapped);
      setTotalPages(res.totalPages || 1);
    } catch (err) {
      console.error('Failed to load products', err);
      setRows([]);
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  }

  async function loadMetrics() {
    setMetricsLoading(true);
    try {
      const m = await apiGetProductMetrics();
      setMetrics({
        total: Number(m.total || 0),
        inStock: Number(m.inStock || 0),
        lowStock: Number(m.lowStock || 0),
        outOfStock: Number(m.outOfStock || 0),
        expired: Number(m.expired || 0),
        categories: Number(m.categories || 0),
        topSellingCount: Number(m.topSellingCount || 0),
        topSellingRevenue: Number(m.topSellingRevenue || 0)
      });
    } catch (_err) {
      setMetrics({ total: 0, inStock: 0, lowStock: 0, outOfStock: 0, expired: 0, categories: 0, topSellingCount: 0, topSellingRevenue: 0 });
    } finally {
      setMetricsLoading(false);
    }
  }

  useEffect(() => { loadProducts(page); }, [page]);
  useEffect(() => { loadMetrics(); }, []);

  return (
    <DashboardLayout>
      <div className={styles.wrapper}>
        <section className={styles.inventory}>
          <div className={dashboardStyles.card} style={{ paddingBottom: 8, paddingTop: 24 }}>
            <MetricBar
              title={"Overall Inventory"}
              items={[
                { id: 'categories', label: 'Categories', pairs: [
                  { value: metricsLoading ? 'Loading...' : String(metrics.categories), sub: 'Last 7 days' }
                ] },
                { id: 'total', label: 'Total Products', pairs: [
                  { value: metricsLoading ? 'Loading...' : String(metrics.total), sub: 'Total' },
                  { value: metricsLoading ? 'Loading...' : String(metrics.inStock), sub: 'In stock' }
                ] },
                { id: 'top', label: 'Top Selling', pairs: [
                  { value: metricsLoading ? 'Loading...' : String(metrics.topSellingCount || 0), sub: 'Last 7 days' },
                  { value: metricsLoading ? 'Loading...' : `₹${Number(metrics.topSellingRevenue || 0).toLocaleString('en-IN')}`, sub: 'Cost' }
                ] },
                { id: 'low', label: 'Low Stocks', pairs: [
                  { value: metricsLoading ? 'Loading...' : String(metrics.lowStock), sub: 'Ordered' },
                  { value: metricsLoading ? 'Loading...' : String(metrics.outOfStock), sub: 'Out of stock' }
                ] }
              ]}
              classes={{
                title: styles.metricTitle,
                row: styles.metricsRow,
                cell: styles.metricCell,
                label: styles.metricLabel,
                pair: styles.metricPair,
                group: styles.metricGroup,
                value: styles.metricValue,
                subLabel: styles.metricSubLabel
              }}
            />
          </div>
        </section>

        <section className={styles.products}>
          <div className={dashboardStyles.card} style={{paddingBottom: 16}}>
            <div className={styles.headerRow} style={{ alignItems: 'center' }}>
              <div className={dashboardStyles.metricTitle} style={{paddingTop: 12, paddingBottom: 12}}>Products</div>
              <button className={`${styles.addBtn} ${styles.addBtnDesktop}`} onClick={() => setShowAddModal(true)}>Add Product</button>
            </div>
            <ProductsTable
              rows={rows}
              page={page}
              totalPages={totalPages}
              loading={loading}
              onPrev={() => setPage((p) => Math.max(1, p - 1))}
              onNext={() => setPage((p) => Math.min(totalPages, p + 1))}
              onRowClick={(r) => { setOrderRow(r); setOrderQty(1); }}
              wrap={false}
            />
          </div>
        </section>

        {/* Floating action button - mobile only */}
        <div className={styles.fab}>
          <button className={styles.addBtn} onClick={() => setShowAddModal(true)}>Add Product</button>
        </div>

        {showAddModal ? (
          <div className={styles.backdrop} onClick={() => setShowAddModal(false)}>
            <div className={styles.modal} style={{ padding: 100 }} onClick={(e) => e.stopPropagation()}>
              <div style={{ display: 'grid', gap: 12 }}>
                <button className={styles.addBtn} onClick={() => { setShowAddModal(false); window.location.href = '/dashboard/product/add'; }}>Individual Product</button>
                <button className={styles.addBtn} onClick={() => { setShowAddModal(false); setShowCsvModal(true); }}>Multiple Products (CSV)</button>
              </div>
            </div>
          </div>
        ) : null}

        {showCsvModal ? (
          <div className={styles.backdrop} onClick={() => setShowCsvModal(false)}>
            <div className={styles.modal} onClick={(e) => e.stopPropagation()} style={{ width: 620, background: '#fff' }}>
              <h3 className={styles.uploadTitle}>CSV Upload</h3>
              <div className={styles.uploadSub}>Add your documents here</div>
              <div className={styles.uploadDrop} style={{ background: '#fff', border: '1px dashed #000' }}>
                <div className={styles.uploadIcon} style={{ background: '#000' }}/>
                <div className={styles.uploadSub}>Drag your file(s) to start uploading</div>
                <div className={styles.orRow}><span>OR</span></div>
                <label className={styles.browseBtn}>
                  Browse files
                  <input type="file" accept=".csv,text/csv" style={{ display: 'none' }} onChange={async (e) => {
                    const f = e.target.files && e.target.files[0];
                    if (!f) return;
                    try {
                      const text = await f.text();
                      await apiUploadProductsCsv(text);
                      setShowCsvModal(false);
                      setPage(1);
                      loadProducts(1);
                      loadMetrics();
                    } catch (err) {
                      console.error('CSV upload failed', err);
                    }
                  }} />
                </label>
              </div>

              {/* Selected file details will appear here after choosing a file (if implemented) */}

              <div className={styles.footerActions}>
                <button className={styles.secondaryBtn} onClick={() => setShowCsvModal(false)}>Cancel</button>
                <button className={styles.uploadBtn} onClick={() => setShowCsvModal(false)}>Upload</button>
              </div>
            </div>
          </div>
        ) : null}

        {orderRow ? (
          <div className={styles.backdrop} onClick={() => setOrderRow(null)}>
            <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
              <h3>Order Quantity</h3>
              <div style={{ margin: '8px 0 12px 0' }}>{orderRow.name}</div>
              <input type="number" min={1} value={orderQty} onChange={(e) => setOrderQty(Number(e.target.value))} style={{ height: 36, background: 'var(--color-bg)', border: '1px solid var(--color-border)', color: 'var(--color-text)', borderRadius: 8, padding: '0 12px' }} />
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 12 }}>
                <button className={styles.addBtn} onClick={() => setOrderRow(null)} style={{ background: 'var(--color-sidebar)', border: '1px solid var(--color-border)' }}>Cancel</button>
                <button className={styles.addBtn} onClick={async () => { await apiOrderProductQuantity(orderRow._id || orderRow.id, orderQty); setOrderRow(null); loadProducts(page); loadMetrics(); }}>Order</button>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </DashboardLayout>
  );
}


