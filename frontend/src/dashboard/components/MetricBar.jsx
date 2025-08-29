import React from 'react';

/**
 * MetricBar
 * Generic metric bar renderer.
 * Props:
 * - title?: string
 * - items: Array<{ id: string, label: string, pairs: Array<{ value: React.ReactNode, sub?: React.ReactNode }> }>
 * - classes: { title, row, cell, label, pair, group, value, subLabel }
 */
export default function MetricBar({ title, items = [], classes = {} }) {
  const {
    title: titleClass = '',
    row = '',
    cell = '',
    label = '',
    pair = '',
    group = '',
    value = '',
    subLabel = ''
  } = classes || {};


  return (
    <div>
      {title ? <h2 className={titleClass} style={{ margin: 0 }}>{title}</h2> : null}
      <div className={row}>
        {items.map((m) => (
          <div key={m.id} className={cell}>
            <div className={label}>{m.label}</div>
            <div className={pair}>
              {(m.pairs || []).map((p, idx) => (
                <div key={idx} className={group}>
                  <div className={value}>{p.value}</div>
                  {p.sub ? <div className={subLabel}>{p.sub}</div> : null}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}


