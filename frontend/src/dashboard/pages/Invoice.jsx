import React, { useEffect, useRef, useState } from 'react';
import DashboardLayout from '../DashboardLayout';
import styles from '../Dashboard.module.css';
import metricsStyles from './Invoice.module.css';
import MetricBar from '../components/MetricBar';
import productMetricStyles from '../product/ProductPage.module.css';
import InvoicesTable from '../components/InvoicesTable';
import { apiGetInvoices, apiGetInvoice, apiMarkInvoicePaid, apiDeleteInvoice, apiGetInvoiceMetrics } from '../../api/client';

const initialMetrics = { total: 0, recent: 0, processed: 0, paidAmount: 0, unpaidAmount: 0, pending: 0 };

// Data will be fetched from backend

export default function Invoice() {
  const [viewing, setViewing] = useState(null);
  const [viewData, setViewData] = useState(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const pageSize = 10;
  const [rows, setRows] = useState([]);
  const [totalPages, setTotalPages] = useState(1);
  const [metrics, setMetrics] = useState(initialMetrics);
  const [metricsLoading, setMetricsLoading] = useState(true);
  const printRef = useRef(null);

  async function loadInvoices(p = page) {
    try {
      setLoading(true);
      setError('');
      const res = await apiGetInvoices({ page: p, limit: pageSize });
      const mapped = (res.items || []).map((i) => ({
        _id: (i && i._id)
          ? (typeof i._id === 'string' ? i._id : (i._id.toString ? i._id.toString() : String(i._id)))
          : i.id,
        id: i.invoiceId || i.id,
        ref: i.referenceNumber || '-',
        amount: `₹ ${Number(i.total || 0).toLocaleString('en-IN')}`,
        status: (i.status || 'unpaid').charAt(0).toUpperCase() + (i.status || 'unpaid').slice(1),
        due: i.dueDate ? new Date(i.dueDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: '2-digit' }) : '-'
      }));
      setRows(mapped);
      setTotalPages(res.totalPages || 1);
    } catch (err) {
      setError(err.message || 'Failed to load invoices');
      // Fallback dummy rows when API fails
      const dummy = [
        { id: 'INV-1001', ref: 'INV-052', amount: '₹ 2,450', status: 'Paid', due: '02-Apr-25' },
        { id: 'INV-1002', ref: 'INV-047', amount: '₹ 1,850', status: 'Unpaid', due: '05-Apr-25' },
        { id: 'INV-1003', ref: 'INV-057', amount: '₹ 3,620', status: 'Paid', due: '06-Apr-25' },
        { id: 'INV-1004', ref: 'INV-153', amount: '₹ 950', status: 'Unpaid', due: '11-Apr-25' },
        { id: 'INV-1005', ref: 'INV-507', amount: '₹ 4,100', status: 'Paid', due: '09-Apr-25' },
        { id: 'INV-1006', ref: 'INV-021', amount: '₹ 2,990', status: 'Unpaid', due: '10-Apr-25' }
      ];
      setRows(dummy);
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadInvoices(page);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  useEffect(() => {
    (async () => {
      try {
        setMetricsLoading(true);
        const m = await apiGetInvoiceMetrics();
        setMetrics({
          total: Number(m.total || 0),
          recent: Number(m.recent || 0),
          processed: Number(m.processed || 0),
          paidAmount: Number(m.paidAmount || 0),
          unpaidAmount: Number(m.unpaidAmount || 0),
          pending: Number(m.pending || 0)
        });
      } catch (_) {
        setMetrics(initialMetrics);
      } finally {
        setMetricsLoading(false);
      }
    })();
  }, []);

  const handleDelete = (id) => {
    // Placeholder: remove from local list; in real app, call API then refresh
    // For demo, just close confirm
    setConfirmDeleteId(null);
  };

  return (
    <DashboardLayout>
      <div className={productMetricStyles.wrapper}>
        <section className={productMetricStyles.inventory}>
          <div className={styles.card}>
            <MetricBar
              title={"Overall Invoice"}
              items={[
                { id: 'recent', label: 'Recent Transactions', pairs: [
                  { value: metricsLoading ? 'Loading...' : String(metrics.recent), sub: 'Last 7 days' }
                ] },
                { id: 'total', label: 'Total Invoices', pairs: [
                  { value: metricsLoading ? 'Loading...' : String(metrics.total), sub: 'Total' },
                  { value: metricsLoading ? 'Loading...' : String(metrics.processed), sub: 'Processed' }
                ] },
                { id: 'paidAmount', label: 'Paid Amount', pairs: [
                  { value: metricsLoading ? 'Loading...' : `₹${metrics.paidAmount.toLocaleString('en-IN')}`, sub: 'Last 7 days' },
                ] },
                { id: 'unpaidAmount', label: 'Unpaid Amount', pairs: [
                  { value: metricsLoading ? 'Loading...' : `₹${metrics.unpaidAmount.toLocaleString('en-IN')}`, sub: 'Outstanding' },
                  { value: metricsLoading ? 'Loading...' : String(metrics.pending), sub: 'Pending Payment' }
                ] }
              ]}
              classes={{
                title: productMetricStyles.metricTitle,
                row: productMetricStyles.metricsRow,
                cell: productMetricStyles.metricCell,
                label: productMetricStyles.metricLabel,
                pair: productMetricStyles.metricPair,
                group: productMetricStyles.metricGroup,
                value: productMetricStyles.metricValue,
                subLabel: productMetricStyles.metricSubLabel
              }}
            />
          </div>
        </section>

        <section className={productMetricStyles.products}>
          <div className={styles.card} style={{paddingBottom: 16}}>
            <div className={productMetricStyles.headerRow} style={{ alignItems: 'center' }}>
              <div className={styles.metricTitle} style={{paddingTop: 12, paddingBottom: 12}}>Invoices</div>
            </div>

            <InvoicesTable
              rows={rows}
              page={page}
              totalPages={totalPages}
              loading={loading}
              statusText={loading ? 'Loading…' : error ? error : `Page ${page} of ${totalPages}`}
              onPrev={() => setPage((p) => Math.max(1, p - 1))}
              onNext={() => setPage((p) => Math.min(totalPages, p + 1))}
              onView={async (r) => { setViewing(r); setViewData(null); try { const d = await apiGetInvoice(r._id || r.id); setViewData(d); } catch (_) {} }}
              onMarkPaid={async (r) => { try { await apiMarkInvoicePaid(r._id || r.id); await loadInvoices(page); } catch (_) {} }}
              onDelete={(r) => setConfirmDeleteId(r._id || r.id)}
              wrap={false}
            />
          </div>
        </section>
      </div>

      {viewing ? (() => {
        const sampleItems = [
          { name: 'Basmati Rice (5kg)', qty: 1, total: 1090 },
          { name: 'Aashirvaad Atta (10kg)', qty: 1, total: 545 },
          { name: 'Fortune Sunflower Oil (5L)', qty: 1, total: 1090 },
        ];
        const items = (viewData?.items && viewData.items.length)
          ? viewData.items.map((it) => {
              const qty = Number(it.qty || it.quantity || 1);
              const unit = Number(it.unitPrice || it.price || it.total || 0);
              const line = Number(it.total || (qty * unit));
              return {
                name: it.name || it.productName || 'Item',
                qty: qty,
                total: line,
              };
            })
          : sampleItems;
        const subtotal = (typeof viewData?.subtotal === 'number')
          ? viewData.subtotal
          : items.reduce((s, it) => s + (Number(it.total) || 0), 0);
        const tax = (typeof viewData?.tax === 'number') ? viewData.tax : Math.round(subtotal * 0.10);
        const total = (typeof viewData?.total === 'number') ? viewData.total : subtotal + tax;
        const invoiceDate = viewData?.createdAt ? new Date(viewData.createdAt) : null;
        const dueDate = viewData?.dueDate ? new Date(viewData.dueDate) : null;
        return (
          <div className={metricsStyles.backdrop} onClick={() => setViewing(null)}>
            <div className={metricsStyles.modal} onClick={(e) => e.stopPropagation()}>
              <div className={metricsStyles.modalHeader}>
                <h2 className={metricsStyles.invoiceHeader}>INVOICE</h2>
                <div className={metricsStyles.headerRight}>
                  <div>Business address, City, State, IN - 000 000</div>
                  <div className={metricsStyles.businessSub}>TAX ID 0XXXXXX1234XXX</div>
                </div>
                <button className={metricsStyles.closeBtn} onClick={() => setViewing(null)} aria-label="Close">×</button>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginBottom: 8 }}>
                <button
                  className={metricsStyles.btn}
                  onClick={() => {
                    // Print only the invoice content
                    const node = printRef.current;
                    if (!node) return window.print();
                    const printWindow = window.open('', 'PRINT', 'height=650,width=900,top=100,left=100');
                    if (printWindow) {
                      printWindow.document.write(`<!doctype html><html><head><title>Invoice ${viewData?.invoiceId || viewing.id}</title>`);
                      // Inline basic styles for print fidelity
                      printWindow.document.write('<style>body{font-family:Inter,Arial,sans-serif;color:#0f172a} table{width:100%;border-collapse:collapse} th,td{padding:12px 16px;border-top:1px solid #e5e7eb} thead th{background:#f8f8f8;border-bottom:1px solid #e5e7eb;text-align:left} .totalsTable td{padding:12px 16px;border-top:1px solid #e5e7eb} .totalDueRow{background:#f0f7ff;color:#0b66ff;font-weight:800} .tdRight{text-align:right} .tdCenter{text-align:center} .tdLeft{text-align:left}</style>');
                      printWindow.document.write('</head><body>');
                      printWindow.document.write(node.innerHTML);
                      printWindow.document.write('</body></html>');
                      printWindow.document.close();
                      // Ensure content is ready before printing
                      const doPrint = () => {
                        try {
                          printWindow.focus();
                          printWindow.print();
                        } catch (_e) {
                          // fallback: try printing the current window
                          try { window.print(); } catch (_e2) {}
                        } finally {
                          try { printWindow.close(); } catch (_e3) {}
                        }
                      };
                      if (printWindow.document.readyState === 'complete') {
                        setTimeout(doPrint, 50);
                      } else {
                        printWindow.onload = () => setTimeout(doPrint, 50);
                      }
                    } else {
                      window.print();
                    }
                  }}
                >
                  Print / Save PDF
                </button>
              </div>

              <div ref={printRef} className={metricsStyles.contentGrid}>
                <div className={metricsStyles.metaCol}>
                  <div className={metricsStyles.billedBlock}>
                    <div className={metricsStyles.billColTitle}>Billed to</div>
                    <div className={metricsStyles.billedCompany}>Company Name</div>
                    <div className={metricsStyles.billedAddress}>Company address</div>
                    <div className={metricsStyles.billedAddress}>City, Country</div>
                  </div>
                  <div className={metricsStyles.kv}><strong>Invoice #</strong><div>{viewData?.invoiceId || viewing.id}</div></div>
                  <div className={metricsStyles.kv}><strong>Invoice date</strong><div>{invoiceDate ? invoiceDate.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '01-Apr-2025'}</div></div>
                  <div className={metricsStyles.kv}><strong>Reference</strong><div>{viewData?.referenceNumber || 'INV-057'}</div></div>
                  <div className={metricsStyles.kv}><strong>Due date</strong><div>{dueDate ? dueDate.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '15-Apr-2025'}</div></div>
                </div>
                <div className={metricsStyles.tableCol}>
                  <table className={metricsStyles.invoiceTable}>
                    <thead>
                      <tr>
                        <th className={metricsStyles.thLeft}>Products</th>
                        <th className={metricsStyles.thCenter}>Qty</th>
                        <th className={metricsStyles.thRight}>Price</th>
                      </tr>
                    </thead>
                    <tbody>
                      {items.map((it, i) => (
                        <tr key={i}>
                          <td className={metricsStyles.tdLeft}>{it.name}</td>
                          <td className={metricsStyles.tdCenter}>{it.qty}</td>
                          <td className={metricsStyles.tdRight}>₹{Number(it.total || 0).toLocaleString('en-IN')}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  <div className={metricsStyles.totals}>
                    <table className={metricsStyles.totalsTable}>
                      <tbody>
                        <tr>
                          <td>Subtotal</td>
                          <td className={metricsStyles.tdRight}>₹{Number(subtotal).toLocaleString('en-IN')}</td>
                        </tr>
                        <tr>
                          <td>Tax (10%)</td>
                          <td className={metricsStyles.tdRight}>₹{Number(tax).toLocaleString('en-IN')}</td>
                        </tr>
                        <tr className={metricsStyles.totalDueRow}>
                          <td>Total due</td>
                          <td className={metricsStyles.tdRight}>₹{Number(total).toLocaleString('en-IN')}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  <div className={metricsStyles.note}>Please pay within 15 days of receiving this invoice.</div>

                  <div className={metricsStyles.footerBar}>
                    <div>www.recehtol.inc</div>
                    <div>+91 00000 00000</div>
                    <div>hello@email.com</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      })() : null}

      {confirmDeleteId ? (
        <div className={metricsStyles.backdrop} onClick={() => setConfirmDeleteId(null)}>
          <div className={metricsStyles.confirmBox} onClick={(e) => e.stopPropagation()}>
            <div>this invoice will be deleted.</div>
            <div className={metricsStyles.confirmActions}>
              <button className={metricsStyles.btn} style={{ background: '#fff', color: '#AFAFAF', border: '1px solid #fff' }} onClick={() => setConfirmDeleteId(null)}>Cancel</button>
              <button
                className={`${metricsStyles.btn}`}
                onClick={async () => {
                  try { await apiDeleteInvoice(confirmDeleteId); await loadInvoices(page); } catch (_) {} finally { setConfirmDeleteId(null); }
                }}
              >
                Confirm 
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </DashboardLayout>
  );
}


