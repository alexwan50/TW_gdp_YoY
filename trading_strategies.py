
# --- 交易策略定義中心 (Trading Strategies Registry) ---
# 已根據最新指令進行精簡，僅保留表現最優的總經波段策略。

def get_strategy_definitions(params):
    """
    返回所有策略的配置、進場判斷與出場判斷。
    """
    
    return {
        "I": {
            "name": "Macro Wave (大盤權值)",
            "rules": {
                "entry_desc": "GDP YoY 開始遞增即直接買入成交量最大的 50 支股。",
                "exit_desc": "GDP YoY 開始遞減即全數出清。"
            },
            "check_entry": lambda row: True,
            "check_exit": lambda row, context: False
        },
        "J": {
            "name": "Macro Wave (三階分層)",
            "rules": {
                "entry_desc": "GDP YoY 遞增時，將全市場依成交量分大、中、小三階，等權重買入各階層的股票 (共50支)。",
                "exit_desc": "GDP YoY 遞減時全數出清。"
            },
            "check_entry": lambda row: True,
            "check_exit": lambda row, context: False
        },
        "K": {
            "name": "Macro Wave (產業平配)",
            "rules": {
                "entry_desc": "GDP YoY 遞增時，依循 myFavorite.xlsx 的產業分類(SuperSector)進行等權重分配，每個產業挑選量能最大者，輪流湊滿 50 支。",
                "exit_desc": "GDP YoY 遞減時全數出清。"
            },
            "check_entry": lambda row: True,
            "check_exit": lambda row, context: False
        },
        "L": {
            "name": "Macro Wave (100支寬基)",
            "rules": {
                "entry_desc": "GDP YoY 開始遞增即直接買入成交量最大的 100 支股 (擴大基礎分散風險)。",
                "exit_desc": "GDP YoY 開始遞減即全數出清。"
            },
            "check_entry": lambda row: True,
            "check_exit": lambda row, context: False
        },
        "M": {
            "name": "Macro Value (最便宜/高預期報酬)",
            "rules": {
                "entry_desc": "GDP YoY 遞增時，買入 myFavorite.xlsx 裡 ExpReturn% 最大的100支股票 (最便宜/預期報酬最高)。",
                "exit_desc": "GDP YoY 遞減時全數出清。"
            },
            "check_entry": lambda row: True,
            "check_exit": lambda row, context: False
        },
        "N": {
            "name": "Macro Growth (最貴/低預期報酬)",
            "rules": {
                "entry_desc": "GDP YoY 遞增時，買入 myFavorite.xlsx 裡 ExpReturn% 最小的100支股票 (最貴/預期報酬最低/追高)。",
                "exit_desc": "GDP YoY 遞減時全數出清。"
            },
            "check_entry": lambda row: True,
            "check_exit": lambda row, context: False
        },
        "O": {
            "name": "Regime Switching (通膨動態切換)",
            "rules": {
                "entry_desc": "總經與多因子智能結合：當美國 CPI 年增率 > 4% (高通膨)，配置 80% 價值股與 20% 成長股；當 <= 4% 時，配置 80% 成長股與 20% 價值股，共100檔。",
                "exit_desc": "GDP YoY 遞減時全數出清。"
            },
            "check_entry": lambda row: True,
            "check_exit": lambda row, context: False
        }
    }
