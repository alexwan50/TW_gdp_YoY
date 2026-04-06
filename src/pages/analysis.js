import { getConfig } from '../store.js';

export function renderAnalysisPage() {
  const config = getConfig();
  const rsiEnabled = config.indicators.rsi;
  const maEnabled = config.indicators.ma;

  return `
    <div class="page" id="page-analysis">
      <section style="margin-bottom:2rem">
        <p class="briefing-label">Quantitative Engine</p>
        <h2 class="page-title">Analysis</h2>
      </section>

      <!-- RSI Card -->
      <section style="margin-bottom:1.5rem;opacity:${rsiEnabled ? 1 : 0.4}">
        <div class="chart-container" style="position:relative">
          ${!rsiEnabled ? '<div style="position:absolute;top:0.75rem;right:0.75rem;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.1em;color:var(--on-surface-variant);background:rgba(255,255,255,0.05);padding:0.25rem 0.5rem;border-radius:9999px">Disabled</div>' : ''}
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:1rem">
            <div>
              <h3 class="chart-title" style="font-size:1rem">RSI (14) — S&P 500</h3>
              <p class="chart-subtitle">Relative Strength Index</p>
            </div>
            ${rsiEnabled ? '<div style="padding:0.375rem 0.75rem;border-radius:9999px;font-size:10px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;background:rgba(105,246,184,0.15);color:var(--secondary)">Neutral 54.2</div>' : ''}
          </div>
          <div style="position:relative;height:8rem;overflow:hidden;border-radius:0.5rem">
            <svg width="100%" height="100%" viewBox="0 0 400 128" preserveAspectRatio="none">
              <defs>
                <linearGradient id="rsi-grad" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="0%" stop-color="#ffb148" stop-opacity="0.1"/>
                  <stop offset="100%" stop-color="#ffb148" stop-opacity="0"/>
                </linearGradient>
              </defs>
              <rect x="0" y="0" width="400" height="38" fill="rgba(255,113,108,0.05)"/>
              <rect x="0" y="90" width="400" height="38" fill="rgba(105,246,184,0.05)"/>
              <line x1="0" x2="400" y1="38" y2="38" stroke="var(--error)" stroke-opacity="0.2" stroke-dasharray="4,4"/>
              <line x1="0" x2="400" y1="90" y2="90" stroke="var(--secondary)" stroke-opacity="0.2" stroke-dasharray="4,4"/>
              <path d="M0,64 Q20,58 40,52 T80,48 T120,55 T160,62 T200,58 T240,50 T280,56 T320,60 T360,54 T400,56" fill="none" stroke="var(--tertiary)" stroke-width="2" stroke-linecap="round"/>
              <path d="M0,64 Q20,58 40,52 T80,48 T120,55 T160,62 T200,58 T240,50 T280,56 T320,60 T360,54 T400,56 V128 H0 Z" fill="url(#rsi-grad)"/>
            </svg>
            <div style="position:absolute;top:36px;right:0.5rem;font-size:9px;color:var(--error);opacity:0.6;font-family:monospace">70</div>
            <div style="position:absolute;top:88px;right:0.5rem;font-size:9px;color:var(--secondary);opacity:0.6;font-family:monospace">30</div>
          </div>
        </div>
      </section>

      <!-- MA Signal -->
      <section style="margin-bottom:1.5rem;opacity:${maEnabled ? 1 : 0.4}">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:1.25rem">
          <h4 class="section-label" style="margin-bottom:0">Moving Average Signals</h4>
          ${!maEnabled ? '<span style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.1em;color:var(--on-surface-variant);background:rgba(255,255,255,0.05);padding:0.25rem 0.5rem;border-radius:9999px">Disabled</span>' : ''}
        </div>
        <div class="config-card">
          <div class="config-item" style="cursor:default">
            <div class="config-item-left">
              <div class="config-icon-box primary">
                <span class="material-symbols-outlined">show_chart</span>
              </div>
              <div>
                <p class="config-item-name">50-Day MA</p>
                <p class="config-item-desc">Short-term momentum</p>
              </div>
            </div>
            <div style="text-align:right">
              <p class="config-item-name" style="color:var(--secondary)">5,198</p>
              <p class="config-item-desc" style="color:var(--secondary)">Above</p>
            </div>
          </div>
          <div class="config-item" style="cursor:default">
            <div class="config-item-left">
              <div class="config-icon-box tertiary">
                <span class="material-symbols-outlined">timeline</span>
              </div>
              <div>
                <p class="config-item-name">200-Day MA</p>
                <p class="config-item-desc">Long-term trend</p>
              </div>
            </div>
            <div style="text-align:right">
              <p class="config-item-name" style="color:var(--secondary)">4,876</p>
              <p class="config-item-desc" style="color:var(--secondary)">Above</p>
            </div>
          </div>
          <div class="config-item" style="cursor:default">
            <div class="config-item-left">
              <div class="config-icon-box secondary">
                <span class="material-symbols-outlined">auto_awesome</span>
              </div>
              <div>
                <p class="config-item-name">Golden Cross</p>
                <p class="config-item-desc">50 MA > 200 MA</p>
              </div>
            </div>
            <div style="text-align:right">
              <p style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.1em;color:var(--secondary);background:rgba(105,246,184,0.1);padding:0.25rem 0.5rem;border-radius:9999px">Bullish</p>
            </div>
          </div>
        </div>
      </section>

      <!-- Enable hint if anything is disabled -->
      ${(!rsiEnabled || !maEnabled) ? `
        <div style="text-align:center;padding:1rem;opacity:0.5">
          <p style="font-size:11px;color:var(--on-surface-variant)">
            <span class="material-symbols-outlined" style="font-size:14px;vertical-align:middle;margin-right:4px">info</span>
            Enable indicators in <a href="#config" style="color:var(--primary);text-decoration:none;font-weight:600">Chart Configuration</a> to view full analysis
          </p>
        </div>
      ` : ''}
    </div>
  `;
}
