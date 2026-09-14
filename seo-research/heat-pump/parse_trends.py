#!/usr/bin/env python3
import json
from pathlib import Path

p = Path(r"C:\Users\PC\Desktop\heatpumpatlasusa\seo-research\heat-pump\raw\google_trends.json")
data = json.loads(p.read_text(encoding="utf-8"))
items = data.get("items") or []
if not items and data.get("tasks"):
    for t in data["tasks"]:
        for r in t.get("result") or []:
            items.extend(r.get("items") or [])
print("top keys", list(data.keys())[:20])
print("items", len(items))
for it in items[:8]:
    print(it.get("type"), it.get("title"), "keys", list(it.keys())[:12])
    if it.get("type") == "google_trends_graph":
        av = it.get("averages")
        print(" averages", av)
        d = it.get("data") or []
        print(" points", len(d))
        if d:
            print(" first", d[0])
            print(" last", d[-1])
    if it.get("type") == "google_trends_map":
        d = it.get("data") or []
        ranked = sorted(d, key=lambda x: (x.get("values") or [0])[0] if isinstance(x.get("values"), list) else (x.get("values") or 0), reverse=True)
        print(" map n", len(d))
        for row in ranked[:15]:
            print(" ", row.get("geo_name") or row.get("geo_id"), row.get("values"))
