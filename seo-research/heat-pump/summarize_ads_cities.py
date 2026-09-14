#!/usr/bin/env python3
import json
from pathlib import Path

src = Path(r"C:\Users\PC\.cursor\projects\c-Users-PC-Desktop-heatpumpatlasusa\agent-tools\f8ef62e2-333a-4ad2-8be5-8646b214fadb.txt")
data = json.loads(src.read_text(encoding="utf-8"))
Path(r"C:\Users\PC\Desktop\heatpumpatlasusa\seo-research\heat-pump\raw\ads_search_volume_cities.json").write_text(
    json.dumps(data, indent=2), encoding="utf-8"
)
items = []
if isinstance(data, dict):
    if data.get("tasks"):
        for task in data["tasks"]:
            items.extend(task.get("result") or [])
    items.extend(data.get("items") or [])
    items.extend(data.get("result") or [])
rows = []
for it in items:
    if not isinstance(it, dict) or not it.get("keyword"):
        continue
    rows.append({
        "keyword": it.get("keyword"),
        "volume": it.get("search_volume") or 0,
        "cpc": it.get("cpc"),
        "competition": it.get("competition"),
        "competition_index": it.get("competition_index"),
    })
rows.sort(key=lambda r: r["volume"], reverse=True)
print("rows", len(rows))
print("vol>0", sum(1 for r in rows if r["volume"] > 0))
print("vol>=10", sum(1 for r in rows if r["volume"] >= 10))
print("vol>=50", sum(1 for r in rows if r["volume"] >= 50))
print("vol>=100", sum(1 for r in rows if r["volume"] >= 100))
print()
for r in rows:
    if r["volume"] > 0:
        print(f"{r['volume']:>5} cpc={str(r['cpc']):>6}  {r['keyword']}")
Path(r"C:\Users\PC\Desktop\heatpumpatlasusa\seo-research\heat-pump\cache\ads_city_keywords.json").write_text(
    json.dumps(rows, indent=2), encoding="utf-8"
)
