import React from 'react';
import PaginationBar from '../../components/PaginationBar';
import styles from './ProductsTable.module.css';

// CSS variable for grey-700: #374151 (see styles.btn in ProductsTable.module.css)
const dataCellStyle = { color: '#374151' };

// Custom styles for table lines and header background
const tableLineStyle = { borderBottom: '1px solid rgba(0,0,0,0.2)', borderRight: '1px solid rgba(0,0,0,0.2)' };
const lastCellStyle = { ...tableLineStyle, borderRight: 0 };
const headerStyle = { background: '#B6B9CF', color: '#424457', fontSize: 14, fontWeight: 600, letterSpacing: '0.02em', textTransform: 'uppercase', borderBottom: '1px solid rgba(0,0,0,0.2)', borderRight: '1px solid rgba(0,0,0,0.2)' };
const headerLastCellStyle = { ...headerStyle, borderRight: 0 };

export default function ProductsTable({ rows = [], page = 1, totalPages = 1, loading = false, onPrev, onNext, onRowClick, wrap = true }) {
  const TableContent = (
    <>
      <div className={styles.tableContainer}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th style={headerStyle}>Products</th>
              <th style={headerStyle}>Price</th>
              <th style={headerStyle}>Quantity</th>
              <th style={headerStyle}>Threshold Value</th>
              <th style={headerStyle}>Expiry Date</th>
              <th style={headerLastCellStyle}>Availability</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} style={{ textAlign: 'center', padding: 20, color: 'var(--color-text-muted)', ...lastCellStyle }}>Loading...</td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ textAlign: 'center', padding: 20, color: 'var(--color-text-muted)', ...lastCellStyle }}>No products</td>
              </tr>
            ) : rows.map((r) => (
              <tr
                key={r._id || r.id || r.name}
              >
                <td style={{ ...dataCellStyle, ...tableLineStyle }}>{r.name}</td>
                <td style={{ ...dataCellStyle, ...tableLineStyle }}>₹{Number(r.price).toLocaleString('en-IN')}</td>
                <td style={{ ...dataCellStyle, ...tableLineStyle }}>{r.quantity}</td>
                <td style={{ ...dataCellStyle, ...tableLineStyle }}>{r.threshold}</td>
                <td style={{ ...dataCellStyle, ...tableLineStyle }}>{r.expiry || '-'}</td>
                <td style={{ ...dataCellStyle, ...lastCellStyle }}>
                  <span
                    className={
                      r.status === 'in_stock'
                        ? styles.in
                        : r.status === 'out_of_stock'
                        ? styles.out
                        : r.status === 'expired'
                        ? styles.out
                        : styles.low
                    }
                  >
                    {r.availability || (r.status === 'in_stock'
                      ? 'In Stock'
                      : r.status === 'out_of_stock'
                      ? 'Out Of Stock'
                      : r.status === 'low_stock'
                      ? 'Low Stock'
                      : r.status === 'expired'
                      ? 'Expired'
                      : r.status)}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <PaginationBar
        page={page}
        totalPages={totalPages}
        onPrev={onPrev}
        onNext={onNext}
        classes={{
          bar: styles.pagination,
          btn: styles.btn,
          btnDisabled: '',
          status: ''
        }}
      />
    </>
  );

  if (!wrap) return TableContent;

  return <div className={styles.card}>{TableContent}</div>;
}
