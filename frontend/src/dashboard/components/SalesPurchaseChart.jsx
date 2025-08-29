import React, { useEffect, useMemo, useState } from 'react';
import { apiGetGraph } from '../../api/client';
import sampleGraph from '../../assets/data/statsGraph.json';
import styles from '../Dashboard.module.css';

export default function SalesPurchaseChart({
  title = 'Sales & Purchase',
  defaultPeriod = 'monthly',
  height = 300,
  data,
  loadingOverride,
  period: controlledPeriod,
  onPeriodChange
}) {
  const isControlled = typeof controlledPeriod !== 'undefined' || typeof data !== 'undefined' || typeof loadingOverride !== 'undefined' || typeof onPeriodChange === 'function';
  const [uncontrolledPeriod, setUncontrolledPeriod] = useState(defaultPeriod);
  const period = controlledPeriod !== undefined ? controlledPeriod : uncontrolledPeriod;
  const [plotHeight, setPlotHeight] = useState(height);
  const [graph, setGraph] = useState({ labels: [], sales: [], purchase: [] });
  const [loading, setLoading] = useState(true);
  const [yAxisWidth, setYAxisWidth] = useState(56);
  const [isMobile, setIsMobile] = useState(false);
  const forcedYAxisMax = 60000;

  useEffect(() => {
    if (isControlled) return;
    (async () => {
      try {
        const g = await apiGetGraph({ period });
        if (g && g.labels && g.labels.length) {
          const next = { labels: g.labels || [], sales: g.sales || [], purchase: g.purchase || [] };
          const nonZero = (arr) => (arr || []).filter((v) => Number(v || 0) > 0).length;
          if (nonZero(next.sales) <= 1 && sampleGraph && sampleGraph[period]) {
            const s = sampleGraph[period];
            setGraph({ labels: s.labels || [], sales: s.sales || [], purchase: s.purchase || [] });
          } else {
            setGraph(next);
          }
          return;
        }
      } catch (_) {}
      finally { setLoading(false); }
    })();
  }, [period, isControlled]);

  // Responsive height based on viewport width
  useEffect(() => {
    const computeHeight = () => {
      const w = typeof window !== 'undefined' ? window.innerWidth : 1280;
      if (w < 640) return 200;
      if (w < 768) return 220;
      if (w < 1024) return 240;
      if (w < 1280) return 300;
      return 360;
    };
    const apply = () => setPlotHeight(height || computeHeight());
    apply();
    window.addEventListener('resize', apply);
    return () => window.removeEventListener('resize', apply);
  }, [height]);

  // Responsive y-axis width (visible on mobile to avoid confusing y-axis)
  useEffect(() => {
    const computeYAxis = () => {
      const w = typeof window !== 'undefined' ? window.innerWidth : 1280;
      setYAxisWidth(w <= 768 ? 40 : 56);
    };
    computeYAxis();
    window.addEventListener('resize', computeYAxis);
    return () => window.removeEventListener('resize', computeYAxis);
  }, []);

  // Track mobile viewport for limiting points
  useEffect(() => {
    const check = () => setIsMobile((typeof window !== 'undefined') && window.innerWidth <= 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  const effectiveGraph = isControlled && data ? data : graph;
  // Apply fallback even in controlled mode if series is sparse
  const augmentedGraph = useMemo(() => {
    const nonZero = (arr) => (arr || []).filter((v) => Number(v || 0) > 0).length;
    if (nonZero(effectiveGraph.sales) <= 1 && sampleGraph && sampleGraph[period]) {
      const s = sampleGraph[period];
      return { labels: s.labels || [], sales: s.sales || [], purchase: s.purchase || [] };
    }
    return effectiveGraph;
  }, [effectiveGraph, period]);

  const displayGraph = useMemo(() => {
    if (!isMobile) return augmentedGraph;
    const sliceLast = (arr) => (arr || []).slice(-6);
    return {
      labels: sliceLast(augmentedGraph.labels),
      sales: sliceLast(augmentedGraph.sales),
      purchase: sliceLast(augmentedGraph.purchase)
    };
  }, [augmentedGraph, isMobile]);
  const effectiveLoading = isControlled && typeof loadingOverride !== 'undefined' ? loadingOverride : loading;
  const maxVal = Math.max(0, ...(displayGraph.sales || []), ...(displayGraph.purchase || []));
  const tickCount = 5;
  function computeNiceScale(max, ticks) {
    const safeMax = Math.max(1, Number(max) || 1);
    const exponent = Math.floor(Math.log10(safeMax));
    const pow10 = Math.pow(10, exponent);
    const fraction = safeMax / pow10;
    let niceFraction;
    if (fraction <= 1) niceFraction = 1;
    else if (fraction <= 2) niceFraction = 2;
    else if (fraction <= 5) niceFraction = 5;
    else niceFraction = 10;
    const niceMax = niceFraction * pow10;
    const step = niceMax / ticks;
    return { niceMax, step };
  }
  const { niceMax: maxRounded, step } = computeNiceScale(maxVal, tickCount);
  const ticks = Array.from({ length: tickCount + 1 }, (_, i) => i * step);

  function formatTick(value) {
    // Show plain numbers with commas (Indian numbering), no abbreviations
    const fractionDigits = step >= 1 ? 0 : step >= 0.1 ? 1 : 2;
    return Number(value).toLocaleString('en-IN', {
      minimumFractionDigits: 0,
      maximumFractionDigits: fractionDigits
    });
  }

  return (
    <div className={styles.card}>
      <div className={styles.metricTitle} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'var(--gray-800)', fontWeight: 500 }}>
        <span style={{ fontSize: 20 }}>{title}</span>
        <div style={{ display: 'inline-flex', background: 'var(--color-border)', borderRadius: 8, overflow: 'hidden' }}>
          {['weekly','monthly','yearly'].map((p) => (
            <button
              key={p}
              onClick={() => { if (typeof onPeriodChange === 'function') onPeriodChange(p); else setUncontrolledPeriod(p); }}
              style={{
                padding: '6px 10px',
                fontSize: 12,
                color: period === p ? 'var(--color-text-on-light)' : 'var(--color-text)',
                background: period === p ? 'var(--color-text)' : 'transparent',
                border: 'none',
                cursor: 'pointer'
              }}
            >
              {p.charAt(0).toUpperCase() + p.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <div className={styles.chart} style={{ paddingTop: 16, paddingBottom: 16, paddingRight: 16, maxWidth: '100%', overflowX: 'hidden', fontFamily: 'Inter, system-ui, -apple-system, Segoe UI, Roboto, Ubuntu, Cantarell, Noto Sans, Helvetica Neue, Arial, sans-serif' }}>
        {effectiveLoading ? (
          <div style={{ color: 'var(--color-text-muted)' }}>Loading...</div>
        ) : (displayGraph.labels || []).length ? (
          <div style={{ display: 'grid', gridTemplateColumns: `${yAxisWidth}px minmax(0, 1fr) ${yAxisWidth}px`, gap: 12 }}>
            {/* Y Axis */}
            <div style={{ height: plotHeight, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', alignItems: 'flex-end', color: 'var(--gray-500)', fontSize: 12, fontWeight: 400 }}>
              {ticks.slice().reverse().map((v) => (
                <div key={v}>{formatTick(v)}</div>
              ))}
            </div>
            {/* Plot area */}
            <div style={{ position: 'relative' }}>
              {/* Grid lines */}
              <div style={{ position: 'absolute', inset: 0 }}>
                {ticks.map((v) => (
                  <div key={v} style={{ position: 'absolute', left: 0, right: 0, bottom: `${(v / maxRounded) * 100}%`, borderTop: '1px solid var(--color-border)' }} />
                ))}
              </div>
              {/* Bars + x labels */}
              <div style={{ display: 'grid', gridTemplateColumns: `repeat(${(displayGraph.labels || []).length}, minmax(0, 1fr))`, height: plotHeight + 20, alignItems: 'end', gap: 12 }}>
                {(displayGraph.labels || []).map((label, idx) => (
                  <div key={label} style={{ display: 'grid', gridTemplateRows: `${plotHeight}px auto`, alignItems: 'end', gap: 6 }}>
                    <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'center', gap: 6 }}>
                      <div style={{ background: 'var(--color-chart-purchase)', backgroundImage: 'var(--gradient-chart-purchase)', width: 12, height: `${Math.max(3, Math.round((((displayGraph.purchase || [])[idx] || 0) / maxRounded) * plotHeight))}px`, borderRadius: '10px 10px 0 0' }} />
                      <div style={{ background: 'var(--color-chart-sales)', backgroundImage: 'var(--gradient-chart-sales)', width: 12, height: `${Math.max(3, Math.round((((displayGraph.sales || [])[idx] || 0) / maxRounded) * plotHeight))}px`, borderRadius: '10px 10px 0 0' }} />
                    </div>
                    <div style={{ color: 'var(--gray-500)', fontSize: 12, textAlign: 'center', fontWeight: 400 }}>{label}</div>
                  </div>
                ))}
              </div>
            </div>
            {/* Right spacer for visual symmetry */}
            <div />
          </div>
        ) : (
          <div style={{ color: 'var(--color-text-muted)' }}>No data</div>
        )}

        <div style={{ display: 'flex', gap: 16, marginTop: 12, marginLeft: 4, flexWrap: 'wrap', fontFamily: 'Inter, system-ui, -apple-system, Segoe UI, Roboto, Ubuntu, Cantarell, Noto Sans, Helvetica Neue, Arial, sans-serif', fontSize: 12, fontWeight: 400 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6}}><span style={{ width: 12, height: 12, backgroundImage: 'var(--gradient-chart-purchase)', borderRadius: '50%' }} /> Purchase</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}><span style={{ width: 12, height: 12, backgroundImage: 'var(--gradient-chart-sales)', borderRadius: '50%' }} /> Sales</div>
        </div>
      </div>
    </div>
  );
}


