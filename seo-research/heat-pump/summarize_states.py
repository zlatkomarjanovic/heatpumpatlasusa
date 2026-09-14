#!/usr/bin/env python3
import json
from collections import defaultdict
from pathlib import Path

p = Path(r"C:\Users\PC\Desktop\heatpumpatlasusa\seo-research\heat-pump\raw\keyword_overview_states.json")
data = json.loads(p.read_text(encoding="utf-8"))
items = data.get("items") or []
if not items and "tasks" in data:
    for task in data["tasks"]:
        for result in task.get("result") or []:
            items.extend(result.get("items") or [])

rows = []
for it in items:
    ki = it.get("keyword_info") or {}
    kp = it.get("keyword_properties") or {}
    si = it.get("search_intent_info") or {}
    serp = it.get("serp_info") or {}
    feats = serp.get("serp_item_types") or []
    rows.append({
        "keyword": it.get("keyword"),
        "volume": ki.get("search_volume") or 0,
        "cpc": ki.get("cpc"),
        "comp": ki.get("competition_level"),
        "kd": kp.get("keyword_difficulty"),
        "intent": si.get("main_intent"),
        "yearly": (ki.get("search_volume_trend") or {}).get("yearly"),
        "ai": "ai_overview" in feats,
        "local": "local_pack" in feats or "local_services" in feats,
        "features": feats,
    })

rows.sort(key=lambda r: r["volume"], reverse=True)
print("returned", len(rows))
print("volume>0", sum(1 for r in rows if r["volume"] > 0))
print("volume>=50", sum(1 for r in rows if r["volume"] >= 50))
print("volume>=100", sum(1 for r in rows if r["volume"] >= 100))
print("volume>=500", sum(1 for r in rows if r["volume"] >= 500))
print()
print("=== TOP 50 ===")
for r in rows[:50]:
    print(f"{r['volume']:>6} kd={str(r['kd']):>4} cpc={str(r['cpc']):>6} y={str(r['yearly']):>4} ai={int(r['ai'])}  {r['keyword']}")

print()
print("=== ZERO / MISSING ===")
print("zero", sum(1 for r in rows if r["volume"] == 0))

pat = defaultdict(lambda: [0, 0])
for r in rows:
    k = r["keyword"] or ""
    if "installation cost" in k:
        key = "hp install cost"
    elif k.startswith("heat pump cost"):
        key = "hp cost"
    elif "rebate" in k:
        key = "rebate"
    elif k.startswith("mini split"):
        key = "mini split"
    elif "vs furnace" in k:
        key = "vs furnace"
    elif "vs oil" in k or "vs gas" in k or "vs propane" in k:
        key = "vs fuel"
    else:
        key = "other"
    pat[key][0] += 1
    pat[key][1] += r["volume"]
print("PATTERN TOTALS")
for k, v in pat.items():
    print(k, "n=", v[0], "vol=", v[1])

out = Path(r"C:\Users\PC\Desktop\heatpumpatlasusa\seo-research\heat-pump\cache\state_keywords.json")
out.write_text(json.dumps(rows, indent=2), encoding="utf-8")
