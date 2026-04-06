import { getConfig, getGdpData } from '../store.js';
import { INDEX_DATA, FORECAST_QUARTERS, GDP_START_YEAR, detectTrough, GDP_SAAR_FORECAST } from '../gdpData.js';

const GDP_YOY = getGdpData();

// X-axis labels: one per year
const END_YEAR = GDP_START_YEAR + Math.ceil(GDP_YOY.length / 4) - 1;
const YEAR_LABELS = [];
for (let y = GDP_START_YEAR; y <= END_YEAR; y++) YEAR_LABELS.push(`'${String(y).slice(2)}`);

// Chart dimensions
const CHART_W = 1680;
const CHART_H = 256;
const GDP_MIN = -12;
const GDP_MAX = 16;
const GDP_RANGE = GDP_MAX - GDP_MIN;

// Forecast boundary
const FORECAST_START_INDEX = GDP_YOY.length - FORECAST_QUARTERS;
const TOTAL_QUARTERS = GDP_YOY.length;

function gdpToY(val) {
  return CHART_H - ((val - GDP_MIN) / GDP_RANGE) * CHART_H;
}

function indexToY(val, min, max) {
  return CHART_H - ((val - min) / (max - min)) * CHART_H;
}

function buildPath(points) {
  const validPoints = points.filter(p => !isNaN(p[0]) && !isNaN(p[1]));
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

function qToX(i) {
  return Math.round((i / (TOTAL_QUARTERS - 1)) * CHART_W);
}

function buildGDPPoints(startIdx = 0, endIdx = TOTAL_QUARTERS) {
  return GDP_YOY
    .map((v, i) => {
      if (i < startIdx || i >= endIdx) return null;
      return (v !== undefined && v !== null) ? [qToX(i), Math.round(gdpToY(v))] : null;
    })
    .filter(p => p !== null);
}

function buildIndexPoints(key) {
  const info = INDEX_DATA[key];
  if (!info) return [];
  
  return info.data
    .map((v, i) => (v !== undefined && v !== null) ? [qToX(i), Math.round(indexToY(v, info.min, info.max))] : null)
    .filter(p => p !== null);
}

export function renderMacroPage() {
  const config = getConfig();
  const enabledIndices = Object.entries(config.indices)
    .filter(([, v]) => v)
    .map(([k]) => k);

  // === Trough Detection ===
  const trough = detectTrough(GDP_YOY, FORECAST_QUARTERS);

  // GDP path — actual (solid) + forecast (dashed)
  const actualPoints = buildGDPPoints(0, FORECAST_START_INDEX + 1); // include overlap point
  const forecastPoints = buildGDPPoints(FORECAST_START_INDEX - 1, TOTAL_QUARTERS); // overlap for continuity
  const actualPath = buildPath(actualPoints);
  const forecastPath = buildPath(forecastPoints);
  
  // Area fill (full range)
  const allPoints = buildGDPPoints();
  const fullPath = buildPath(allPoints);
  const gdpAreaPath = fullPath + ` L${CHART_W},${CHART_H} L0,${CHART_H} Z`;

  // Forecast shading zone
  const forecastStartX = qToX(FORECAST_START_INDEX);

  // Zero line Y position
  const zeroY = Math.round(gdpToY(0));

  // Peak & trough markers
  const peakX = qToX(trough.peak.index);
  const peakY = Math.round(gdpToY(trough.peak.value));
  const troughX = qToX(trough.trough.index);
  const troughY = Math.round(gdpToY(trough.trough.value));

  // Build index overlay SVGs
  let indexSvg = '';
  let indexLegend = '';

  enabledIndices.forEach((key) => {
    const info = INDEX_DATA[key];
    if (!info) return;
    const pts = buildIndexPoints(key);
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
      rightAxisHtml = `
        <div class="right-y-axis">
          ${labels.map((l) => `<span>${l}</span>`).join('')}
        </div>
      `;
    }
  }

  // Left Y-axis labels
  const leftLabels = ['16%', '12%', '8%', '4%', '0%', '-4%', '-8%', '-12%'];

  // X-axis
  const xLabels = YEAR_LABELS.map((label, i) => {
    const x = Math.round((i * 4) / (TOTAL_QUARTERS - 1) * CHART_W);
    return `<span style="position:absolute;left:${x}px;transform:translateX(-50%)">${label}</span>`;
  }).join('');

  // Macro bento cards — use actual latest data
  const latestYoY = GDP_YOY[GDP_YOY.length - 1];
  const prevYoY = GDP_YOY[GDP_YOY.length - 2];
  const trend = latestYoY >= prevYoY ? 'expanding' : 'decelerating';
  const trendIcon = latestYoY >= prevYoY ? 'trending_up' : 'trending_down';
  const trendColor = latestYoY >= prevYoY ? 'var(--secondary)' : 'var(--primary)';

  // Bento config states
  const interestActive = config.macro.interestRate;
  const inflationActive = config.macro.inflation;

  // Trough analysis card content
  const troughLabel = trough.trough.isForecast ? '(DGBAS 預測)' : '(實際)';
  const cyclePhase = trough.trough.index === TOTAL_QUARTERS - 1
    ? '尚未觸底 — 仍在下降通道'
    : trough.trough.index >= FORECAST_START_INDEX
      ? `預計 ${trough.trough.label} 觸底`
      : `已於 ${trough.trough.label} 觸底`;

  // SAAR table for forecast
  const saarRows = GDP_SAAR_FORECAST.map(d => {
    return `<tr>
      <td style="padding:6px 12px;font-family:var(--font-mono);font-size:12px;color:var(--on-surface)">${d.quarter}</td>
      <td style="padding:6px 12px;font-family:var(--font-mono);font-size:12px;color:var(--primary)">${GDP_YOY[FORECAST_START_INDEX + GDP_SAAR_FORECAST.indexOf(d)]}%</td>
      <td style="padding:6px 12px;font-family:var(--font-mono);font-size:12px;color:var(--on-surface-variant)">${d.saar}%</td>
    </tr>`;
  }).join('');

  return `
    <div class="page" id="page-macro">
      <section style="margin-bottom:2rem">
        <p class="briefing-label">Intelligence Briefing</p>
        <h2 class="page-title">Macro Overview</h2>
      </section>

      <!-- Bento Grid -->
      <section class="bento-grid">
        <div class="bento-card card-gradient">
          <div style="z-index:10">
            <p class="bento-label">GDP YoY (Latest)</p>
            <p class="bento-value ${latestYoY >= 0 ? 'positive' : 'negative'}">${latestYoY}%</p>
          </div>
          <div class="bento-footer">
            <span class="material-symbols-outlined" style="color:${trendColor}">${trendIcon}</span>
            <span class="bento-footer-text">${trend === 'expanding' ? 'Accelerating' : 'Decelerating'} • ${END_YEAR}Q4</span>
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

      <!-- Chart Section -->
      <section class="chart-section">
        <div class="chart-header">
          <div style="max-width:65%">
            <h3 class="chart-title">Taiwan Quarterly GDP YoY</h3>
            <p class="chart-subtitle">Actual + DGBAS Forecast • ${GDP_START_YEAR}–${END_YEAR}</p>
          </div>
          <button class="setup-btn" id="btn-setup">
            <span class="material-symbols-outlined">tune</span>
            <span class="setup-btn-label">Setup</span>
          </button>
        </div>

        <div class="chart-container">
          <!-- Legend -->
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:0.75rem">
            <div class="chart-legend">
              <div class="legend-item">
                <div class="legend-dot" style="background:#84ADFF;box-shadow:0 0 8px rgba(132,173,255,0.4)"></div>
                <span class="legend-text" style="color:var(--on-surface)">GDP YoY (Actual)</span>
              </div>
              <div class="legend-item" style="opacity:0.7">
                <div class="legend-dot" style="background:#FFB148;border:1px dashed #FFB148;box-shadow:0 0 8px rgba(255,177,72,0.3)"></div>
                <span class="legend-text" style="color:#FFB148">GDP YoY (Forecast)</span>
              </div>
              ${indexLegend}
            </div>
            ${enabledIndices.length > 0 ? `<span style="font-size:10px;color:var(--on-surface-variant);opacity:0.6">${enabledIndices.length} overlay${enabledIndices.length !== 1 ? 's' : ''}</span>` : ''}
          </div>

          <!-- Dual-axis chart -->
          <div class="dual-axis-chart">
            <!-- Left Y axis: GDP YoY % -->
            <div class="y-axis left-y-axis">
              ${leftLabels.map((l) => `<span>${l}</span>`).join('')}
            </div>

            <!-- Scrollable chart body -->
            <div class="chart-scroll-body" id="chart-scroll">
              <div class="chart-interactive-area" style="width:${CHART_W}px;height:${CHART_H}px;position:relative">
                <!-- Grid lines -->
                <svg width="${CHART_W}" height="${CHART_H}" style="position:absolute;inset:0">
                  ${leftLabels.map((_, i) => {
                    const y = Math.round((i / (leftLabels.length - 1)) * CHART_H);
                    return `<line x1="0" x2="${CHART_W}" y1="${y}" y2="${y}" stroke="rgba(255,255,255,0.04)" stroke-width="1"/>`;
                  }).join('')}
                  <!-- Zero line -->
                  <line x1="0" x2="${CHART_W}" y1="${zeroY}" y2="${zeroY}" stroke="rgba(248,249,254,0.15)" stroke-width="1" stroke-dasharray="6,4"/>
                  
                  <!-- Forecast zone shading -->
                  <rect x="${forecastStartX}" y="0" width="${CHART_W - forecastStartX}" height="${CHART_H}" fill="rgba(255,177,72,0.03)" />
                  <line x1="${forecastStartX}" x2="${forecastStartX}" y1="0" y2="${CHART_H}" stroke="rgba(255,177,72,0.25)" stroke-width="1" stroke-dasharray="4,4"/>
                  <text x="${forecastStartX + 8}" y="14" fill="rgba(255,177,72,0.5)" font-size="10" font-family="var(--font-mono)">FORECAST</text>
                </svg>

                <!-- GDP area fill (full) -->
                <svg width="${CHART_W}" height="${CHART_H}" style="position:absolute;inset:0" preserveAspectRatio="none">
                  <defs>
                    <linearGradient id="gdp-fill" x1="0" x2="0" y1="0" y2="1">
                      <stop offset="0%" stop-color="#84ADFF" stop-opacity="0.15"/>
                      <stop offset="100%" stop-color="#84ADFF" stop-opacity="0.01"/>
                    </linearGradient>
                    <linearGradient id="gdp-forecast-fill" x1="0" x2="0" y1="0" y2="1">
                      <stop offset="0%" stop-color="#FFB148" stop-opacity="0.10"/>
                      <stop offset="100%" stop-color="#FFB148" stop-opacity="0.01"/>
                    </linearGradient>
                  </defs>
                  <path d="${gdpAreaPath}" fill="url(#gdp-fill)"/>
                  
                  <!-- Actual GDP line (solid) -->
                  <path d="${actualPath}" fill="none" stroke="#84ADFF" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
                  
                  <!-- Forecast GDP line (dashed, amber) -->
                  <path d="${forecastPath}" fill="none" stroke="#FFB148" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" stroke-dasharray="8,5" opacity="0.85"/>

                  <!-- Peak marker -->
                  <circle cx="${peakX}" cy="${peakY}" r="5" fill="#69F6B8" stroke="#0D0F14" stroke-width="2"/>
                  <text x="${peakX}" y="${peakY - 12}" fill="#69F6B8" font-size="11" font-family="var(--font-mono)" text-anchor="middle" font-weight="600">${trough.peak.value}%</text>
                  <text x="${peakX}" y="${peakY - 24}" fill="rgba(169,171,175,0.6)" font-size="9" font-family="var(--font-mono)" text-anchor="middle">${trough.peak.label}</text>

                  <!-- Trough marker -->
                  <circle cx="${troughX}" cy="${troughY}" r="5" fill="#FF716C" stroke="#0D0F14" stroke-width="2"/>
                  <text x="${troughX}" y="${troughY + 20}" fill="#FF716C" font-size="11" font-family="var(--font-mono)" text-anchor="middle" font-weight="600">${trough.trough.value}%</text>
                  <text x="${troughX}" y="${troughY + 32}" fill="rgba(169,171,175,0.6)" font-size="9" font-family="var(--font-mono)" text-anchor="middle">${trough.trough.label} ▼ Trough</text>

                  <!-- Decline arrow -->
                  <line x1="${peakX}" x2="${troughX}" y1="${peakY}" y2="${troughY}" stroke="rgba(255,113,108,0.3)" stroke-width="1" stroke-dasharray="3,3"/>
                  
                  ${indexSvg}
                </svg>

                <!-- Crosshair line -->
                <div class="chart-crosshair" id="chart-crosshair"></div>

                <!-- Tooltip -->
                <div class="chart-tooltip" id="chart-tooltip"></div>

                <!-- X-axis labels -->
                <div style="position:absolute;bottom:-20px;left:0;width:${CHART_W}px;height:20px;font-size:9px;font-family:monospace;color:rgba(169,171,175,0.5)">
                  ${xLabels}
                </div>
              </div>
            </div>

            <!-- Right Y axis: Index scale (only when overlays enabled) -->
            ${rightAxisHtml}
          </div>

          <div class="chart-footer" style="margin-top:1.75rem">
            <div class="live-indicator">
              <span class="live-dot">
                <span class="live-dot-ping"></span>
                <span class="live-dot-solid"></span>
              </span>
              <span class="live-text">DGBAS Data Synchronized</span>
            </div>
            <span class="source-text">Source: 主計總處 • 臺灣經濟成長率_20260406.xlsx</span>
          </div>
        </div>
      </section>

      <!-- Trough Analysis Section -->
      <section style="margin-bottom:2.5rem">
        <h4 class="section-label">GDP YoY 觸底分析</h4>
        <div class="insight-card" style="flex-direction:column;align-items:stretch;gap:1rem;padding:1.25rem">
          <div style="display:flex;align-items:center;gap:0.75rem;margin-bottom:0.5rem">
            <span class="material-symbols-outlined" style="color:#FF716C;font-size:28px">query_stats</span>
            <div>
              <h5 style="font-size:15px;font-weight:600;color:var(--on-surface);margin:0">${cyclePhase}</h5>
              <p style="font-size:12px;color:var(--on-surface-variant);margin:4px 0 0">
                本波景氣高峰 ${trough.peak.label} (${trough.peak.value}%) → 預計谷底 ${trough.trough.label} (${trough.trough.value}%)，
                降幅 ${trough.declineMagnitude} 個百分點，歷時 ${trough.declineQuarters} 季
              </p>
            </div>
          </div>

          <!-- Forecast Table -->
          <div style="overflow-x:auto">
            <table style="width:100%;border-collapse:collapse">
              <thead>
                <tr style="border-bottom:1px solid rgba(255,255,255,0.08)">
                  <th style="padding:8px 12px;text-align:left;font-size:11px;font-weight:500;color:var(--on-surface-variant);text-transform:uppercase;letter-spacing:0.5px">Quarter</th>
                  <th style="padding:8px 12px;text-align:left;font-size:11px;font-weight:500;color:var(--on-surface-variant);text-transform:uppercase;letter-spacing:0.5px">YoY %</th>
                  <th style="padding:8px 12px;text-align:left;font-size:11px;font-weight:500;color:var(--on-surface-variant);text-transform:uppercase;letter-spacing:0.5px">SAAR %</th>
                </tr>
              </thead>
              <tbody>
                ${saarRows}
              </tbody>
            </table>
          </div>

          <div class="analysis-insights-stack" style="display:flex;gap:0.75rem;flex-wrap:wrap;margin-top:0.5rem">
            <div style="flex:1;min-width:200px;padding:0.75rem;border-radius:8px;background:rgba(255,113,108,0.06);border:1px solid rgba(255,113,108,0.12)">
              <p style="font-size:10px;text-transform:uppercase;letter-spacing:0.5px;color:rgba(255,113,108,0.7);margin:0 0 4px">YoY 減速趨勢</p>
              <p style="font-size:13px;color:var(--on-surface);margin:0">YoY 從 ${trough.peak.value}% 快速收斂至 ${trough.trough.value}%，主因高基期效應。SAAR 持續在 1.6%-3.4% 低檔，顯示經濟動能趨緩。</p>
            </div>
            <div style="flex:1;min-width:200px;padding:0.75rem;border-radius:8px;background:rgba(132,173,255,0.06);border:1px solid rgba(132,173,255,0.12)">
              <p style="font-size:10px;text-transform:uppercase;letter-spacing:0.5px;color:rgba(132,173,255,0.7);margin:0 0 4px">投資意涵</p>
              <p style="font-size:13px;color:var(--on-surface);margin:0">2026Q4 觸底後，若 SAAR 回升，YoY 將於 2027 年逐步反彈。歷史經驗顯示觸底前 1-2 季為股市佈局窗口。</p>
            </div>
          </div>
        </div>
      </section>

      <!-- Institutional Sentiment -->
      <section style="margin-bottom:2.5rem">
        <h4 class="section-label">Institutional Sentiment</h4>
        <div>
          <div class="insight-card">
            <div class="insight-img-wrap">
              <img class="insight-img" alt="Financial District" src="https://lh3.googleusercontent.com/aida-public/AB6AXuBLup5UdDdY5FpJMxet-5XNdyiLLkvJHWZ_cnyoppnN-RgUGdaVj7XJc2DSQg2Onb2C8LmyKqNqwZM1wF2VEcRtuTkGBh4S9E136Gn6HYG7B8G_mNdDfnzGmwUHlyGPehbMBv8Ur79ICKJW8Zuj5S0_akHIxzZW6SxwyVLXwgLtP3EiwJ0uKhl10eryTzpn-aaSl0CW377R40_QX2XhEhtqOZLgCgxnbpjE64HnsM26AUz4hFTdplquV9WdmGVMB9LXWnqwNACT0Z0F" />
              <div class="insight-img-ring"></div>
            </div>
            <div class="insight-content">
              <h5 class="insight-title">最新主計處預測</h5>
              <p class="insight-desc">2026 年 GDP YoY 預估從 Q1 的 11.46% 逐季下滑至 Q4 的 3.09%。主因 2025 年高基期效應消退，SAAR 季增年率降至 1.66%，顯示實質動能放緩。</p>
            </div>
            <span class="material-symbols-outlined insight-chevron">chevron_right</span>
          </div>
          <div class="insight-card">
            <div class="insight-img-wrap">
              <img class="insight-img" alt="Stock Market Data" src="https://lh3.googleusercontent.com/aida-public/AB6AXCrmFeorQ5MpqhtohmcvL3PiS4HtGcEQzESjoZsFiyOiJBAC0U6VvCTzqO1eWkBep8ocopThB6k3bTWUQ__L1lcsqC2-f9_DH8-4YAu8mljRX25a6EvNWnLLRg1inbnswVwmuKMNPNqEaKO7W2ADRNW8CwLGkUoP1g2mbuoz-ZJkLuyZ9RI7JTk_Xw7LV4nNW7FaXAyFPmGsiFqOhJvcBe5V-xaCpjfwSOWliAOO-Dd4I3JVqInwl3OzWQEVsPzzb1Q1zcrTfqKDOyt" />
              <div class="insight-img-ring"></div>
            </div>
            <div class="insight-content">
              <h5 class="insight-title">觸底佈局訊號</h5>
              <p class="insight-desc">歷史上 YoY 觸底前 1-2 季，台股與費半指數往往率先反映復甦預期。建議關注 2026Q3-Q4 的 SAAR 轉折訊號。</p>
            </div>
            <span class="material-symbols-outlined insight-chevron">chevron_right</span>
          </div>
        </div>
      </section>
    </div>
  `;
}

// Quarter labels for tooltip
const QUARTER_NAMES = ['Q1', 'Q2', 'Q3', 'Q4'];

/** Call after rendering macro page to attach tooltip interactivity */
export function initChartTooltip() {
  const area = document.querySelector('.chart-interactive-area');
  const crosshair = document.getElementById('chart-crosshair');
  const tooltip = document.getElementById('chart-tooltip');
  if (!area || !crosshair || !tooltip) return;

  const config = getConfig();
  const enabledIndices = Object.entries(config.indices)
    .filter(([, v]) => v)
    .map(([k]) => k);

  const qSpacing = CHART_W / (TOTAL_QUARTERS - 1);

  area.addEventListener('mousemove', (e) => {
    const rect = area.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const qIndex = Math.round(x / qSpacing);
    
    if (qIndex < 0 || qIndex >= TOTAL_QUARTERS) {
      crosshair.style.display = 'none';
      tooltip.style.display = 'none';
      return;
    }

    const snapX = Math.round(qIndex * qSpacing);

    // Crosshair
    crosshair.style.display = 'block';
    crosshair.style.left = `${snapX}px`;

    const targetYear = GDP_START_YEAR + Math.floor(qIndex / 4);
    const targetQ = (qIndex % 4) + 1;
    const isForecast = qIndex >= FORECAST_START_INDEX;
    
    let rows = `<div class="tt-date">${targetYear} Q${targetQ}${isForecast ? ' <span style="color:#FFB148;font-size:9px">[預測]</span>' : ''}</div>`;
    
    // GDP YoY
    const gdpVal = GDP_YOY[qIndex];
    if (gdpVal !== undefined && gdpVal !== null) {
      const dotColor = isForecast ? '#FFB148' : '#84ADFF';
      rows += `<div class="tt-row"><span class="tt-dot" style="background:${dotColor}"></span><span class="tt-label">GDP YoY</span><span class="tt-val">${gdpVal > 0 ? '+' : ''}${parseFloat(gdpVal).toFixed(2)}%</span></div>`;
    }

    enabledIndices.forEach((key) => {
      const info = INDEX_DATA[key];
      if (!info) return;

      const val = info.data[qIndex];
      
      if (val !== undefined && val !== null) {
        const formatted = val >= 1000 ? Math.round(val).toLocaleString() : val.toFixed(1);
        rows += `<div class="tt-row"><span class="tt-dot" style="background:${info.color}"></span><span class="tt-label">${info.label}</span><span class="tt-val">${formatted}</span></div>`;
      }
    });

    tooltip.innerHTML = rows;
    tooltip.style.display = 'block';

    // Position tooltip — flip side if near right edge
    const ttWidth = tooltip.offsetWidth;
    if (snapX + 16 + ttWidth > CHART_W) {
      tooltip.style.left = `${snapX - ttWidth - 12}px`;
    } else {
      tooltip.style.left = `${snapX + 16}px`;
    }
    tooltip.style.top = '8px';
  });

  area.addEventListener('mouseleave', () => {
    crosshair.style.display = 'none';
    tooltip.style.display = 'none';
  });
}
