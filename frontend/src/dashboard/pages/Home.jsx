import React, { useEffect, useMemo, useState, useRef } from 'react';
import styles from '../Dashboard.module.css';
import DashboardLayout from '../DashboardLayout';
import TopProducts from '../components/TopProducts';
import SalesPurchaseChart from '../components/SalesPurchaseChart';
import { apiGetKpis, apiGetTopProducts, apiGetGraph } from '../../api/client';
import salesIcon from '../../assets/dashboard/sales.svg';
import revenueIcon from '../../assets/dashboard/revenue.svg';
import profitIcon from '../../assets/dashboard/profit.svg';
import costIcon from '../../assets/dashboard/cost.svg';
import purchaseIcon from '../../assets/dashboard/purchase.svg';
import cancelIcon from '../../assets/dashboard/cancel.svg';
import quantityIcon from '../../assets/dashboard/quantity.svg';
import toBeReceivedIcon from '../../assets/dashboard/toBeReceived.svg';
import numOfSuppliersIcon from '../../assets/dashboard/numOfSuppliers.svg';
import numOfCategoriesIcon from '../../assets/dashboard/numOfCategories.svg';
import returnIcon from '../../assets/dashboard/return.svg';

function Metric({ icon, label, value }) {
  return (
    <div className={styles.metricItem}>
      <img src={icon} alt="" />
      <div style={{ display: 'flex', justifyContent: 'space-around' }}>
        <div className={styles.kpi}>{value}</div>
        <div className={styles.metricSub}>{label}</div>
      </div>
    </div>
  );
}

// Rating moved to reusable TopProducts component

export default function Home() {
  const [kpis, setKpis] = useState({ revenue: 0, sold: 0, inStock: 0 });
  const [loading, setLoading] = useState(true);

  // Widgets layout state (drag-and-drop)
  const defaultLeft = useMemo(() => ['chart', 'salesOverview', 'purchaseOverview'], []);
  const defaultRight = useMemo(() => ['inventorySummary', 'productSummary', 'topProducts'], []);
  const [leftWidgets, setLeftWidgets] = useState(defaultLeft);
  const [rightWidgets, setRightWidgets] = useState(defaultRight);
  const dragDataRef = useRef(null); // { id: string, from: 'left' | 'right' }
  const [isDragging, setIsDragging] = useState(false);
  const [dragOverKey, setDragOverKey] = useState('');
  const [topProductsItems, setTopProductsItems] = useState([]);
  const [chartPeriod, setChartPeriod] = useState('monthly');
  const [chartData, setChartData] = useState({ labels: [], sales: [], purchase: [] });
  const [chartLoading, setChartLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const data = await apiGetKpis();
        setKpis({ revenue: data.revenue || 0, sold: data.sold || 0, inStock: data.inStock || 0 });
      } catch (_e) {}
      finally {
        setLoading(false);
      }
    })();
  }, []);

  // Prefetch Top Products so TopProducts component does not refetch on reorders
  useEffect(() => {
    (async () => {
      try {
        const res = await apiGetTopProducts();
        const max = Math.max(1, ...res.map((r) => r.sales || 0));
        const mapped = res.map((r) => ({ name: r.name, rating: Math.max(2.5, Math.min(5, (r.sales / max) * 5)) }));
        setTopProductsItems(mapped);
      } catch (_) {}
    })();
  }, []);

  // Prefetch chart data and control period from here to avoid refetches on drag
  useEffect(() => {
    let mounted = true;
    (async () => {
      setChartLoading(true);
      try {
        const g = await apiGetGraph({ period: chartPeriod });
        if (!mounted) return;
        if (g && g.labels && g.labels.length) {
          setChartData({ labels: g.labels || [], sales: g.sales || [], purchase: g.purchase || [] });
        } else {
          setChartData({ labels: [], sales: [], purchase: [] });
        }
      } catch (_) {
        if (mounted) setChartData({ labels: [], sales: [], purchase: [] });
      }
      finally {
        if (mounted) setChartLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [chartPeriod]);

  // Restore widget order from localStorage
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('dashboard:layout') || '{}');
      if (Array.isArray(saved.left) && saved.left.length) setLeftWidgets(saved.left);
      if (Array.isArray(saved.right) && saved.right.length) setRightWidgets(saved.right);
    } catch (_e) {}
  }, []);

  // Persist widget order
  useEffect(() => {
    try {
      localStorage.setItem('dashboard:layout', JSON.stringify({ left: leftWidgets, right: rightWidgets }));
    } catch (_e) {}
  }, [leftWidgets, rightWidgets]);

  function renderWidget(widgetId) {
    if (widgetId === 'salesOverview') {
      return (
        <div className={styles.card}>
          <p style={{ fontSize: 20, fontWeight: 500, margin: 0}}>Sales Overview</p>
          <div className={styles.metricList}>
            <Metric icon={salesIcon} label="Sold" value={loading ? 'Loading...' : `${Number(kpis.sold || 0).toLocaleString('en-IN')}`} />
            <Metric icon={revenueIcon} label="Revenue" value={loading ? 'Loading...' : `₹ ${Number(kpis.revenue || 0).toLocaleString('en-IN')}`} />
            <Metric icon={profitIcon} label="Profit" value="₹ 868" />
            <Metric icon={costIcon} label="Cost" value="₹ 17,432" />
          </div>
        </div>
      );
    }
    if (widgetId === 'purchaseOverview') {
      return (
        <div className={styles.card}>
          <p style={{ fontSize: 20, fontWeight: 500, margin: 0}}>Purchase Overview</p>
          <div className={styles.metricList}>
            <Metric icon={purchaseIcon} label="Purchase" value="82" />
            <Metric icon={costIcon} label="Cost" value="₹ 13,573" />
            <Metric icon={cancelIcon} label="Cancel" value="5" />
            <Metric icon={returnIcon} label="Return" value="₹ 17,432" />
          </div>
        </div>
      );
    }
    if (widgetId === 'chart') {
      return (
        <SalesPurchaseChart
          data={chartData}
          loadingOverride={chartLoading}
          period={chartPeriod}
          onPeriodChange={(p) => setChartPeriod(p)}
        />
      );
    }
    if (widgetId === 'inventorySummary') {
      return (
        <div className={styles.card}>
          <div style={{ fontSize: 20, fontWeight: 500, margin: 0}}>Inventory Summary</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 16}}>
            <Metric icon={quantityIcon} label="Quantity in Hand" value={loading ? 'Loading...' : String(kpis.inStock || 0)} />
            <Metric icon={toBeReceivedIcon} label="To be received" value="200" />
          </div>
        </div>
      );
    }
    if (widgetId === 'productSummary') {
      return (
        <div className={styles.card}>
          <div style={{ fontSize: 20, fontWeight: 500, margin: 0}}>Product Summary</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 16}}>
            <Metric icon={numOfSuppliersIcon} label="Number of Suppliers" value="31" />
            <Metric icon={numOfCategoriesIcon} label="Number of Categories" value="21" />
          </div>
        </div>
      );
    }
    if (widgetId === 'topProducts') {
      return <TopProducts items={topProductsItems}/>;
    }
    return null;
  }

  function onDragStart(e, payload) {
    dragDataRef.current = payload; // { id, from }
    try { e.dataTransfer.setData('text/plain', JSON.stringify(payload)); } catch (_e) {}
    e.dataTransfer.effectAllowed = 'move';
    setIsDragging(true);
  }

  function onDragEnd() {
    dragDataRef.current = null;
    setDragOverKey('');
    setIsDragging(false);
  }

  function handleDropAt(column, index) {
    const data = dragDataRef.current;
    if (!data) return;
    const { id, from } = data;
    if (from === column) {
      const list = column === 'left' ? [...leftWidgets] : [...rightWidgets];
      const oldIndex = list.indexOf(id);
      if (oldIndex === -1) return;
      list.splice(oldIndex, 1);
      const insertAt = index <= oldIndex ? index : Math.max(0, index - 1);
      list.splice(insertAt, 0, id);
      column === 'left' ? setLeftWidgets(list) : setRightWidgets(list);
    } else {
      const fromList = from === 'left' ? [...leftWidgets] : [...rightWidgets];
      const toList = column === 'left' ? [...leftWidgets] : [...rightWidgets];
      const oldIndex = fromList.indexOf(id);
      if (oldIndex === -1) return;
      fromList.splice(oldIndex, 1);
      const insertAt = Math.max(0, Math.min(index, toList.length));
      toList.splice(insertAt, 0, id);
      if (from === 'left') setLeftWidgets(fromList); else setRightWidgets(fromList);
      if (column === 'left') setLeftWidgets(toList); else setRightWidgets(toList);
    }
    setDragOverKey('');
  }

  function DropZone({ column, index, dzKey }) {
    const isOver = dragOverKey === dzKey;
    return (
      <div
        className={`${styles.dropZone} ${isOver ? styles.dragOver : ''}`}
        onDragOver={(e) => { e.preventDefault(); setDragOverKey(dzKey); }}
        onDragLeave={() => { if (dragOverKey === dzKey) setDragOverKey(''); }}
        onDrop={(e) => { e.preventDefault(); handleDropAt(column, index); }}
        style={{ height: isOver ? 18 : 0 }}
      />
    );
  }

  function DraggableWidget({ column, widgetId, index }) {
    const dzKey = `cell-${column}-${index}`;
    const isOver = dragOverKey === dzKey;
    return (
      <div
        draggable
        onDragStart={(e) => onDragStart(e, { id: widgetId, from: column })}
        onDragEnd={onDragEnd}
        onDragOver={(e) => { e.preventDefault(); setDragOverKey(dzKey); }}
        onDrop={(e) => { e.preventDefault(); handleDropAt(column, index); }}
        className={isOver ? styles.dragOver : ''}
        style={{ padding: 8 }}
      >
        {renderWidget(widgetId)}
      </div>
    );
  }

  // Mobile: ensure chart is first, followed by overviews
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const check = () => setIsMobile((typeof window !== 'undefined') && window.innerWidth <= 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  function orderLeftForMobile(list) {
    const ordered = [];
    const pushIf = (id) => { if (list.includes(id)) ordered.push(id); };
    pushIf('chart');
    pushIf('salesOverview');
    pushIf('purchaseOverview');
    for (const id of list) { if (!ordered.includes(id)) ordered.push(id); }
    return ordered;
  }

  const effectiveLeftWidgets = isMobile ? orderLeftForMobile(leftWidgets) : leftWidgets;

  return (
    <DashboardLayout>
      <div className={styles.grid}>
        <div style={{ display: 'grid', gap: 4 }}>
          {isDragging ? <DropZone column="left" index={0} dzKey="left-0" /> : null}
          {effectiveLeftWidgets.map((w, idx) => (
            <React.Fragment key={`left-${w}`}>
              <DraggableWidget column="left" widgetId={w} index={idx} />
              {isDragging ? <DropZone column="left" index={idx + 1} dzKey={`left-${idx + 1}`} /> : null}
            </React.Fragment>
          ))}
        </div>

        <div className={styles.rightCol}>
          {isDragging ? <DropZone column="right" index={0} dzKey="right-0" /> : null}
          {rightWidgets.map((w, idx) => (
            <React.Fragment key={`right-${w}`}>
              <DraggableWidget column="right" widgetId={w} index={idx} />
              {isDragging ? <DropZone column="right" index={idx + 1} dzKey={`right-${idx + 1}`} /> : null}
            </React.Fragment>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
}


