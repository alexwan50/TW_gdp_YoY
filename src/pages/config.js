import { getConfig } from '../store.js';

export function renderConfigPage() {
  const config = getConfig();

  const marketIndices = [
    { key: 'sp500', icon: 'analytics', name: 'S&P 500', desc: 'US Equity Benchmark', color: 'primary' },
    { key: 'taiex', icon: 'query_stats', name: 'TAIEX', desc: 'Taiwan Cap Weighted Index', color: 'primary' },
    { key: 'vix', icon: 'insights', name: 'VIX Index', desc: 'Volatility "Fear" Gauge', color: 'primary' },
    { key: 'sox', icon: 'memory', name: 'SOX Index', desc: 'Philadelphia Semiconductor', color: 'primary' },
  ];

  const technicalIndicators = [
    { key: 'rsi', icon: 'waves', name: 'RSI (14)', desc: 'Relative Strength Index', color: 'tertiary' },
    { key: 'ma', icon: 'show_chart', name: 'Moving Average', desc: '50/200 Day Golden Cross', color: 'primary' },
  ];

  const macroData = [
    { key: 'interestRate', icon: 'account_balance', name: 'Interest Rate', desc: 'Central Bank Benchmark', color: 'secondary' },
    { key: 'inflation', icon: 'trending_up', name: 'Inflation Rate', desc: 'CPI Trend Analysis', color: 'primary' },
  ];

  function renderItems(items, section) {
    return items
      .map(
        (item) => `
      <label class="config-item">
        <div class="config-item-left">
          <div class="config-icon-box ${item.color}">
            <span class="material-symbols-outlined">${item.icon}</span>
          </div>
          <div>
            <p class="config-item-name">${item.name}</p>
            <p class="config-item-desc">${item.desc}</p>
          </div>
        </div>
        <div style="position:relative;display:flex;align-items:center">
          <input class="toggle-switch" type="checkbox" data-section="${section}" data-key="${item.key}" ${config[section][item.key] ? 'checked' : ''} />
          <div class="toggle-bg"></div>
        </div>
      </label>
    `
      )
      .join('');
  }

  return `
    <div class="page config-page" id="page-config" style="padding-bottom:10rem">
      <!-- Market Indices -->
      <section class="config-section">
        <div class="config-section-header">
          <h2 class="config-section-title">Market Indices</h2>
          <span class="config-section-badge primary">Real-Time Overlay</span>
        </div>
        <div class="config-card">
          ${renderItems(marketIndices, 'indices')}
        </div>
      </section>

      <!-- Technical Indicators -->
      <section class="config-section">
        <div class="config-section-header">
          <h2 class="config-section-title">Technical Indicators</h2>
          <span class="config-section-badge tertiary">Algorithmic</span>
        </div>
        <div class="config-card">
          ${renderItems(technicalIndicators, 'indicators')}
        </div>
      </section>

      <!-- Macro Data -->
      <section class="config-section">
        <div class="config-section-header">
          <h2 class="config-section-title">Macro Data</h2>
          <span class="config-section-badge secondary">Institutional</span>
        </div>
        <div class="config-card">
          ${renderItems(macroData, 'macro')}
        </div>
      </section>
    </div>

    <!-- Bottom Fixed Actions -->
    <div class="config-actions">
      <div class="config-actions-inner">
        <button class="btn-reset" id="btn-config-reset">Reset to Default</button>
        <button class="btn-save" id="btn-config-save">Save Changes</button>
      </div>
    </div>
  `;
}
