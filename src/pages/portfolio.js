export function renderPortfolioPage() {
  return `
    <div class="page" id="page-portfolio">
      <section style="margin-bottom:2rem">
        <p class="briefing-label">Asset Allocation</p>
        <h2 class="page-title">Portfolio</h2>
      </section>

      <!-- Total Value -->
      <section style="margin-bottom:2rem">
        <div class="chart-container" style="text-align:center;padding:2rem 1.25rem">
          <p class="bento-label" style="margin-bottom:0.5rem">Total Portfolio Value</p>
          <p style="font-family:'Manrope',sans-serif;font-size:2.5rem;font-weight:800;color:var(--on-surface);letter-spacing:-0.02em">$1,247,832</p>
          <div style="display:flex;align-items:center;justify-content:center;gap:0.5rem;margin-top:0.75rem">
            <span class="material-symbols-outlined" style="font-size:16px;color:var(--secondary);font-variation-settings:'FILL' 1">arrow_upward</span>
            <span style="font-size:14px;font-weight:600;color:var(--secondary)">+12.4% YTD</span>
          </div>
        </div>
      </section>

      <!-- Allocation -->
      <section style="margin-bottom:1.5rem">
        <h4 class="section-label">Allocation Breakdown</h4>
        <div class="config-card">
          <div class="config-item" style="cursor:default">
            <div class="config-item-left">
              <div class="config-icon-box primary">
                <span class="material-symbols-outlined">analytics</span>
              </div>
              <div>
                <p class="config-item-name">US Equities</p>
                <p class="config-item-desc">S&P 500 ETF • VOO</p>
              </div>
            </div>
            <div style="text-align:right">
              <p class="config-item-name">45%</p>
              <p class="config-item-desc" style="color:var(--secondary)">$561,524</p>
            </div>
          </div>
          <div class="config-item" style="cursor:default">
            <div class="config-item-left">
              <div class="config-icon-box secondary">
                <span class="material-symbols-outlined">memory</span>
              </div>
              <div>
                <p class="config-item-name">Taiwan Semi</p>
                <p class="config-item-desc">TSM • Individual Stock</p>
              </div>
            </div>
            <div style="text-align:right">
              <p class="config-item-name">25%</p>
              <p class="config-item-desc" style="color:var(--secondary)">$311,958</p>
            </div>
          </div>
          <div class="config-item" style="cursor:default">
            <div class="config-item-left">
              <div class="config-icon-box tertiary">
                <span class="material-symbols-outlined">account_balance</span>
              </div>
              <div>
                <p class="config-item-name">Bonds</p>
                <p class="config-item-desc">Treasury • TLT</p>
              </div>
            </div>
            <div style="text-align:right">
              <p class="config-item-name">20%</p>
              <p class="config-item-desc" style="color:var(--error)">$249,566</p>
            </div>
          </div>
          <div class="config-item" style="cursor:default">
            <div class="config-item-left">
              <div class="config-icon-box primary" style="background:rgba(255,177,72,0.1);color:var(--tertiary);border-color:rgba(255,177,72,0.2)">
                <span class="material-symbols-outlined">currency_bitcoin</span>
              </div>
              <div>
                <p class="config-item-name">Crypto</p>
                <p class="config-item-desc">BTC/ETH • Digital</p>
              </div>
            </div>
            <div style="text-align:right">
              <p class="config-item-name">10%</p>
              <p class="config-item-desc" style="color:var(--secondary)">$124,783</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  `;
}
