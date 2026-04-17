
import { rsData } from '../rs_data.js';
import { backtestData } from '../backtest_data.js';

function drawSparkline(history) {
  if (!history || history.length < 2) return '';
  const width = 120;
  const height = 30;
  const allValues = history.flatMap(h => [h.s, h.l]);
  let min = Math.min(...allValues);
  let max = Math.max(...allValues);
  if (min > -5) min = -5;
  if (max < 5) max = 5;
  const range = max - min;
  const mapX = (idx) => (idx / (history.length - 1)) * width;
  const mapY = (val) => height - ((val - min) / range) * height;
  const zeroY = mapY(0);
  const pathLong = history.map((p, i) => `${i === 0 ? 'M' : 'L'} ${mapX(i)} ${mapY(p.l)}`).join(' ');
  const pathShort = history.map((p, i) => `${i === 0 ? 'M' : 'L'} ${mapX(i)} ${mapY(p.s)}`).join(' ');
  return `
    <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" style="overflow:visible">
      <line x1="0" y1="${zeroY}" x2="${width}" y2="${zeroY}" stroke="rgba(255,255,255,0.3)" stroke-width="1" stroke-dasharray="2,2" />
      <text x="-8" y="${zeroY + 3}" fill="rgba(255,255,255,0.5)" font-size="8" font-family="monospace">0</text>
      <path d="${pathLong}" fill="none" stroke="rgba(132,173,255,0.4)" stroke-width="2.5" stroke-linejoin="round" />
      <path d="${pathShort}" fill="none" stroke="var(--secondary)" stroke-width="1.2" stroke-linejoin="round" />
    </svg>
  `;
}

function drawDualEquityCurve(curve, curveHold, color) {
  if (!curve || curve.length < 2) return '';
  const ch = curveHold && curveHold.length === curve.length ? curveHold : curve;
  const width = 800;
  const height = 140;
  const allVals = [...curve.map(c => c.value), ...ch.map(c => c.value)];
  let min = Math.min(...allVals);
  let max = Math.max(...allVals);
  const pad = (max - min) * 0.08 || 1000;
  min -= pad; max += pad;
  const range = (max - min) || 1;
  const mapX = (i) => (i / (curve.length - 1)) * width;
  const mapY = (v) => height - ((v - min) / range) * height;
  const baseline = mapY(100000);

  // Paths
  const pathActual = curve.map((c, i) => `${i === 0 ? 'M' : 'L'} ${mapX(i)} ${mapY(c.value)}`).join(' ');
  const pathHold = ch.map((c, i) => `${i === 0 ? 'M' : 'L'} ${mapX(i)} ${mapY(c.value)}`).join(' ');

  // Filled area between curves — split into green (sold right) and red (missed gain) segments
  let greenArea = ''; let redArea = '';
  for (let i = 0; i < curve.length - 1; i++) {
    const x0 = mapX(i), x1 = mapX(i + 1);
    const aY0 = mapY(curve[i].value), aY1 = mapY(curve[i+1].value);
    const hY0 = mapY(ch[i].value), hY1 = mapY(ch[i+1].value);
    const holdAbove = ch[i].value > curve[i].value;
    const poly = `${x0},${aY0} ${x0},${hY0} ${x1},${hY1} ${x1},${aY1}`;
    if (holdAbove) {
      redArea += `<polygon points="${poly}" fill="rgba(255,80,80,0.15)" />`;
    } else {
      greenArea += `<polygon points="${poly}" fill="rgba(80,255,140,0.12)" />`;
    }
  }

  const holdEndVal = ch[ch.length - 1]?.value || 0;
  const actualEndVal = curve[curve.length - 1]?.value || 0;
  const diff = holdEndVal - actualEndVal;
  const diffStr = diff >= 0 ? `+$${Math.round(diff).toLocaleString()}` : `-$${Math.round(Math.abs(diff)).toLocaleString()}`;
  const diffColor = diff >= 0 ? '#FF5050' : '#50FF8C';
  const diffLabel = diff >= 0 ? '持有反而更好' : '賣出策略正確';

  return `
    <div style="position:relative; width:100%; height:100%">
      <div style="position:absolute; top:4px; right:8px; display:flex; gap:16px; font-size:10px; font-family:monospace; z-index:2">
        <span style="color:${color}">── 實際策略</span>
        <span style="color:rgba(255,255,255,0.4)">- - 若不賣 (假設)</span>
        <span style="color:${diffColor}; font-weight:700">${diffLabel} ${diffStr}</span>
      </div>
      <svg width="100%" height="100%" viewBox="0 -8 ${width} ${height + 24}" preserveAspectRatio="none" style="overflow:visible;">
        <line x1="0" y1="${baseline}" x2="${width}" y2="${baseline}" stroke="rgba(255,255,255,0.15)" stroke-dasharray="4,4" />
        ${greenArea}
        ${redArea}
        <path d="${pathHold}" fill="none" stroke="rgba(255,255,255,0.3)" stroke-width="1.5" stroke-dasharray="5,4" vector-effect="non-scaling-stroke" />
        <path d="${pathActual}" fill="none" stroke="${color}" stroke-width="2.5" vector-effect="non-scaling-stroke" />
      </svg>
    </div>
  `;
}


export function renderRelativeStrengthPage() {
  try {
    if (!rsData || !backtestData) return `<div style="padding:2rem">Loading...</div>`;
    const { market, stocks, generated_at } = rsData;
    const marketCards = Object.entries(market || {}).map(([name, stats]) => `
      <div class="config-card" style="padding:1rem; border-left:4px solid ${stats.change_5d < 0 ? 'var(--error)' : 'var(--secondary)'}">
        <p style="font-size:10px; color:var(--on-surface-variant); margin-bottom:0.25rem">${name}</p>
        <div style="display:flex; justify-content:space-between; align-items:flex-end">
          <span style="font-size:1.25rem; font-weight:700; font-family:monospace">${stats.price?.toLocaleString()}</span>
          <span style="font-size:11px; font-family:monospace; color:${stats.change_5d < 0 ? 'var(--error)' : 'var(--secondary)'}">${stats.change_5d > 0 ? '▲' : '▼'} ${Math.abs(stats.change_5d)}%</span>
        </div>
      </div>
    `).join('');

    const leaderboardRows = (stocks || []).map((stock, idx) => `
      <tr style="opacity: ${stock.above_ma ? 1 : 0.5}">
        <td style="padding:1rem 0.75rem;border-bottom:1px solid rgba(255,255,255,0.05)">
          <div style="display:flex;align-items:center;gap:0.75rem">
            <div style="width:1.5rem;height:1.5rem;border-radius:0.4rem;background:rgba(132,173,255,0.1);display:flex;align-items:center;justify-content:center;font-size:9px;font-weight:700;color:var(--primary)">${idx + 1}</div>
            <div><p style="font-size:13px;font-weight:600;margin:0">${stock.equity}</p><p style="font-size:10px;color:var(--on-surface-variant);margin:0">${(stock.name || "").substring(0,25)}</p></div>
          </div>
        </td>
        <td style="padding:1rem 0.75rem;text-align:right"><span style="font-family:monospace;font-weight:700">${stock.rs_score?.toFixed(2)}</span></td>
        <td style="padding:1rem 0.75rem;text-align:right"><span style="font-family:monospace;font-weight:700">${stock.rs_score_short?.toFixed(2)}</span></td>
        <td style="padding:1rem 0.75rem;text-align:right"><span style="font-family:monospace;font-weight:700">${stock.rs_score_micro?.toFixed(2)}</span></td>
        <td style="padding:1rem 0.75rem;text-align:center">${drawSparkline(stock.history)}</td>
      </tr>
    `).join('');

    const colors = {'I': '#00BFFF', 'J': '#FF69B4', 'K': '#32CD32', 'L': '#FFA500', 'M': '#8A2BE2', 'N': '#FF4500', 'O': '#00FA9A'};

    const strategiesHTML = Object.entries(backtestData || {}).map(([key, data], index) => {
      const trades = data.recent_trades || [];
      const earliestEntries = {};
      trades.forEach(t => { if (!earliestEntries[t.slot] || t.entry < earliestEntries[t.slot]) { earliestEntries[t.slot] = t.entry; } });
      const myColor = colors[key] || 'var(--primary)';
      return `
      <div class="strategy-tab-content" id="strat-${key}" style="display:${index === 0 ? 'block' : 'none'};">
        <div style="display:grid; grid-template-columns: 1fr 450px; gap:1.5rem;">
          <div>
            <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:1rem">
              <h4 style="font-size:18px; font-weight:700; color:${myColor}; margin:0">${data.name}</h4>
              <p style="font-size:10px; color:var(--on-surface-variant)">Capital: $100,000</p>
            </div>
            <div style="display:grid; grid-template-columns: repeat(4, 1fr); gap:1rem; margin-bottom:1.5rem">
              <div class="bento-card" style="padding:1rem; background:rgba(255,255,255,0.03)"><p style="font-size:10px; margin:0">Total Trades</p><p style="font-size:1.5rem; font-weight:700; margin:0">${data.total_trades}</p></div>
              <div class="bento-card" style="padding:1rem; background:rgba(255,255,255,0.03)"><p style="font-size:10px; margin:0">Win Rate</p><p style="font-size:1.5rem; font-weight:700; color:var(--secondary); margin:0">${data.win_rate}%</p></div>
              <div class="bento-card" style="padding:1rem; background:rgba(255,255,255,0.05)"><p style="font-size:10px; margin:0">PnL</p><p style="font-size:1.5rem; font-weight:700; color:${data.total_pnl >= 0 ? myColor : 'var(--error)'}; margin:0">$${data.total_pnl.toLocaleString()}</p></div>
              <div class="bento-card" style="padding:1rem; background:rgba(132,173,255,0.1)"><p style="font-size:10px; margin:0">Net Return</p><p style="font-size:1.5rem; font-weight:700; margin:0">${((data.total_pnl/100000)*100).toFixed(1)}%</p></div>
            </div>
            <div style="height:160px; background:rgba(0,0,0,0.2); border-radius:8px; padding:6px 8px; position:relative">${drawDualEquityCurve(data.curve, data.curve_hold, myColor)}</div>
          </div>
          <div>
            <p style="font-size:10px; font-weight:700; color:var(--on-surface-variant); margin-bottom:0.75rem; text-transform:uppercase; letter-spacing:1px">Full Wave Ledger</p>
            <div style="max-height:450px; overflow-y:auto; border:1px solid rgba(255,255,255,0.1); border-radius:6px; background:rgba(0,0,0,0.2)">
              <table style="width:100%; border-collapse:collapse; font-size:11px">
                <thead style="position:sticky; top:0; background:rgba(30,35,45,0.95); z-index:10">
                  <tr style="color:${myColor}">
                    <th style="padding:8px; text-align:left">Slot</th>
                    <th style="padding:8px; text-align:left">Ticker</th>
                    <th style="padding:8px; text-align:right">Time</th>
                    <th style="padding:8px; text-align:right">Price</th>
                    <th style="padding:8px; text-align:right">PnL</th>
                  </tr>
                </thead>
                <tbody>
                  ${trades.map(t => {
                    const isFirst = t.entry === earliestEntries[t.slot];
                    const slotDisplay = isFirst ? t.slot : `(${t.slot})`;
                    return `
                    <tr style="border-bottom:1px solid rgba(255,255,255,0.05)">
                      <td style="padding:8px; color:${isFirst ? myColor : 'var(--secondary)'}; font-family:monospace">${slotDisplay}</td>
                      <td style="padding:8px; font-weight:700">
                        ${t.ticker}
                        ${t.style ? `<br><span style="font-size:9px; padding:2px 4px; border-radius:3px; background:rgba(255,255,255,0.05); color:${t.style === 'Value' ? '#8A2BE2' : t.style === 'Growth' ? '#FF4500' : 'var(--on-surface-variant)'}">${t.style}</span>` : ''}
                      </td>
                      <td style="padding:8px; text-align:right; color:var(--on-surface-variant); font-size:10px">${t.entry}<br>${t.exit}</td>
                      <td style="padding:8px; text-align:right; font-family:monospace">$${t.entry_p}<br>$${t.exit_p}</td>
                      <td style="padding:8px; text-align:right; font-family:monospace; color:${t.pnl >= 0 ? 'var(--secondary)' : 'var(--error)'}">$${Math.round(t.pnl).toLocaleString()}<br>${t.pct}%</td>
                    </tr>`;
                  }).join('')}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
      `;
    }).join('');

    return `
      <div class="page" id="page-rs">
        <section style="margin-bottom:2rem">
          <div style="display:flex; justify-content:space-between; align-items:flex-end; margin-bottom:1rem">
            <div><p class="briefing-label">Macro Momentum Engine • Optimized Strategy</p><h2 class="page-title">Macro Wave Dashboard</h2></div>
          </div>

          <div id="strategy-lab" class="config-card" style="display:block; padding:1.5rem; background:rgba(3,8,22,0.95); border:1px solid var(--primary);">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1.5rem">
              <h3 style="font-size:16px; font-weight:700"><span class="material-symbols-outlined" style="color:var(--primary)">dashboard</span> Portfolio Alpha Analysis</h3>
              <div style="display:flex; gap:0.25rem; background:rgba(255,255,255,0.05); padding:0.25rem; border-radius:6px">
                ${Object.keys(backtestData).map((key, i) => `<button class="strat-tab-btn" data-target="strat-${key}" style="background:${i === 0 ? colors[key] : 'transparent'}; color:${i === 0 ? '#000' : 'var(--on-surface-variant)'}">${key}</button>`).join('')}
              </div>
            </div>
            <div style="height:220px; width:100%; position:relative; margin-bottom:2rem">${drawMasterCurveHacked(backtestData, colors)}</div>
            ${strategiesHTML}
          </div>
        </section>

        <section style="margin-bottom:2rem"><p class="section-label">Market Context</p><div style="display:grid; grid-template-columns:1fr 1fr; gap:1rem">${marketCards}</div></section>

        <div class="header-actions" style="margin-bottom:1rem"><h3 class="section-label">Real-time Leaderboard</h3></div>
        <div class="config-card" style="padding:0;overflow-x:auto;">
          <table style="width:100%;border-collapse:collapse;min-width:700px">
            <thead><tr style="background:rgba(255,255,255,0.02)">
              <th style="padding:0.75rem;text-align:left;font-size:10px;text-transform:uppercase">Asset</th>
              <th style="padding:0.75rem;text-align:right;font-size:10px;text-transform:uppercase">MRS (200)</th>
              <th style="padding:0.75rem;text-align:right;font-size:10px;text-transform:uppercase">MRS (50)</th>
              <th style="padding:0.75rem;text-align:right;font-size:10px;text-transform:uppercase">MRS (5)</th>
              <th style="padding:0.75rem;text-align:center;font-size:10px;text-transform:uppercase">Path (120D)</th>
            </tr></thead>
            <tbody>${leaderboardRows}</tbody>
          </table>
        </div>
      </div>
    `;
  } catch (err) {
    return `<div style="padding:2rem; color:var(--error)"><h3>UI Crash</h3><pre>${err.stack}</pre></div>`;
  }
}

function drawMasterCurveHacked(dataMap, colors) {
  const width = 800;
  const height = 180; 
  const svgHeight = 220;
  let allValues = [];
  Object.values(dataMap).forEach(d => { if(d.curve) allValues = allValues.concat(d.curve.map(c => c.value)); });
  if(allValues.length === 0) return '';
  let min = Math.min(...allValues);
  let max = Math.max(...allValues);
  const range = (max - min) || 1;
  min -= range * 0.1;
  max += range * 0.1;
  const refKey = 'I';
  const refCurve = (dataMap[refKey] && dataMap[refKey].curve) ? dataMap[refKey].curve : (Object.values(dataMap)[0].curve || []);
  if (refCurve.length < 2) return '';
  const mapX = (idx) => (idx / (refCurve.length - 1)) * width;
  const mapY = (val) => height - ((val - min) / ((max - min) || 1)) * height;
  const zeroY = mapY(100000); 
  let pathsHTML = '';
  Object.entries(dataMap).forEach(([key, d]) => {
      if(!d.curve || d.curve.length < 2) return;
      const path = d.curve.map((c, i) => `${i === 0 ? 'M' : 'L'} ${mapX(i)} ${mapY(c.value)}`).join(' ');
      pathsHTML += `<path class="master-curve curve-${key}" d="${path}" fill="none" stroke="${colors[key] || 'var(--primary)'}" stroke-width="2" style="mix-blend-mode: screen;"/>`;
  });
  return `
    <svg viewBox="0 -10 ${width} ${svgHeight}" style="width:100%; height:100%; display:block; overflow:visible">
      <line x1="0" y1="${zeroY}" x2="${width}" y2="${zeroY}" stroke="rgba(255,255,255,0.2)" stroke-width="1" stroke-dasharray="4" />
      ${pathsHTML}
      <text x="0" y="${height + 15}" fill="rgba(255,255,255,0.5)" font-size="10" font-family="monospace">${refCurve[0].date}</text>
      <text x="${width}" y="${height + 15}" fill="rgba(255,255,255,0.5)" font-size="10" font-family="monospace" text-anchor="end">${refCurve[refCurve.length - 1].date}</text>
    </svg>
  `;
}

export function initRelativeStrengthPage() {
  const customColors = {'I': '#00BFFF', 'J': '#FF69B4', 'K': '#32CD32', 'L': '#FFA500', 'M': '#8A2BE2', 'N': '#FF4500', 'O': '#00FA9A'};
  document.querySelectorAll('.strat-tab-btn').forEach(tab => {
    tab.addEventListener('click', (e) => {
      document.querySelectorAll('.strat-tab-btn').forEach(t => { t.style.background = 'transparent'; t.style.color = 'var(--on-surface-variant)'; });
      const targetId = e.target.getAttribute('data-target');
      const stratKey = targetId.split('-')[1];
      document.querySelectorAll('.strategy-tab-content').forEach(c => { c.style.display = c.id === targetId ? 'block' : 'none'; });
      e.target.style.background = customColors[stratKey] || 'var(--primary)';
      e.target.style.color = '#000';
    });
  });
}
