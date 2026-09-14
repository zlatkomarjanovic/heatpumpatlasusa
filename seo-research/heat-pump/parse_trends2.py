#!/usr/bin/env python3
import json
from pathlib import Path
p = Path(r"C:\Users\PC\Desktop\heatpumpatlasusa\seo-research\heat-pump\raw\google_trends.json")
data = json.loads(p.read_text(encoding="utf-8"))
items = data.get("items") or []
print("averages labels: heat pump cost, mini split cost, heat pump rebate, heat pump vs furnace, heat pump installation")
for it in items:
    if it.get("type") == "google_trends_graph":
        print("AVERAGES", it.get("averages"))
        print("KEYWORDS", it.get("keywords"))
    if it.get("type") == "google_trends_map":
        d = it.get("data") or []
        print("MAP n", len(d), "sample", d[0] if d else None)
        def val(x):
            v = x.get("values")
            if isinstance(v, list):
                nums = [i for i in v if isinstance(i, (int, float))]
                return max(nums) if nums else 0
            if isinstance(v, (int, float)):
                return v
            return 0
        ranked = sorted(d, key=val, reverse=True)
        for row in ranked[:20]:
            print(row.get("geo_name"), row.get("values"))
