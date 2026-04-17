
import pandas as pd
import yfinance as yf
import json
import os
from datetime import datetime, timedelta

# Configuration & Trade Filters
XL_FILE = 'myFavorite.xlsx'
OUTPUT_FILE = 'src/rs_data.js'
CACHE_FILE = 'rs_cache_v2.json' # Changed file name to force structural update

FILTER_MA_DAYS = 20           # 股價必須站上 X 日均線
FILTER_VOL_MA_DAYS = 50       # 比較平均量的天期
FILTER_VOL_MULTIPLIER = 1.5   # 今日成交量需大於均量的 X 倍

def get_ticker_suffix(exchange):
    exchange = str(exchange).strip().upper()
    if 'TWSE' in exchange: return '.TW'
    if 'HKEX' in exchange: return '.HK'
    if 'SZSE' in exchange: return '.SZ'
    if 'SSE' in exchange: return '.SS'
    if 'NASDAQ' in exchange or 'NYSE' in exchange or 'OTC' in exchange: return ''
    return ''

def calculate_rs(stock_series, index_series, n=200):
    if stock_series.empty or index_series.empty:
        return pd.Series()
    combined = pd.concat([stock_series, index_series], axis=1).dropna()
    if combined.empty:
        return pd.Series()
    s = combined.iloc[:, 0]
    idx = combined.iloc[:, 1]
    rsd = (s / idx) * 100
    rsd_sma = rsd.rolling(window=n).mean()
    rsm = ((rsd / rsd_sma) - 1) * 100
    return rsm

def load_cache():
    if os.path.exists(CACHE_FILE):
        with open(CACHE_FILE, 'r') as f:
            c = json.load(f)
            if "metadata" not in c: c["metadata"] = {}
            if "prices" not in c: c["prices"] = {}
            if "volumes" not in c: c["volumes"] = {}
            if "benchmarks" not in c: c["benchmarks"] = {}
            return c
    return {"prices": {}, "volumes": {}, "benchmarks": {}, "metadata": {}}

def save_cache(cache):
    with open(CACHE_FILE, 'w') as f:
        json.dump(cache, f)

def main():
    if not os.path.exists(XL_FILE):
        print(f"Error: {XL_FILE} not found.")
        return

    print(f"Reading {XL_FILE}...")
    df_xl = pd.read_excel(XL_FILE, engine='openpyxl')
    
    tickers_to_fetch = []
    ticker_map = {}
    
    for _, row in df_xl.iterrows():
        if pd.isna(row.get('Equity')) or pd.isna(row.get('Exchange')):
            continue
        equity = str(row['Equity']).strip().split('.')[0]
        if 'HKEX' in str(row['Exchange']).upper():
            equity = equity.zfill(4)
        suffix = get_ticker_suffix(row['Exchange'])
        full_ticker = f"{equity}{suffix}"
        
        if full_ticker not in ticker_map:
            tickers_to_fetch.append(full_ticker)
            ticker_map[full_ticker] = {
                "equity": equity,
                "company": str(row.get('COMPANY', 'Unknown')).strip(),
                "exchange": str(row.get('Exchange', 'Unknown')).strip(),
                "sector": str(row.get('SuperSector', 'Unknown')).strip()
            }
    
    cache = load_cache()
    if "volumes" not in cache: cache["volumes"] = {}
    benchmarks = ["^TWII", "^GSPC"]
    
    # Check if we have performed the 8-year deep backfill
    history_8y_done = cache.get("metadata", {}).get("8y_backfill_done", False)
    backfill_days = 2920 # 8 years

    # 1. Update Benchmarks
    print("Updating benchmark cache...")
    for bm in benchmarks:
        bm_cache = cache["benchmarks"].get(bm, {})
        last_date = max(bm_cache.keys()) if bm_cache else None
        
        # If backfill not done, we need to check if the current cache reaches far enough back
        earliest_in_cache = min(bm_cache.keys()) if bm_cache else None
        target_start = (datetime.now() - timedelta(days=backfill_days)).strftime('%Y-%m-%d')
        
        # Scenario A: No data or forced backfill needed
        if not history_8y_done or not earliest_in_cache or earliest_in_cache > target_start:
            start_date = target_start
        else:
            # Scenario B: Just daily update
            start_date = (datetime.strptime(last_date, '%Y-%m-%d') + timedelta(days=1)).strftime('%Y-%m-%d') if last_date else target_start
            
        if start_date < datetime.now().strftime('%Y-%m-%d'):
            print(f"  Fetching {bm} from {start_date}...")
            new_data = yf.download(bm, start=start_date, auto_adjust=False, progress=False)
            if not new_data.empty:
                for date, row in new_data.iterrows():
                    date_str = date.strftime('%Y-%m-%d')
                    bm_cache[date_str] = round(float(row['Close']), 4)
                cache["benchmarks"][bm] = bm_cache

    # 2. Update Tickers (Prices & Volumes)
    print(f"Updating {len(tickers_to_fetch)} symbols...")
    chunk_size = 50
    
    # Check if we have performed the one-time 8-year deep backfill
    history_8y_done = cache.get("metadata", {}).get("8y_backfill_done", False)
    
    for i in range(0, len(tickers_to_fetch), chunk_size):
        chunk = tickers_to_fetch[i:i + chunk_size]
        any_missing = False
        
        for ticker in chunk:
            t_cache = cache["prices"].get(ticker, {})
            v_cache = cache["volumes"].get(ticker, {})
            if not t_cache or not v_cache: 
                any_missing = True
                break
            last_date = datetime.strptime(max(t_cache.keys()), '%Y-%m-%d')
            if last_date < datetime.now() - timedelta(days=1):
                any_missing = True

        target_start = (datetime.now() - timedelta(days=2920)).strftime('%Y-%m-%d')
        
        # Check if this chunk needs a deep backfill
        any_missing_history = False
        if not history_8y_done:
            any_missing_history = True
        else:
            for ticker in chunk:
                p_c = cache["prices"].get(ticker, {})
                if not p_c or min(p_c.keys()) > target_start:
                    any_missing_history = True; break

        if any_missing or any_missing_history:
            fetch_start = target_start
            
            # Normal incremental logic only applies if 8y backfill is already done
            if history_8y_done and not any_missing_history:
                has_new = any(ticker not in cache["prices"] or not cache["prices"][ticker] for ticker in chunk)
                if not has_new:
                    min_last = min(datetime.strptime(max(cache["prices"][t].keys()), '%Y-%m-%d') for t in chunk)
                    fetch_start = (min_last + timedelta(days=1)).strftime('%Y-%m-%d')
            
            if fetch_start < datetime.now().strftime('%Y-%m-%d'):
                print(f"  Fetching chunk {i//chunk_size + 1} from {fetch_start}...")
                chunk_data = yf.download(chunk, start=fetch_start, auto_adjust=False, progress=False)
                if not chunk_data.empty:
                    if len(chunk) == 1:
                        ticker = chunk[0]
                        p_c = cache["prices"].get(ticker, {})
                        v_c = cache["volumes"].get(ticker, {})
                        for date, val in chunk_data['Close'].items():
                            p_c[date.strftime('%Y-%m-%d')] = round(float(val), 4)
                        for date, val in chunk_data['Volume'].items():
                            v_c[date.strftime('%Y-%m-%d')] = int(val) if pd.notna(val) else 0
                        cache["prices"][ticker] = p_c
                        cache["volumes"][ticker] = v_c
                    else:
                        for ticker in chunk:
                            if ticker in chunk_data['Close'].columns:
                                p_c = cache["prices"].get(ticker, {})
                                v_c = cache["volumes"].get(ticker, {})
                                for date, val in chunk_data['Close'][ticker].dropna().items():
                                    p_c[date.strftime('%Y-%m-%d')] = round(float(val), 4)
                                for date, val in chunk_data['Volume'][ticker].dropna().items():
                                    v_c[date.strftime('%Y-%m-%d')] = int(val) if pd.notna(val) else 0
                                cache["prices"][ticker] = p_c
                                cache["volumes"][ticker] = v_c

    # Mark backfill as done for future runs
    cache["metadata"]["8y_backfill_done"] = True
    save_cache(cache)

    # 3. Calculate MRS and Prepare Output
    print("Calculating MRS scores and trends...")
    results = []
    bm_series = {bm: pd.Series(cache["benchmarks"][bm]).sort_index() for bm in benchmarks}
    
    for ticker in tickers_to_fetch:
        if ticker not in cache["prices"]: continue
        
        t_prices = pd.Series(cache["prices"][ticker]).sort_index()
        t_vols = pd.Series(cache["volumes"].get(ticker, {})).sort_index()
        
        info = ticker_map[ticker]
        idx_key = "^TWII" if ('.TW' in ticker or 'TWSE' in info['exchange']) else "^GSPC"
        idx = bm_series[idx_key]
        
        mrs_200 = calculate_rs(t_prices, idx, n=200)
        mrs_50 = calculate_rs(t_prices, idx, n=50)
        mrs_5 = calculate_rs(t_prices, idx, n=5)
        
        if mrs_200.empty or len(mrs_200.dropna()) < 5: continue
        
        non_na_200 = mrs_200.dropna()
        non_na_50 = mrs_50.dropna()
        non_na_5 = mrs_5.dropna()
        
        last_mrs_200 = non_na_200.iloc[-1]
        prev_mrs_200 = non_na_200.iloc[-5] if len(non_na_200) > 5 else non_na_200.iloc[0]
        
        last_mrs_50 = non_na_50.iloc[-1]
        prev_mrs_50_day = non_na_50.iloc[-2] if len(non_na_50) > 1 else last_mrs_50
        
        last_mrs_5 = non_na_5.iloc[-1] if not non_na_5.empty else 0
        prev_mrs_5_day = non_na_5.iloc[-2] if len(non_na_5) > 1 else last_mrs_5
        
        # Absolute Trend Logic
        price_ma = t_prices.rolling(window=FILTER_MA_DAYS).mean()
        is_above_ma = False
        if len(price_ma.dropna()) > 0 and t_prices.iloc[-1] > price_ma.dropna().iloc[-1]:
            is_above_ma = True
            
        # Volume Surge Logic
        vol_ma = t_vols.rolling(window=FILTER_VOL_MA_DAYS).mean()
        is_vol_surge = False
        if len(vol_ma.dropna()) > 0 and t_vols.iloc[-1] > (vol_ma.dropna().iloc[-1] * FILTER_VOL_MULTIPLIER):
            is_vol_surge = True
        
        # Get 120-day history for sparklines
        history_window = 120
        hist_data = []
        valid_dates = non_na_200.index.intersection(non_na_50.index)
        recent_dates = valid_dates[-history_window:]
        
        for d in recent_dates:
            hist_data.append({
                "d": d[-5:],
                "s": round(float(mrs_50[d]), 2),
                "l": round(float(mrs_200[d]), 2),
                "m": round(float(mrs_5[d]), 2) if d in non_na_5.index else 0
            })

        results.append({
            "ticker": ticker,
            "equity": info['equity'],
            "name": info['company'],
            "sector": info['sector'],
            "rs_score": round(float(last_mrs_200), 2),
            "rs_score_short": round(float(last_mrs_50), 2),
            "rs_score_micro": round(float(last_mrs_5), 2),
            "trend": "Rising" if last_mrs_200 > prev_mrs_200 else "Falling",
            "mrs_50_shift": round(float(last_mrs_50 - prev_mrs_50_day), 2),
            "mrs_5_shift": round(float(last_mrs_5 - prev_mrs_5_day), 2),
            "status": "Strong" if last_mrs_200 > 0 else "Weak",
            "price": round(float(t_prices.iloc[-1]), 2),
            "above_ma": is_above_ma,
            "vol_surge": is_vol_surge,
            "history": hist_data
        })

    # Final Market Summary
    market_stats = {}
    for bm, name in [('^TWII', 'TAIEX'), ('^GSPC', 'S&P 500')]:
        idx = bm_series[bm]
        if not idx.empty:
            change = ((idx.iloc[-1] / idx.iloc[-5]) - 1) * 100 if len(idx) > 5 else 0
            market_stats[name] = {
                "price": round(float(idx.iloc[-1]), 2),
                "change_5d": round(float(change), 2),
                "status": "Correction" if change < -2 else "Stable" if change < 2 else "Bullish"
            }

    results = sorted(results, key=lambda x: x['rs_score'], reverse=True)
    final_output = {
        "generated_at": datetime.now().strftime('%Y-%m-%d %H:%M:%S'),
        "config": {
            "ma_days": FILTER_MA_DAYS,
            "vol_ma_days": FILTER_VOL_MA_DAYS,
            "vol_multiplier": FILTER_VOL_MULTIPLIER
        },
        "market": market_stats,
        "stocks": results
    }
    
    with open(OUTPUT_FILE, 'w') as f:
        f.write(f"export const rsData = {json.dumps(final_output, indent=2, ensure_ascii=False)};")
    
    print(f"Successfully updated {len(results)} items in {OUTPUT_FILE}")

if __name__ == "__main__":
    main()

