export function renderMarketsPage() {
  return `
    <div class="page" id="page-markets">
      <section style="margin-bottom:2rem">
        <p class="briefing-label">Live Data Feed</p>
        <h2 class="page-title">Markets</h2>
      </section>

      <!-- Market Cards -->
      <section class="bento-grid">
        <div class="bento-card card-gradient">
          <div style="z-index:10">
            <p class="bento-label">S&P 500</p>
            <p class="bento-value info">5,234</p>
          </div>
          <div class="bento-footer">
            <span class="material-symbols-outlined" style="color:var(--secondary)">arrow_upward</span>
            <span class="bento-footer-text">+0.45%</span>
          </div>
          <div class="bento-bg-icon">
            <span class="material-symbols-outlined" style="color:var(--primary)">analytics</span>
          </div>
        </div>

        <div class="bento-card card-gradient">
          <div style="z-index:10">
            <p class="bento-label">TAIEX</p>
            <p class="bento-value positive">20,417</p>
          </div>
          <div class="bento-footer">
            <span class="material-symbols-outlined" style="color:var(--secondary)">arrow_upward</span>
            <span class="bento-footer-text">+1.22%</span>
          </div>
          <div class="bento-bg-icon">
            <span class="material-symbols-outlined" style="color:var(--secondary)">query_stats</span>
          </div>
        </div>

        <div class="bento-card card-gradient">
          <div style="z-index:10">
            <p class="bento-label">NASDAQ</p>
            <p class="bento-value info">16,782</p>
          </div>
          <div class="bento-footer">
            <span class="material-symbols-outlined" style="color:var(--secondary)">arrow_upward</span>
            <span class="bento-footer-text">+0.67%</span>
          </div>
          <div class="bento-bg-icon">
            <span class="material-symbols-outlined" style="color:var(--primary)">show_chart</span>
          </div>
        </div>

        <div class="bento-card card-gradient">
          <div style="z-index:10">
            <p class="bento-label">SOX</p>
            <p class="bento-value dim">4,891</p>
          </div>
          <div class="bento-footer">
            <span class="material-symbols-outlined" style="color:var(--error)">arrow_downward</span>
            <span class="bento-footer-text" style="color:var(--error)">-0.32%</span>
          </div>
          <div class="bento-bg-icon">
            <span class="material-symbols-outlined" style="color:var(--tertiary)">memory</span>
          </div>
        </div>
      </section>

      <!-- Watchlist -->
      <section style="margin-top:1rem">
        <h4 class="section-label">Watchlist</h4>
        <div class="config-card">
          <div class="config-item" style="cursor:default">
            <div class="config-item-left">
              <div class="config-icon-box primary">
                <span class="material-symbols-outlined">currency_bitcoin</span>
              </div>
              <div>
                <p class="config-item-name">BTC/USD</p>
                <p class="config-item-desc">Bitcoin • Digital Asset</p>
              </div>
            </div>
            <div style="text-align:right">
              <p class="config-item-name" style="color:var(--secondary)">$67,432</p>
              <p class="config-item-desc" style="color:var(--secondary)">+2.14%</p>
            </div>
          </div>
          <div class="config-item" style="cursor:default">
            <div class="config-item-left">
              <div class="config-icon-box tertiary">
                <span class="material-symbols-outlined">oil_barrel</span>
              </div>
              <div>
                <p class="config-item-name">Crude Oil</p>
                <p class="config-item-desc">WTI • Commodity</p>
              </div>
            </div>
            <div style="text-align:right">
              <p class="config-item-name" style="color:var(--error)">$78.34</p>
              <p class="config-item-desc" style="color:var(--error)">-1.05%</p>
            </div>
          </div>
          <div class="config-item" style="cursor:default">
            <div class="config-item-left">
              <div class="config-icon-box secondary">
                <span class="material-symbols-outlined">public</span>
              </div>
              <div>
                <p class="config-item-name">Gold</p>
                <p class="config-item-desc">XAU/USD • Safe Haven</p>
              </div>
            </div>
            <div style="text-align:right">
              <p class="config-item-name" style="color:var(--secondary)">$2,341</p>
              <p class="config-item-desc" style="color:var(--secondary)">+0.88%</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  `;
}
