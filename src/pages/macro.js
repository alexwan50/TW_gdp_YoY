
import { getConfig, getGdpData } from '../store.js';
import { INDEX_DATA, FORECAST_QUARTERS, GDP_START_YEAR, detectTrough, GDP_SAAR_FORECAST } from '../gdpData.js';

// Chart dimensions
const CHART_W = 1680;
const CHART_H = 256;
const GDP_MIN = -12;
const GDP_MAX = 16;
const GDP_RANGE = (GDP_MAX - GDP_MIN) || 1;

function gdpToY(val) {
  return CHART_H - ((val - GDP_MIN) / GDP_RANGE) * CHART_H;
}

function indexToY(val, min, max) {
  return CHART_H - ((val - min) / ((max - min) || 1)) * CHART_H;
}

function buildPath(points) {
  const validPoints = (points || []).filter(p => p && !isNaN(p[0]) && !isNaN(p[1]));
  if (validPoints.length === 0) return '';
  
  let d = `M${validPoints[0][0]},${validPoints[0][1]}`;
  for (let i = 1; i < validPoints.length; i++) {
    const prev = validPoints[i - 1];
    const curr = validPoints[i];
    const cpx = (prev[0] + curr[0]) / 2;
    d += ` C${cpx},${prev[1]} ${cpx},${curr[1]} ${curr[0]},${curr[1]}`;
  }
  return d;
}

function qToX(i, total) {
  if (total <= 1) return 0;
  return Math.round((i / (total - 1)) * CHART_W);
}

function buildGDPPoints(gdpYoy, startIdx = 0, endIdx) {
  if (!gdpYoy) return [];
  const total = gdpYoy.length;
  const actualEnd = endIdx !== undefined ? endIdx : total;
  return gdpYoy
    .map((v, i) => {
      if (i < startIdx || i >= actualEnd) return null;
      return (v !== undefined && v !== null) ? [qToX(i, total), Math.round(gdpToY(v))] : null;
    })
    .filter(p => p !== null);
}

function buildIndexPoints(key, total) {
  const info = INDEX_DATA[key];
  if (!info || !info.data) return [];
  
  return info.data
    .map((v, i) => (v !== undefined && v !== null) ? [qToX(i, total), Math.round(indexToY(v, info.min, info.max))] : null)
    .filter(p => p !== null);
}

export function renderMacroPage() {
  const config = getConfig();
  const GDP_YOY = getGdpData();
  const TOTAL_QUARTERS = GDP_YOY.length;
  const FORECAST_START_INDEX = TOTAL_QUARTERS - FORECAST_QUARTERS;
  
  const enabledIndices = Object.entries(config.indices)
    .filter(([, v]) => v)
    .map(([k]) => k);

  // === Trough Detection ===
  const trough = detectTrough(GDP_YOY, FORECAST_QUARTERS);

  // GDP path — actual (solid) + forecast (dashed)
  const actualPoints = buildGDPPoints(GDP_YOY, 0, FORECAST_START_INDEX + 1); 
  const forecastPoints = buildGDPPoints(GDP_YOY, FORECAST_START_INDEX - 1, TOTAL_QUARTERS); 
  const actualPath = buildPath(actualPoints);
  const forecastPath = buildPath(forecastPoints);
  
  // Area fill (full range)
  const allPoints = buildGDPPoints(GDP_YOY);
  const fullPath = buildPath(allPoints);
  const gdpAreaPath = fullPath ? (fullPath + ` L${CHART_W},${CHART_H} L0,${CHART_H} Z`) : '';

  // Forecast shading zone
  const forecastStartX = qToX(FORECAST_START_INDEX, TOTAL_QUARTERS);

  // Zero line Y position
  const zeroY = Math.round(gdpToY(0));

  // Peak & trough markers
  const peakX = qToX(trough.peak.index, TOTAL_QUARTERS);
  const peakY = Math.round(gdpToY(trough.peak.value));
  const troughX = qToX(trough.trough.index, TOTAL_QUARTERS);
  const troughY = Math.round(gdpToY(trough.trough.value));

  // Build index overlay SVGs
  let indexSvg = '';
  let indexLegend = '';

  enabledIndices.forEach((key) => {
    const info = INDEX_DATA[key];
    if (!info) return;
    const pts = buildIndexPoints(key, TOTAL_QUARTERS);
    const path = buildPath(pts);
    indexSvg += `<path d="${path}" fill="none" stroke="${info.color}" stroke-width="1.5" stroke-linecap="round" opacity="0.6"/>`;
    indexLegend += `
      <div class="legend-item" style="opacity:0.7">
        <div class="legend-line" style="background:${info.color}"></div>
        <span class="legend-text" style="color:${info.color}">${info.label}</span>
      </div>
    `;
  });

  // Right Y-axis labels
  let rightAxisHtml = '';
  if (enabledIndices.length > 0) {
    const firstKey = enabledIndices[0];
    const info = INDEX_DATA[firstKey];
    if (info) {
      const steps = 6;
      const range = info.max - info.min;
      const labels = [];
      for (let i = 0; i <= steps; i++) {
        const val = info.max - (range / steps) * i;
        labels.push(val >= 1000 ? `${(val / 1000).toFixed(1)}k` : Math.round(val).toString());
      }
      rightAxisHtml = `<div class="right-y-axis">${labels.map((l) => `<span>${l}</span>`).join('')}</div>`;
    }
  }

  // Left Y-axis labels
  const leftLabels = ['16%', '12%', '8%', '4%', '0%', '-4%', '-8%', '-12%'];

  // X-axis
  const yearCount = Math.ceil(TOTAL_QUARTERS / 4);
  const xLabelsArray = [];
  for (let y = 0; y < yearCount; y++) {
    const year = GDP_START_YEAR + y;
    const x = Math.round((y * 4) / (TOTAL_QUARTERS - 1) * CHART_W);
    xLabelsArray.push(`<span style="position:absolute;left:${x}px;transform:translateX(-50%)">'${String(year).slice(2)}</span>`);
  }
  const xLabels = xLabelsArray.join('');

  // Latest stats
  const latestYoY = (GDP_YOY[GDP_YOY.length - 1] !== undefined && GDP_YOY[GDP_YOY.length - 1] !== null) 
    ? GDP_YOY[GDP_YOY.length - 1] 
    : 0;
  const prevYoY = GDP_YOY[GDP_YOY.length - 2] || 0;
  const trend = latestYoY >= prevYoY ? 'expanding' : 'decelerating';
  const trendIcon = latestYoY >= prevYoY ? 'trending_up' : 'trending_down';
  const trendColor = latestYoY >= prevYoY ? 'var(--secondary)' : 'var(--primary)';

  // Trough analysis card content
  const troughLabel = trough.trough.isForecast ? '(DGBAS 預測)' : '(實際)';
  const cyclePhase = trough.trough.index === TOTAL_QUARTERS - 1
    ? '尚未觸底 — 仍在下降通道'
    : trough.trough.index >= FORECAST_START_INDEX
      ? `預計 ${trough.trough.label} 觸底`
      : `已於 ${trough.trough.label} 觸底`;

  const saarRows = GDP_SAAR_FORECAST.map((d, i) => {
    const quarterIdx = FORECAST_START_INDEX + i;
    const yoyVal = GDP_YOY[quarterIdx];
    return `<tr>
      <td style="padding:6px 12px;font-family:var(--font-mono);font-size:12px;color:var(--on-surface)">${d.quarter}</td>
      <td style="padding:6px 12px;font-family:var(--font-mono);font-size:12px;color:var(--primary)">${yoyVal !== null ? (yoyVal + '%') : '-'}</td>
      <td style="padding:6px 12px;font-family:var(--font-mono);font-size:12px;color:var(--on-surface-variant)">${d.saar}%</td>
    </tr>`;
  }).join('');

  return `
    <div class="page" id="page-macro">
      <section style="margin-bottom:2rem">
        <p class="briefing-label">Intelligence Briefing</p>
        <h2 class="page-title">Macro Overview</h2>
      </section>

      <section class="bento-grid">
        <div class="bento-card card-gradient">
          <div style="z-index:10">
            <p class="bento-label">GDP YoY (Latest)</p>
            <p class="bento-value ${latestYoY >= 0 ? 'positive' : 'negative'}">${latestYoY}%</p>
          </div>
          <div class="bento-footer">
            <span class="material-symbols-outlined" style="color:${trendColor}">${trendIcon}</span>
            <span class="bento-footer-text">${trend === 'expanding' ? 'Accelerating' : 'Decelerating'} • ${GDP_START_YEAR + Math.floor((TOTAL_QUARTERS-1)/4)}Q4</span>
          </div>
          <div class="bento-bg-icon"><span class="material-symbols-outlined" style="color:var(--primary)">trending_up</span></div>
        </div>

        <div class="bento-card card-gradient" style="border-left:2px solid rgba(255,183,77,0.3)">
          <div style="z-index:10">
            <p class="bento-label">Cycle Peak</p>
            <p class="bento-value positive">${trough.peak.value}%</p>
          </div>
          <div class="bento-footer">
            <span class="material-symbols-outlined" style="color:var(--secondary)">arrow_upward</span>
            <span class="bento-footer-text">${trough.peak.label}</span>
          </div>
          <div class="bento-bg-icon"><span class="material-symbols-outlined" style="color:var(--secondary)">summit</span></div>
        </div>

        <div class="bento-card card-gradient" style="border-left:2px solid rgba(255,113,108,0.3)">
          <div style="z-index:10">
            <p class="bento-label">Projected Trough</p>
            <p class="bento-value info">${trough.trough.value}%</p>
          </div>
          <div class="bento-footer">
            <span class="material-symbols-outlined" style="color:var(--primary)">arrow_downward</span>
            <span class="bento-footer-text">${trough.trough.label} ${troughLabel}</span>
          </div>
          <div class="bento-bg-icon"><span class="material-symbols-outlined" style="color:var(--primary)">valley</span></div>
        </div>

        <div class="bento-card card-gradient">
          <div style="z-index:10">
            <p class="bento-label">Decline Magnitude</p>
            <p class="bento-value dim">${trough.declineMagnitude} pp</p>
          </div>
          <div class="bento-footer">
            <span class="material-symbols-outlined" style="color:var(--tertiary)">swap_vert</span>
            <span class="bento-footer-text">Over ${trough.declineQuarters}Q from peak</span>
          </div>
          <div class="bento-bg-icon"><span class="material-symbols-outlined" style="color:var(--tertiary)">analytics</span></div>
        </div>
      </section>

      <section class="chart-section">
        <div class="chart-header">
          <div style="max-width:65%">
            <h3 class="chart-title">Taiwan Quarterly GDP YoY</h3>
            <p class="chart-subtitle">Actual + DGBAS Forecast • ${GDP_START_YEAR}–2026</p>
          </div>
          <button class="setup-btn" id="btn-setup">
            <span class="material-symbols-outlined">tune</span>
            <span class="setup-btn-label">Setup</span>
          </button>
        </div>

        <div class="chart-container">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:0.75rem">
            <div class="chart-legend">
              <div class="legend-item"><div class="legend-dot" style="background:#84ADFF"></div><span class="legend-text">GDP YoY (Actual)</span></div>
              <div class="legend-item" style="opacity:0.7"><div class="legend-dot" style="background:#FFB148;border:1px dashed #FFB148"></div><span class="legend-text">GDP YoY (Forecast)</span></div>
              ${indexLegend}
            </div>
            ${enabledIndices.length > 0 ? `<span style="font-size:10px;color:var(--on-surface-variant);opacity:0.6">${enabledIndices.length} overlay(s)</span>` : ''}
          </div>

          <div class="dual-axis-chart">
            <div class="y-axis left-y-axis">${leftLabels.map((l) => `<span>${l}</span>`).join('')}</div>
            <div class="chart-scroll-body" id="chart-scroll">
              <div class="chart-interactive-area" style="width:${CHART_W}px;height:${CHART_H}px;position:relative">
                <svg width="${CHART_W}" height="${CHART_H}" style="position:absolute;inset:0">
                  ${leftLabels.map((_, i) => {
                    const y = Math.round((i / (leftLabels.length - 1)) * CHART_H);
                    return `<line x1="0" x2="${CHART_W}" y1="${y}" y2="${y}" stroke="rgba(255,255,255,0.04)" stroke-width="1"/>`;
                  }).join('')}
                  <line x1="0" x2="${CHART_W}" y1="${zeroY}" y2="${zeroY}" stroke="rgba(255,255,255,0.1)" stroke-width="1" stroke-dasharray="6,4"/>
                  <rect x="${forecastStartX}" y="0" width="${CHART_W - forecastStartX}" height="${CHART_H}" fill="rgba(255,177,72,0.03)" />
                  <line x1="${forecastStartX}" x2="${forecastStartX}" y1="0" y2="${CHART_H}" stroke="rgba(255,177,72,0.25)" stroke-width="1" stroke-dasharray="4,4"/>
                </svg>

                <svg width="${CHART_W}" height="${CHART_H}" style="position:absolute;inset:0" preserveAspectRatio="none">
                  ${gdpAreaPath ? `<path d="${gdpAreaPath}" fill="rgba(132,173,255,0.05)"/>` : ''}
                  <path d="${actualPath}" fill="none" stroke="#84ADFF" stroke-width="2.5" stroke-linecap="round"/>
                  <path d="${forecastPath}" fill="none" stroke="#FFB148" stroke-width="2.5" stroke-linecap="round" stroke-dasharray="8,5"/>
                  <circle cx="${peakX}" cy="${peakY}" r="5" fill="#69F6B8" stroke="#0D0F14" stroke-width="2"/>
                  <circle cx="${troughX}" cy="${troughY}" r="5" fill="#FF716C" stroke="#0D0F14" stroke-width="2"/>
                  ${indexSvg}
                </svg>
                <div class="chart-crosshair" id="chart-crosshair"></div>
                <div class="chart-tooltip" id="chart-tooltip"></div>
                <div style="position:absolute;bottom:-20px;left:0;width:${CHART_W}px;height:20px;font-size:9px;color:rgba(169,171,175,0.5)">${xLabels}</div>
              </div>
            </div>
            ${rightAxisHtml}
          </div>
        </div>
      </section>

      <section style="margin-bottom:2.5rem">
        <h4 class="section-label">GDP YoY 觸底分析</h4>
        <div class="insight-card" style="flex-direction:column;align-items:stretch;gap:1rem;padding:1.25rem">
          <div style="display:flex;align-items:center;gap:0.75rem;margin-bottom:0.5rem">
            <span class="material-symbols-outlined" style="color:#FF716C;font-size:28px">query_stats</span>
            <div><h5 style="margin:0">${cyclePhase}</h5><p style="font-size:12px;color:var(--on-surface-variant);margin:4px 0 0">基期因素使 YoY 從 ${trough.peak.value}% 回歸常態</p></div>
          </div>
          <table style="width:100%;border-collapse:collapse;font-size:12px">
            <thead><tr style="border-bottom:1px solid rgba(255,255,255,0.08)"><th style="padding:8px;text-align:left">Quarter</th><th style="padding:8px;text-align:left">YoY %</th><th style="padding:8px;text-align:left">SAAR %</th></tr></thead>
            <tbody>${saarRows}</tbody>
          </table>
        </div>
      </section>
    </div>
  `;
}

export function initChartTooltip() {
  const area = document.querySelector('.chart-interactive-area');
  const crosshair = document.getElementById('chart-crosshair');
  const tooltip = document.getElementById('chart-tooltip');
  if (!area || !crosshair || !tooltip) return;

  const GDP_YOY = getGdpData();
  const total = GDP_YOY.length;
  const qSpacing = CHART_W / (total - 1);
  const config = getConfig();
  const enabledIndices = Object.entries(config.indices).filter(([, v]) => v).map(([k]) => k);

  area.addEventListener('mousemove', (e) => {
    const rect = area.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const qIndex = Math.round(x / qSpacing);
    if (qIndex < 0 || qIndex >= total) return;
    const snapX = Math.round(qIndex * qSpacing);
    crosshair.style.display = 'block';
    crosshair.style.left = `${snapX}px`;
    const yVal = GDP_YOY[qIndex];
    let rows = `<div class="tt-date">${GDP_START_YEAR + Math.floor(qIndex/4)} Q${(qIndex%4)+1}</div>`;
    rows += `<div class="tt-row"><span class="tt-dot" style="background:${qIndex >= total-4 ? '#FFB148' : '#84ADFF'}"></span><span class="tt-val">GDP: ${yVal !== null ? yVal+'%' : '-'}</span></div>`;
    
    enabledIndices.forEach(key => {
      const info = INDEX_DATA[key];
      const val = info.data[qIndex];
      if (val) rows += `<div class="tt-row"><span class="tt-dot" style="background:${info.color}"></span><span class="tt-val">${info.label}: ${val.toLocaleString()}</span></div>`;
    });
    tooltip.innerHTML = rows;
    tooltip.style.display = 'block';
    tooltip.style.left = snapX > CHART_W - 150 ? `${snapX - 160}px` : `${snapX + 10}px`;
  });

  area.addEventListener('mouseleave', () => {
    crosshair.style.display = 'none';
    tooltip.style.display = 'none';
  });
}
