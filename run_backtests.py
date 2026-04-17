
import pandas as pd
import json
import os
import numpy as np
from datetime import datetime
from trading_strategies import get_strategy_definitions

CACHE_FILE = 'rs_cache_v2.json'
MACRO_FILE = 'macro_cache.json'
OUTPUT_FILE = 'src/backtest_data.js'
FAV_FILE = 'myFavorite.xlsx'
PORTFOLIO_CASH = 100000

def main():
    if not os.path.exists(CACHE_FILE): return
    with open(CACHE_FILE, 'r') as f: cache = json.load(f)
    
    macro_cache = {}
    if os.path.exists(MACRO_FILE):
        with open(MACRO_FILE, 'r') as f: macro_cache = json.load(f)
    sorted_m_dates = sorted(list(macro_cache.keys()))

    STRATS = get_strategy_definitions({})
    
    # Load Sector and ExpReturn% Mapping
    ticker_to_sector = {}
    ticker_to_exprtn = {}
    if os.path.exists(FAV_FILE):
        try:
            df_fav = pd.read_excel(FAV_FILE)
            for idx, row in df_fav.iterrows():
                b_t = str(row['Equity']).strip()
                if 'SuperSector' in df_fav.columns:
                    sec = str(row['SuperSector']).strip()
                    if pd.notna(sec) and sec != 'nan' and sec != '':
                        ticker_to_sector[b_t] = sec
                if 'ExpReturn%' in df_fav.columns:
                    exp = row['ExpReturn%']
                    if pd.notna(exp):
                        ticker_to_exprtn[b_t] = float(exp)
        except Exception as e:
            print("Error loading myFavorite.xlsx:", e)

    gdp_raw = [6.05, 5.64, 7.19, 4.33, 5.64, 7.12, 7.97, 6.58, 7.66, 5.66, -1.39, -7.36, -7.87, -5.92, -1.14, 8.58, 11.55, 12.02, 11.54, 6.34, 6.72, 4.16, 3.28, 0.89, 1.09, 1.04, 2.18, 4.48, 1.5, 2.68, 1.95, 3.73, 4.69, 4.92, 4.9, 4.38, 4.79, 1.89, -0.28, -0.2, -0.09, 1.69, 3.0, 3.92, 3.72, 2.79, 3.98, 4.12, 3.43, 3.43, 2.52, 2.33, 2.08, 2.96, 3.41, 3.68, 3.21, 0.55, 4.23, 5.48, 9.62, 8.28, 4.32, 5.1, 3.85, 3.51, 4.06, -0.43, -3.58, 1.42, 1.56, 4.74, 7.16, 5.33, 4.66, 4.13, 5.54, 7.71, 8.42, 12.65, 11.46, 9.3, 7.76, 3.09]
    gdp_s = pd.Series(gdp_raw, index=[datetime(2006 + (i//4), (i%4)*3+1, 1) for i in range(len(gdp_raw))]).sort_index()

    portfolios = {}
    for sid in ["I", "J", "K", "L", "M", "N", "O"]:
        m_slots = 100 if sid in ["L", "M", "N", "O"] else 50
        portfolios[sid] = {
            "name": STRATS[sid]["name"], "rules": STRATS[sid]["rules"],
            "cash": PORTFOLIO_CASH, "holdings": {}, "trades": [], 
            "curve": [], "curve_hold": [],   # <-- dual curves
            "paper_holdings": {},            # <-- ghost positions after exit
            "paper_cash": PORTFOLIO_CASH,    # <-- paper cash (also exits are applied to paper)
            "max_slots": m_slots, "available_slots": list(range(1, m_slots + 1))
        }

    print("Pre-calculating...")
    all_dates = set(); ticker_dfs = {}
    full_ticker_to_sector = {}
    full_ticker_to_exprtn = {}
    
    for t, p_dict in cache.get("prices", {}).items():
        if not p_dict: continue
        t_p = pd.Series(p_dict).sort_index(); t_p.index = pd.to_datetime(t_p.index).normalize()
        v_dict = cache.get("volumes", {}).get(t, {})
        t_v = pd.Series(v_dict).sort_index() if v_dict else pd.Series(0, index=t_p.index)
        t_v.index = pd.to_datetime(t_v.index).normalize()
        df = pd.DataFrame({'Close': t_p, 'Volume': t_v}).dropna()
        ticker_dfs[t] = df
        all_dates.update(pd.to_datetime(df.index).strftime('%Y-%m-%d'))
        
        base_t = t.split('.')[0]
        if base_t in ticker_to_sector: full_ticker_to_sector[t] = ticker_to_sector[base_t]
        elif t in ticker_to_sector: full_ticker_to_sector[t] = ticker_to_sector[t]
        else: full_ticker_to_sector[t] = "Unknown / Unclassified"
        
        if base_t in ticker_to_exprtn: full_ticker_to_exprtn[t] = ticker_to_exprtn[base_t]
        elif t in ticker_to_exprtn: full_ticker_to_exprtn[t] = ticker_to_exprtn[t]

    df_p_c = pd.DataFrame({t: df['Close'] for t, df in ticker_dfs.items()}).ffill()
    df_p_v = pd.DataFrame({t: df['Volume'] for t, df in ticker_dfs.items()})
    sorted_dates = sorted(list(all_dates))

    print("Simulating Pure Macro Wave...")
    for dt_s in sorted_dates:
        dt = pd.to_datetime(dt_s)
        c_prices = df_p_c.loc[dt] if dt in df_p_c.index else pd.Series()
        c_volumes = df_p_v.loc[dt] if dt in df_p_v.index else pd.Series()
        g_idx = gdp_s.index[gdp_s.index <= dt]
        gdp_now = gdp_s.loc[g_idx[-1]] if len(g_idx) > 0 else 0
        gdp_prev = gdp_s.loc[g_idx[-2]] if len(g_idx) >= 2 else 0
        
        m_idx = [d for d in sorted_m_dates if d <= dt_s]
        cpi_yoy = macro_cache[m_idx[-1]]["cpi_yoy"] if m_idx else 2.0
        
        gdp_increasing = gdp_now > gdp_prev
        gdp_decreasing = gdp_now < gdp_prev
        
        daily_vols = c_volumes.dropna()
        valid_vols = daily_vols[daily_vols > 0].sort_values(ascending=False)
        total_valid_vols = len(valid_vols)

        for sid, port in portfolios.items():
            # === ACTUAL EXIT ===
            if gdp_decreasing and port["holdings"]:
                # Ghost-copy actual holdings into paper_holdings (continue tracking)
                for t, pos in port["holdings"].items():
                    port["paper_holdings"][t] = dict(pos)  # snapshot before clearing
                
                for t in list(port["holdings"].keys()):
                    pos = port["holdings"][t]
                    sp = c_prices.get(t, pos['entry_p'])
                    port["cash"] += pos['shares'] * sp
                    port["trades"].append({
                        "ticker": t, 
                        "slot": f"{pos['slot']}/{port['max_slots']}", 
                        "entry": pos['entry_d'], 
                        "exit": dt_s, 
                        "entry_p": round(pos['entry_p'], 2), 
                        "exit_p": round(sp, 2), 
                        "pnl": round(pos['shares']*(sp-pos['entry_p']), 2), 
                        "pct": round((sp/pos['entry_p']-1)*100, 2),
                        "style": pos.get("style", "Beta")
                    })
                    port["available_slots"].append(pos["slot"])
                port["available_slots"].sort()
                port["holdings"].clear()
                # paper_cash stays the same as actual cash at the exit moment
                port["paper_cash"] = port["cash"]

            # === ACTUAL ENTRY ===
            if gdp_increasing and not port["holdings"] and port["available_slots"]:
                # At new entry: clear paper_holdings (we'd be re-entering anyway)
                port["paper_holdings"].clear()
                port["paper_cash"] = port["cash"]
                
                picks = []
                if sid == "I":
                    picks = [(t, "Beta") for t in valid_vols.head(50).index.tolist()]
                elif sid == "L":
                    picks = [(t, "Beta") for t in valid_vols.head(100).index.tolist()]
                elif sid == "M":
                    exp_sr = pd.Series(full_ticker_to_exprtn)
                    valid_exp = exp_sr[exp_sr.index.isin(valid_vols.index)].sort_values(ascending=False)
                    picks = [(t, "Value") for t in valid_exp.head(100).index.tolist()]
                elif sid == "N":
                    exp_sr = pd.Series(full_ticker_to_exprtn)
                    valid_exp = exp_sr[exp_sr.index.isin(valid_vols.index)].sort_values(ascending=True)
                    picks = [(t, "Growth") for t in valid_exp.head(100).index.tolist()]
                elif sid == "O":
                    exp_sr = pd.Series(full_ticker_to_exprtn)
                    val_pool = exp_sr[exp_sr.index.isin(valid_vols.index)].sort_values(ascending=False).index.tolist()
                    gro_pool = exp_sr[exp_sr.index.isin(valid_vols.index)].sort_values(ascending=True).index.tolist()
                    if cpi_yoy > 4.0:
                        val_count = int(port["max_slots"] * 0.8)
                    else:
                        val_count = port["max_slots"] - int(port["max_slots"] * 0.8)
                    current_picks = []
                    for t in val_pool:
                        if len(current_picks) >= val_count: break
                        picks.append((t, "Value")); current_picks.append(t)
                    for t in gro_pool:
                        if len(picks) >= port["max_slots"]: break
                        if t not in current_picks:
                            picks.append((t, "Growth")); current_picks.append(t)
                elif sid == "J" and total_valid_vols >= 50:
                    t1 = 0; t2 = total_valid_vols // 3; t3 = (total_valid_vols * 2) // 3
                    picks.extend([(t, "Large") for t in valid_vols.iloc[t1:t1+17].index])
                    picks.extend([(t, "Mid") for t in valid_vols.iloc[t2:t2+17].index])
                    picks.extend([(t, "Small") for t in valid_vols.iloc[t3:t3+16].index])
                elif sid == "K" and total_valid_vols > 0:
                    sec_groups = {}
                    for t in valid_vols.index:
                        s = full_ticker_to_sector.get(t, "Unknown / Unclassified")
                        if s == "Unknown / Unclassified": continue
                        if s not in sec_groups: sec_groups[s] = []
                        sec_groups[s].append(t)
                    sectors = list(sec_groups.keys())
                    pointers = {sec: 0 for sec in sectors}
                    while len(picks) < port["max_slots"] and sectors:
                        for sec in list(sectors):
                            if len(picks) >= port["max_slots"]: break
                            p_idx = pointers[sec]
                            if p_idx < len(sec_groups[sec]):
                                picks.append((sec_groups[sec][p_idx], sec)); pointers[sec] += 1
                            else:
                                sectors.remove(sec)

                for t, style in picks:
                    if t not in c_prices or pd.isna(c_prices[t]) or c_prices[t] <= 0: continue
                    bp = c_prices[t]
                    if port["available_slots"]:
                        slot = port["available_slots"].pop(0)
                        s_size = PORTFOLIO_CASH / port["max_slots"]
                        port["holdings"][t] = {"shares": s_size/bp, "entry_p": bp, "entry_d": dt_s, "slot": slot, "style": style}
                        port["cash"] -= s_size

            # === ACTUAL curve ===
            ev = port["cash"] + sum(h['shares'] * c_prices.get(t, h['entry_p']) for t, h in port["holdings"].items())
            port["curve"].append({"date": dt_s, "value": round(ev, 2)})

            # === PAPER HOLD curve ===
            # During holding period: same as actual
            # During cash period: virtual portfolio = paper_cash + ghost positions marked-to-market
            if port["paper_holdings"]:
                pv = port["paper_cash"] + sum(h['shares'] * c_prices.get(t, h['entry_p']) for t, h in port["paper_holdings"].items())
            else:
                pv = ev  # no divergence — same as actual
            port["curve_hold"].append({"date": dt_s, "value": round(pv, 2)})

    out = {}
    for sid, p in portfolios.items():
        if not p["curve"]: continue
        wr = (len([t for t in p["trades"] if t["pnl"] > 0]) / len(p["trades"]) * 100) if p["trades"] else 0
        out[sid] = {
            "name": p["name"], 
            "rules": p["rules"], 
            "total_trades": len(p["trades"]), 
            "win_rate": round(wr, 2), 
            "total_pnl": round(p["curve"][-1]["value"] - 100000, 2), 
            "curve": p["curve"],
            "curve_hold": p["curve_hold"],   # <-- NEW
            "recent_trades": sorted(p["trades"], key=lambda x: x["entry"], reverse=True)
        }
    with open(OUTPUT_FILE, 'w') as f: f.write(f"export const backtestData = {json.dumps(out, indent=2, ensure_ascii=False)};")

if __name__ == "__main__": main()
