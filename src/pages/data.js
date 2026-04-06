import { getGdpData, saveCustomGdpData, clearCustomGdpData } from '../store.js';
import { INDEX_DATA } from '../gdpData.js';

export function renderDataPage() {
  const gdpData = getGdpData();
  
  const rows = gdpData.map((val, idx) => {
    const year = 2006 + Math.floor(idx / 4);
    const q = ['Q1', 'Q2', 'Q3', 'Q4'][idx % 4];
    
    let gdpHtml = '<td style="padding:0.75rem;border-bottom:1px solid rgba(255,255,255,0.05);text-align:right">-</td>';
    if (val !== undefined && val !== null) {
      gdpHtml = `<td style="padding:0.75rem;border-bottom:1px solid rgba(255,255,255,0.05);text-align:right;font-family:monospace;font-weight:600;color:${val > 0 ? 'var(--secondary)' : 'var(--error)'}">${val > 0 ? '+' : ''}${parseFloat(val).toFixed(2)}%</td>`;
    }

    const sp500 = INDEX_DATA.sp500.data[idx] !== undefined ? INDEX_DATA.sp500.data[idx].toLocaleString() : '-';
    const taiex = INDEX_DATA.taiex.data[idx] !== undefined ? INDEX_DATA.taiex.data[idx].toLocaleString() : '-';
    const vix = INDEX_DATA.vix.data[idx] !== undefined ? INDEX_DATA.vix.data[idx].toFixed(2) : '-';
    const sox = INDEX_DATA.sox.data[idx] !== undefined ? INDEX_DATA.sox.data[idx].toLocaleString() : '-';

    return `
      <tr>
        <td style="padding:0.75rem;border-bottom:1px solid rgba(255,255,255,0.05);color:var(--on-surface-variant)">${year} ${q}</td>
        ${gdpHtml}
        <td style="padding:0.75rem;border-bottom:1px solid rgba(255,255,255,0.05);text-align:right;font-family:monospace;color:rgba(255,255,255,0.7)">${sp500}</td>
        <td style="padding:0.75rem;border-bottom:1px solid rgba(255,255,255,0.05);text-align:right;font-family:monospace;color:rgba(255,255,255,0.7)">${taiex}</td>
        <td style="padding:0.75rem;border-bottom:1px solid rgba(255,255,255,0.05);text-align:right;font-family:monospace;color:rgba(255,255,255,0.7)">${vix}</td>
        <td style="padding:0.75rem;border-bottom:1px solid rgba(255,255,255,0.05);text-align:right;font-family:monospace;color:rgba(255,255,255,0.7)">${sox}</td>
      </tr>
    `;
  }).reverse().join('');

  return `
    <div class="page" id="page-data">
      <section style="display:flex;justify-content:space-between;align-items:flex-end;margin-bottom:2rem">
        <div>
          <p class="briefing-label">Intelligence Hub</p>
          <h2 class="page-title">Data Synchronization</h2>
        </div>
        <button class="setup-btn" id="btn-reset-data" style="background:rgba(255,113,108,0.1);color:#FF716C">
          <span class="material-symbols-outlined">restart_alt</span> Reset to Default
        </button>
      </section>

      <!-- Sync Zone -->
      <div class="config-card" style="margin-bottom:2rem;border:2px dashed rgba(132,173,255,0.2);text-align:center;padding:3rem 2rem">
        <span class="material-symbols-outlined" style="font-size:3rem;color:var(--primary);margin-bottom:1rem">upload_file</span>
        <h4 style="margin-bottom:0.5rem">Import DGBAS Excel</h4>
        <p style="font-size:12px;color:var(--on-surface-variant);margin-bottom:1.5rem">
          Visit <a href="https://nstatdb.dgbas.gov.tw/dgbasall/webMain.aspx?sys=210&funid=A018101010" target="_blank" style="color:var(--primary)">DGBAS</a>, 
          select "經濟成長率(%)" as Excel, and drop the file here.
        </p>
        <input type="file" id="gdp-upload" accept=".xlsx" style="display:none">
        <button class="setup-btn" onclick="document.getElementById('gdp-upload').click()">
          Select Report.xlsx
        </button>
      </div>

      <div class="header-actions" style="margin-bottom:1.5rem">
        <h3>Historical Records</h3>
      </div>
      
      <div class="config-card" style="max-height: 50vh; overflow-y: auto; padding: 0.5rem">
        <table style="width:100%;border-collapse:collapse;font-size:12px">
          <thead>
            <tr>
              <th style="text-align:left;padding:0.75rem;color:var(--primary);font-weight:700;text-transform:uppercase;letter-spacing:0.1em;border-bottom:1px solid rgba(132,173,255,0.2);position:sticky;top:0;background:rgba(22,26,30,0.95);backdrop-filter:blur(8px)">Quarter</th>
              <th style="text-align:right;padding:0.75rem;color:var(--primary);font-weight:700;text-transform:uppercase;letter-spacing:0.1em;border-bottom:1px solid rgba(132,173,255,0.2);position:sticky;top:0;background:rgba(22,26,30,0.95);backdrop-filter:blur(8px)">GDP YoY</th>
              <th style="text-align:right;padding:0.75rem;color:var(--primary);font-weight:700;text-transform:uppercase;letter-spacing:0.1em;border-bottom:1px solid rgba(132,173,255,0.2);position:sticky;top:0;background:rgba(22,26,30,0.95);backdrop-filter:blur(8px)">S&P 500</th>
              <th style="text-align:right;padding:0.75rem;color:var(--primary);font-weight:700;text-transform:uppercase;letter-spacing:0.1em;border-bottom:1px solid rgba(132,173,255,0.2);position:sticky;top:0;background:rgba(22,26,30,0.95);backdrop-filter:blur(8px)">TAIEX</th>
              <th style="text-align:right;padding:0.75rem;color:var(--primary);font-weight:700;text-transform:uppercase;letter-spacing:0.1em;border-bottom:1px solid rgba(132,173,255,0.2);position:sticky;top:0;background:rgba(22,26,30,0.95);backdrop-filter:blur(8px)">VIX</th>
              <th style="text-align:right;padding:0.75rem;color:var(--primary);font-weight:700;text-transform:uppercase;letter-spacing:0.1em;border-bottom:1px solid rgba(132,173,255,0.2);position:sticky;top:0;background:rgba(22,26,30,0.95);backdrop-filter:blur(8px)">SOX</th>
            </tr>
          </thead>
          <tbody>
            ${rows}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

/** Attach listeners for Excel upload */
export function initDataPage() {
  const uploadInput = document.getElementById('gdp-upload');
  const resetBtn = document.getElementById('btn-reset-data');
  if (!uploadInput) return;

  uploadInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = new Uint8Array(event.target.result);
        const workbook = window.XLSX.read(data, { type: 'array' });
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
        const json = window.XLSX.utils.sheet_to_json(firstSheet, { header: 1 });

        // Parse DGBAS format:
        // Columns usually: [0] 統計期 (95年第1季), [1] 指標數值 (經濟成長率)
        // Find the start year 2006 (95年)
        const years = {};
        json.forEach(row => {
          if (!row[0]) return;
          const label = String(row[0]);
          // Expect "YYY年第Q季" or "YYY年"
          const match = label.match(/(\d+)年第(\d+)季/);
          if (match) {
            const rocYear = parseInt(match[1]);
            const q = parseInt(match[2]);
            const westYear = rocYear + 1911;
            const val = parseFloat(row[1]);
            if (!isNaN(val)) {
              if (!years[westYear]) years[westYear] = [null, null, null, null];
              years[westYear][q - 1] = val;
            }
          }
        });

        // Flatten to array starting from 2006 to 2026
        const newGdpArray = [];
        for (let y = 2006; y <= 2026; y++) {
          if (years[y]) {
            newGdpArray.push(...years[y]);
          } else {
            newGdpArray.push(null, null, null, null);
          }
        }

        saveCustomGdpData(newGdpArray);
        alert('Data synchronized successfully. Refreshing view...');
        window.location.reload();
      } catch (err) {
        console.error('Parsing failed', err);
        alert('Failed to parse Excel. Please ensure the format matches the DGBAS report.');
      }
    };
    reader.readAsArrayBuffer(file);
  });

  resetBtn?.addEventListener('click', () => {
    if (confirm('Clear custom data and revert to system defaults?')) {
      clearCustomGdpData();
      window.location.reload();
    }
  });
}
