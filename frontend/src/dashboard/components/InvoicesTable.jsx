import React, { useState } from 'react';
import PaginationBar from './PaginationBar';
import tableStyles from '../product/components/ProductsTable.module.css';
import metricsStyles from '../pages/Invoice.module.css';
import viewInvoiceIcon from '../../assets/icons/viewInvoice.svg';
import deleteInvoiceIcon from '../../assets/icons/deleteInvoice.svg';

// Match Products table inline styles for consistent look-and-feel
const dataCellStyle = { color: '#374151' };
const tableLineStyle = { borderBottom: '1px solid rgba(0,0,0,0.2)', borderRight: '1px solid rgba(0,0,0,0.2)' };
const lastCellStyle = { ...tableLineStyle, borderRight: 0 };
const headerStyle = {
  background: '#B6B9CF',
  color: '#424457',
  fontSize: 14,
  fontWeight: 600,
  letterSpacing: '0.02em',
  textTransform: 'uppercase',
  borderBottom: '1px solid rgba(0,0,0,0.2)',
  borderRight: '1px solid rgba(0,0,0,0.2)'
};
const headerLastCellStyle = { ...headerStyle, borderRight: 0 };

export default function InvoicesTable({
  rows = [],
  page = 1,
  totalPages = 1,
  loading = false,
  statusText,
  onPrev,
  onNext,
  onView,
  onMarkPaid,
  onDelete,
  wrap = true,
}) {
  const [menuOpenId, setMenuOpenId] = useState(null);

  const TableContent = (
    <>
      <div className={tableStyles.tableContainer}>
        <table className={tableStyles.table}>
          <thead>
            <tr>
              <th style={headerStyle}>Invoice ID</th>
              <th style={headerStyle}>Reference Number</th>
              <th style={headerStyle}>Amount (₹)</th>
              <th style={headerStyle}>Status</th>
              <th style={headerStyle}>Due Date</th>
              <th style={headerLastCellStyle}></th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} style={{ textAlign: 'center', padding: 20, color: 'var(--color-text-muted)', ...lastCellStyle }}>Loading...</td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ textAlign: 'center', padding: 20, color: 'var(--color-text-muted)', ...lastCellStyle }}>No invoices</td>
              </tr>
            ) : (
              rows.map((r) => (
                <tr key={r.id}>
                  <td style={{ ...dataCellStyle, ...tableLineStyle }}>{r.id}</td>
                  <td style={{ ...dataCellStyle, ...tableLineStyle }}>{r.ref}</td>
                  <td style={{ ...dataCellStyle, ...tableLineStyle }}>{r.amount}</td>
                  <td style={{ ...dataCellStyle, ...tableLineStyle }}>
                    <span
                      style={{
                        background: r.status === 'Paid' ? 'var(--color-success-bg)' : 'var(--color-danger-bg)',
                        color: r.status === 'Paid' ? 'var(--color-success)' : 'var(--color-danger)',
                        padding: '2px 8px',
                        borderRadius: 999,
                        fontSize: 12,
                        textTransform: 'lowercase'
                      }}
                    >
                      {r.status}
                    </span>
                  </td>
                  <td style={{ ...dataCellStyle, ...tableLineStyle }}>{r.due}</td>
                  <td style={{ ...lastCellStyle, position: 'relative' }}>
                    <button
                      className={metricsStyles.menuButton}
                      title="Actions"
                      onClick={() => setMenuOpenId(menuOpenId === r.id ? null : r.id)}
                      style={{ color: '#48505E' }}
                    >
                      ⋮
                    </button>
                    {menuOpenId === r.id ? (
                      <div className={metricsStyles.menu}>
                        <div
                          className={metricsStyles.menuItem}
                          onClick={() => { setMenuOpenId(null); onView && onView(r); }}
                        >
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                            <img src={viewInvoiceIcon} alt="View" width="16" height="16" />
                            View Invoice
                          </span>
                        </div>
                        {r.status !== 'Paid' ? (
                          <div
                            className={metricsStyles.menuItem}
                            onClick={() => { setMenuOpenId(null); onMarkPaid && onMarkPaid(r); }}
                          >
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                              <span>Paid</span>
                            </span>
                          </div>
                        ) : null}
                        <div
                          className={metricsStyles.menuItem}
                          onClick={() => { setMenuOpenId(null); onDelete && onDelete(r); }}
                        >
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                            <img src={deleteInvoiceIcon} alt="Delete" width="16" height="16" />
                            Delete
                          </span>
                        </div>
                      </div>
                    ) : null}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <PaginationBar
        page={page}
        totalPages={totalPages}
        onPrev={onPrev}
        onNext={onNext}
        renderStatus={() => statusText}
        classes={{
          bar: tableStyles.pagination,
          btn: tableStyles.btn,
          btnDisabled: '',
          status: ''
        }}
      />
    </>
  );

  if (!wrap) return TableContent;

  return <div className={tableStyles.card}>{TableContent}</div>;
}


