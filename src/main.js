import './style.css';
import { renderMacroPage, initChartTooltip } from './pages/macro.js';
import { renderConfigPage } from './pages/config.js';
import { renderMarketsPage } from './pages/markets.js';
import { renderAnalysisPage } from './pages/analysis.js';
import { renderPortfolioPage } from './pages/portfolio.js';
import { renderDataPage, initDataPage } from './pages/data.js';
import { getConfig, saveConfig, resetConfig } from './store.js';

const app = document.getElementById('app');

// Simple hash-based router
function getRoute() {
  const hash = window.location.hash.replace('#', '') || 'macro';
  return hash;
}

function render() {
  const route = getRoute();

  // Build shell
  app.innerHTML = `
    ${renderHeader(route)}
    <div id="page-content"></div>
    ${renderBottomNav(route)}
    <div class="glow glow-primary"></div>
    <div class="glow glow-secondary"></div>
  `;

  // Render page content
  const pageContent = document.getElementById('page-content');
  switch (route) {
    case 'macro':
      pageContent.innerHTML = renderMacroPage();
      initChartTooltip();
      break;
    case 'config':
      pageContent.innerHTML = renderConfigPage();
      break;
    case 'markets':
      pageContent.innerHTML = renderMarketsPage();
      break;
    case 'analysis':
      pageContent.innerHTML = renderAnalysisPage();
      break;
    case 'portfolio':
      pageContent.innerHTML = renderPortfolioPage();
      break;
    case 'data':
      pageContent.innerHTML = renderDataPage();
      initDataPage();
      break;
    default:
      pageContent.innerHTML = renderMacroPage();
      initChartTooltip();
  }

  // Attach event listeners
  attachNavListeners();
  attachToggleListeners();
  attachConfigActions();
}

function renderHeader(route) {
  if (route === 'config') {
    return `
      <header class="app-header glass-header">
        <div class="header-left">
          <button class="icon-btn" id="btn-back" aria-label="Go back">
            <span class="material-symbols-outlined" style="font-size:1.5rem">arrow_back</span>
          </button>
          <h1 class="header-title">Chart Configuration</h1>
        </div>
        <div style="display:flex;align-items:center;gap:0.5rem">
          <span class="terminal-badge">Sovereign Terminal</span>
          <button class="icon-btn" aria-label="Settings">
            <span class="material-symbols-outlined" style="font-size:1.5rem">settings</span>
          </button>
        </div>
      </header>
    `;
  }

  return `
    <header class="app-header glass-header">
      <div class="header-left">
        <span class="material-symbols-outlined header-icon">insights</span>
        <h1 class="header-title">The Sovereign Analyst</h1>
      </div>
      <button class="icon-btn" aria-label="Settings" id="btn-setup">
        <span class="material-symbols-outlined" style="font-size:1.5rem">settings</span>
      </button>
    </header>
  `;
}

function renderBottomNav(route) {
  if (route === 'config') return ''; // No bottom nav on config page

  const items = [
    { id: 'macro', icon: 'analytics', label: 'Macro' },
    { id: 'markets', icon: 'query_stats', label: 'Markets' },
    { id: 'analysis', icon: 'auto_graph', label: 'Analysis' },
    { id: 'portfolio', icon: 'account_balance_wallet', label: 'Portfolio' },
    { id: 'data', icon: 'table_rows', label: 'Data' },
  ];

  return `
    <nav class="bottom-nav glass-effect">
      ${items
        .map(
          (item) => `
        <button class="nav-item ${route === item.id ? 'active' : ''}" data-route="${item.id}">
          <span class="material-symbols-outlined">${item.icon}</span>
          <span class="nav-label">${item.label}</span>
        </button>
      `
        )
        .join('')}
    </nav>
  `;
}

function attachNavListeners() {
  // Bottom nav
  document.querySelectorAll('.nav-item').forEach((btn) => {
    btn.addEventListener('click', () => {
      const route = btn.dataset.route;
      window.location.hash = route;
    });
  });

  // Back button on config
  const backBtn = document.getElementById('btn-back');
  if (backBtn) {
    backBtn.addEventListener('click', () => {
      window.location.hash = 'macro';
    });
  }

  // Setup button on macro page
  const setupBtn = document.getElementById('btn-setup');
  if (setupBtn) {
    setupBtn.addEventListener('click', (e) => {
      e.preventDefault();
      window.location.hash = 'config';
    });
  }
}

function attachToggleListeners() {
  // Native checkbox toggles handle their own state
}

function attachConfigActions() {
  const resetBtn = document.getElementById('btn-config-reset');
  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      resetConfig();
      // Re-render config page to reflect defaults
      const pageContent = document.getElementById('page-content');
      pageContent.innerHTML = renderConfigPage();
      attachToggleListeners();
      attachConfigActions();
    });
  }

  const saveBtn = document.getElementById('btn-config-save');
  if (saveBtn) {
    saveBtn.addEventListener('click', (e) => {
      e.preventDefault();
      // Read all toggle states from DOM and save
      const config = getConfig();
      document.querySelectorAll('.toggle-switch').forEach((toggle) => {
        const section = toggle.dataset.section;
        const key = toggle.dataset.key;
        if (section && key && config[section] !== undefined) {
          config[section][key] = toggle.checked;
        }
      });
      saveConfig(config);
      window.location.hash = 'macro';
    });
  }
}

// Listen for hash changes
window.addEventListener('hashchange', render);

// Initial render
render();
