
import pandas as pd
import json
import logging
from datetime import datetime

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(message)s')

def fetch_fred_series(series_id):
    url = f"https://fred.stlouisfed.org/graph/fredgraph.csv?id={series_id}"
    try:
        df = pd.read_csv(url, parse_dates=['observation_date'], index_col='observation_date')
        df[series_id] = pd.to_numeric(df[series_id], errors='coerce')
        return df.dropna()
    except Exception as e:
        logging.error(f"Failed to fetch {series_id}: {e}")
        return pd.DataFrame()

def update_macro_data():
    logging.info("Starting High-Frequency Macro Sync from FRED...")
    
    # Core Datasets
    # CPIAUCSL: Consumer Price Index (Monthly)
    # FEDFUNDS: Effective Federal Funds Rate (Monthly)
    # GS10: 10-Year Treasury Constant Maturity Rate (Monthly)
    # GS2: 2-Year Treasury Constant Maturity Rate (Monthly)
    
    cpi = fetch_fred_series("CPIAUCSL")
    ffr = fetch_fred_series("FEDFUNDS")
    gs10 = fetch_fred_series("GS10")
    gs2 = fetch_fred_series("GS2")
    
    if cpi.empty:
        logging.error("Critical: CPI data empty.")
        return
        
    logging.info("Merging Datasets and Normalizing Timelines...")
    macro_df = pd.concat([cpi, ffr, gs10, gs2], axis=1).ffill()
    macro_df = macro_df[macro_df.index >= '2005-01-01']
    
    # Feature Engineering
    logging.info("Calculating Macro Alpha Factors...")
    # YoY Inflation (CPI)
    macro_df['CPI_YoY'] = macro_df['CPIAUCSL'].pct_change(periods=12) * 100
    # Yield Curve Spread (10Y - 2Y)
    macro_df['Spread_10Y_2Y'] = macro_df['GS10'] - macro_df['GS2']
    
    # Clean up edge NaNs from pct_change
    macro_df = macro_df.dropna(subset=['CPI_YoY'])
    
    # Export structures
    export_dict = {}
    for dt, row in macro_df.iterrows():
        dt_str = dt.strftime('%Y-%m-%d')
        export_dict[dt_str] = {
            "cpi_index": round(row['CPIAUCSL'], 2),
            "cpi_yoy": round(row['CPI_YoY'], 2),
            "fed_funds": round(row['FEDFUNDS'], 2) if pd.notna(row['FEDFUNDS']) else 0,
            "gs10": round(row['GS10'], 2) if pd.notna(row['GS10']) else 0,
            "gs2": round(row['GS2'], 2) if pd.notna(row['GS2']) else 0,
            "yield_spread": round(row['Spread_10Y_2Y'], 2) if pd.notna(row['Spread_10Y_2Y']) else 0
        }
        
    # JSON Cache
    with open('macro_cache.json', 'w') as f:
        json.dump(export_dict, f, indent=2)
    
    # JS Export for Dashboard
    js_content = f"export const macroData = {json.dumps(export_dict, indent=2)};"
    with open('src/macro_data.js', 'w') as f:
        f.write(js_content)
        
    logging.info(f"Macro sync complete. Saved {len(export_dict)} temporal data points.")

if __name__ == "__main__":
    update_macro_data()
