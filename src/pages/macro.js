import { getConfig, getGdpData } from '../store.js';
import { INDEX_DATA } from '../gdpData.js';

const GDP_YOY = getGdpData();

// X-axis labels: one per year
const YEAR_LABELS = [];
for (let y = 2006; y <= 2026; y++) YEAR_LABELS.push(`'${String(y).slice(2)}`);

// Chart dimensions
const CHART_W = 1680; // 84 points (quarters) * 20px
const CHART_H = 256;
const GDP_MIN = -12;
const GDP_MAX = 16;
const GDP_RANGE = GDP_MAX - GDP_MIN; // 28

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

function buildGDPPoints() {
  return GDP_YOY
    .map((v, i) => (v !== undefined && v !== null) ? [Math.round((i / 83) * CHART_W), Math.round(gdpToY(v))] : null)
    .filter(p => p !== null);
}

function buildIndexPoints(key) {
  const info = INDEX_DATA[key];
  if (!info) return [];

  const totalQuarters = 83;
  
  return info.data
    .map((v, i) => (v !== undefined && v !== null) ? [Math.round((i / totalQuarters) * CHART_W), Math.round(indexToY(v, info.min, info.max))] : null)
    .filter(p => p !== null);
}

export function renderMacroPage() {
  const config = getConfig();
  const enabledIndices = Object.entries(config.indices)
    .filter(([, v]) => v)
    .map(([k]) => k);

  // GDP path (always)
  const gdpPoints = buildGDPPoints();
  const gdpPath = buildPath(gdpPoints);
  const gdpAreaPath = gdpPath + ` L${CHART_W},${CHART_H} L0,${CHART_H} Z`;

  // Zero line Y position
  const zeroY = Math.round(gdpToY(0));

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

  // X-axis: show a label every 4 quarters (1 per year)
  const xLabels = YEAR_LABELS.map((label, i) => {
    const x = Math.round((i * 4) / (GDP_YOY.length - 1) * CHART_W);
    return `<span style="position:absolute;left:${x}px;transform:translateX(-50%)">${label}</span>`;
  }).join('');

  // Macro bento cards
  const interestActive = config.macro.interestRate;
  const inflationActive = config.macro.inflation;

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
            <p class="bento-label">GDP Forecast</p>
            <p class="bento-value positive">3.2%</p>
          </div>
          <div class="bento-footer">
            <span class="material-symbols-outlined" style="color:var(--secondary)">arrow_upward</span>
            <span class="bento-footer-text">Bullish Outlook</span>
          </div>
          <div class="bento-bg-icon"><span class="material-symbols-outlined" style="color:var(--primary)">trending_up</span></div>
        </div>

        <div class="bento-card card-gradient" style="opacity:${inflationActive ? 1 : 0.5}">
          <div style="z-index:10">
            <p class="bento-label">Inflation Rate</p>
            <p class="bento-value info">4.1%</p>
          </div>
          <div class="bento-footer">
            <span class="material-symbols-outlined" style="color:var(--primary)">info</span>
            <span class="bento-footer-text">Above Target${!inflationActive ? ' • Off' : ''}</span>
          </div>
          <div class="bento-bg-icon"><span class="material-symbols-outlined" style="color:var(--primary)">water_drop</span></div>
        </div>

        <div class="bento-card card-gradient" style="opacity:${interestActive ? 1 : 0.5}">
          <div style="z-index:10">
            <p class="bento-label">Interest Rate</p>
            <p class="bento-value neutral">5.25%</p>
          </div>
          <div class="bento-footer">
            <span class="material-symbols-outlined" style="color:var(--tertiary)">pause</span>
            <span class="bento-footer-text">Terminal Rate${!interestActive ? ' • Off' : ''}</span>
          </div>
          <div class="bento-bg-icon"><span class="material-symbols-outlined" style="color:var(--tertiary)">account_balance</span></div>
        </div>

        <div class="bento-card card-gradient" style="opacity:${config.indices.vix ? 1 : 0.5}">
          <div style="z-index:10">
            <p class="bento-label">VIX Index</p>
            <p class="bento-value dim">14.82</p>
          </div>
          <div class="bento-footer">
            <span class="material-symbols-outlined" style="color:var(--secondary-dim)">check_circle</span>
            <span class="bento-footer-text">Low Volatility${!config.indices.vix ? ' • Off' : ''}</span>
          </div>
          <div class="bento-bg-icon"><span class="material-symbols-outlined" style="color:var(--secondary)">waves</span></div>
        </div>
      </section>

      <!-- Chart Section -->
      <section class="chart-section">
        <div class="chart-header">
          <div style="max-width:65%">
            <h3 class="chart-title">Taiwan 20-Year Quarterly GDP</h3>
            <p class="chart-subtitle">YoY Percentage Change • 2006–2026</p>
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
                <span class="legend-text" style="color:var(--on-surface)">GDP YoY</span>
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
                </svg>

                <!-- GDP area + line -->
                <svg width="${CHART_W}" height="${CHART_H}" style="position:absolute;inset:0" preserveAspectRatio="none">
                  <defs>
                    <linearGradient id="gdp-fill" x1="0" x2="0" y1="0" y2="1">
                      <stop offset="0%" stop-color="#84ADFF" stop-opacity="0.15"/>
                      <stop offset="100%" stop-color="#84ADFF" stop-opacity="0.01"/>
                    </linearGradient>
                  </defs>
                  <path d="${gdpAreaPath}" fill="url(#gdp-fill)"/>
                  <path d="${gdpPath}" fill="none" stroke="#84ADFF" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
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
              <span class="live-text">Live Market Synchronized</span>
            </div>
            <span class="source-text">Source: DGBAS Taiwan</span>
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
              <p class="insight-desc">Taiwan's 20-year GDP trajectory remains anchored to high-tech manufacturing exports...</p>
            </div>
            <span class="material-symbols-outlined insight-chevron">chevron_right</span>
          </div>
          <div class="insight-card">
            <div class="insight-img-wrap">
              <img class="insight-img" alt="Stock Market Data" src="https://lh3.googleusercontent.com/aida-public/AB6AXCrmFeorQ5MpqhtohmcvL3PiS4HtGcEQzESjoZsFiyOiJBAC0U6VvCTzqO1eWkBep8ocopThB6k3bTWUQ__L1lcsqC2-f9_DH8-4YAu8mljRX25a6EvNWnLLRg1inbnswVwmuKMNPNqEaKO7W2ADRNW8CwLGkUoP1g2mbuoz-ZJkLuyZ9RI7JTk_Xw7LV4nNW7FaXAyFPmGsiFqOhJvcBe5V-xaCpjfwSOWliAOO-Dd4I3JVqInwl3OzWQEVsPzzb1Q1zcrTfqKDOyt" />
              <div class="insight-img-ring"></div>
            </div>
            <div class="insight-content">
              <h5 class="insight-title">最新國際財經消息</h5>
              <p class="insight-desc">Central bank commentary suggests a 'higher for longer' stance into Q4 2024...</p>
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

function getDateLabel(index) {
  const year = 2006 + Math.floor(index / 4);
  const q = QUARTER_NAMES[index % 4];
  return `${q} ${year}`;
}

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

  const totalQuarters = GDP_YOY.length;
  const qSpacing = CHART_W / (totalQuarters - 1);

  area.addEventListener('mousemove', (e) => {
    const rect = area.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const qIndex = Math.round(x / qSpacing);
    
    if (qIndex < 0 || qIndex >= totalQuarters) {
      crosshair.style.display = 'none';
      tooltip.style.display = 'none';
      return;
    }

    const snapX = Math.round(qIndex * qSpacing);

    // Crosshair
    crosshair.style.display = 'block';
    crosshair.style.left = `${snapX}px`;

    const targetYear = 2006 + Math.floor(qIndex / 4);
    const targetQ = (qIndex % 4) + 1;
    
    let rows = `<div class="tt-date">${targetYear} Q${targetQ}</div>`;
    
    // GDP YoY
    const gdpVal = GDP_YOY[qIndex];
    if (gdpVal !== undefined && gdpVal !== null) {
      rows += `<div class="tt-row"><span class="tt-dot" style="background:#84ADFF"></span><span class="tt-label">GDP YoY</span><span class="tt-val">${gdpVal > 0 ? '+' : ''}${parseFloat(gdpVal).toFixed(2)}%</span></div>`;
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
