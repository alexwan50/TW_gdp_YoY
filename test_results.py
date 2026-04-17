import json
with open('src/backtest_data.js', 'r') as f:
    data = f.read().replace('export const backtestData = ', '').strip(';')
    j = json.loads(data)
    print(f"PnL: {j['I']['total_pnl']}, Win Rate: {j['I']['win_rate']}, Trades: {j['I']['total_trades']}")
