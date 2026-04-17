
import './style.css';
import { renderConfigPage } from './pages/config.js';
import { renderMarketsPage } from './pages/markets.js';
import { renderAnalysisPage } from './pages/analysis.js';
import { renderPortfolioPage } from './pages/portfolio.js';
import { renderDataPage, initDataPage } from './pages/data.js';
import { renderRelativeStrengthPage, initRelativeStrengthPage } from './pages/relativeStrength.js';
import { getConfig, saveConfig, resetConfig } from './store.js';

const app = document.getElementById('app');

function getRoute() {
  const hash = window.location.hash.replace('#', '') || 'strength';
  return hash;
}

function render() {
  const route = getRoute();
  app.innerHTML = `
    ${renderHeader(route)}
    <div id="page-content"></div>
    ${renderBottomNav(route)}
    <div class="glow glow-primary"></div>
    <div class="glow glow-secondary"></div>
  `;

  const pageContent = document.getElementById('page-content');
  switch (route) {
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
    case 'strength':
      pageContent.innerHTML = renderRelativeStrengthPage();
      initRelativeStrengthPage();
      break;
    default:
      pageContent.innerHTML = renderRelativeStrengthPage();
      initRelativeStrengthPage();
  }

  attachNavListeners();
  attachConfigActions();
}

function renderHeader(route) {
  return `
    <header class="app-header glass-header">
      <div class="header-left">
        <span class="material-symbols-outlined header-icon">insights</span>
        <h1 class="header-title">${route === 'config' ? 'Chart Configuration' : 'The Sovereign Analyst'}</h1>
      </div>
      <button class="icon-btn" aria-label="Settings" id="btn-settings">
        <span class="material-symbols-outlined" style="font-size:1.5rem">settings</span>
      </button>
    </header>
  `;
}

function renderBottomNav(route) {
  if (route === 'config') return '';
  const items = [
    { id: 'markets', icon: 'query_stats', label: 'Markets' },
    { id: 'strength', icon: 'bolt', label: 'Strength' },
    { id: 'analysis', icon: 'auto_graph', label: 'Analysis' },
    { id: 'portfolio', icon: 'account_balance_wallet', label: 'Portfolio' },
    { id: 'data', icon: 'table_rows', label: 'Data' },
  ];

  return `
    <nav class="bottom-nav glass-effect">
      ${items.map(item => `
        <button class="nav-item ${route === item.id ? 'active' : ''}" data-route="${item.id}">
          <span class="material-symbols-outlined">${item.icon}</span>
          <span class="nav-label">${item.label}</span>
        </button>
      `).join('')}
    </nav>
  `;
}

function attachNavListeners() {
  document.querySelectorAll('.nav-item').forEach(btn => {
    btn.addEventListener('click', () => { window.location.hash = btn.dataset.route; });
  });
  const settingsBtn = document.getElementById('btn-settings');
  if (settingsBtn) { settingsBtn.addEventListener('click', (e) => { e.preventDefault(); window.location.hash = 'config'; }); }
}

function attachConfigActions() {
  const saveBtn = document.getElementById('btn-config-save');
  if (saveBtn) {
    saveBtn.addEventListener('click', (e) => {
      e.preventDefault();
      const config = getConfig();
      document.querySelectorAll('.toggle-switch').forEach((toggle) => {
        const section = toggle.dataset.section;
        const key = toggle.dataset.key;
        if (section && key && config[section] !== undefined) {
          config[section][key] = toggle.checked;
        }
      });
      saveConfig(config);
      window.location.hash = 'strength';
    });
  }
}

window.addEventListener('hashchange', render);
render();
