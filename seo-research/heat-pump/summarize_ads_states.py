#!/usr/bin/env python3
import json
from collections import defaultdict
from pathlib import Path

src = Path(r"C:\Users\PC\.cursor\projects\c-Users-PC-Desktop-heatpumpatlasusa\agent-tools\bad63a7b-3d71-4274-bc23-92cf50cbb78f.txt")
dst = Path(r"C:\Users\PC\Desktop\heatpumpatlasusa\seo-research\heat-pump\raw\ads_search_volume_states.json")
data = json.loads(src.read_text(encoding="utf-8"))
dst.write_text(json.dumps(data, indent=2), encoding="utf-8")

items = []
if isinstance(data, dict):
    if data.get("tasks"):
        for task in data["tasks"]:
            items.extend(task.get("result") or [])
    items.extend(data.get("items") or [])
    items.extend(data.get("result") or [])

rows = []
for it in items:
    if not isinstance(it, dict):
        continue
    if not it.get("keyword") and not it.get("search_volume"):
        continue
    rows.append({
        "keyword": it.get("keyword"),
        "volume": it.get("search_volume") or 0,
        "cpc": it.get("cpc"),
        "competition": it.get("competition"),
        "competition_index": it.get("competition_index"),
        "low_bid": it.get("low_top_of_page_bid"),
        "high_bid": it.get("high_top_of_page_bid"),
    })

# de-dup
seen = {}
for r in rows:
    k = (r["keyword"] or "").lower()
    if k and (k not in seen or r["volume"] > seen[k]["volume"]):
        seen[k] = r
rows = sorted(seen.values(), key=lambda r: r["volume"], reverse=True)
print("rows", len(rows))
print("vol>0", sum(1 for r in rows if r["volume"] > 0))
print("vol>=10", sum(1 for r in rows if r["volume"] >= 10))
print("vol>=50", sum(1 for r in rows if r["volume"] >= 50))
print("vol>=100", sum(1 for r in rows if r["volume"] >= 100))
print("vol>=500", sum(1 for r in rows if r["volume"] >= 500))
print()
for r in rows[:60]:
    print(f"{r['volume']:>6} cpc={str(r['cpc']):>6} {r['competition']}  {r['keyword']}")

Path(r"C:\Users\PC\Desktop\heatpumpatlasusa\seo-research\heat-pump\cache\ads_state_keywords.json").write_text(
    json.dumps(rows, indent=2), encoding="utf-8"
)
