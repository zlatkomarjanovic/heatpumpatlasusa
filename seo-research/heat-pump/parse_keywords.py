#!/usr/bin/env python3
"""Parse cached DataForSEO keyword dumps into compact summaries."""
import json
import os
from pathlib import Path

RAW = Path(r"C:\Users\PC\Desktop\heatpumpatlasusa\seo-research\heat-pump\raw")
OUT = Path(r"C:\Users\PC\Desktop\heatpumpatlasusa\seo-research\heat-pump")


def load_items(path):
    with open(path, encoding="utf-8") as f:
        data = json.load(f)
    items = data.get("items") or []
    # suggestions wrap seed separately
    seed = data.get("seed_keyword_data")
    if seed:
        items = [seed] + items
    # some responses nest under tasks
    if not items and "tasks" in data:
        for task in data["tasks"]:
            for result in task.get("result") or []:
                if result.get("seed_keyword_data"):
                    items.append(result["seed_keyword_data"])
                items.extend(result.get("items") or [])
    return items


def flatten(item):
    ki = item.get("keyword_info") or {}
    kp = item.get("keyword_properties") or {}
    si = item.get("search_intent_info") or {}
    serp = item.get("serp_info") or {}
    bl = item.get("avg_backlinks_info") or {}
    trend = ki.get("search_volume_trend") or {}
    features = serp.get("serp_item_types") or []
    monthly = ki.get("monthly_searches") or {}
    return {
        "keyword": item.get("keyword"),
        "volume": ki.get("search_volume"),
        "cpc": ki.get("cpc"),
        "competition": ki.get("competition"),
        "competition_level": ki.get("competition_level"),
        "kd": kp.get("keyword_difficulty"),
        "intent": si.get("main_intent"),
        "foreign_intent": ",".join(si.get("foreign_intent") or []),
        "trend_yearly": trend.get("yearly"),
        "trend_quarterly": trend.get("quarterly"),
        "trend_monthly": trend.get("monthly"),
        "serp_features": "|".join(features),
        "has_ai_overview": "ai_overview" in features,
        "has_local_pack": "local_pack" in features or "local_services" in features,
        "has_forums": "discussions_and_forums" in features,
        "has_paa": "people_also_ask" in features,
        "avg_backlinks": bl.get("backlinks"),
        "avg_ref_domains": bl.get("referring_domains"),
        "avg_rank": bl.get("rank"),
        "avg_main_domain_rank": bl.get("main_domain_rank"),
        "monthly_searches": monthly,
    }


def main():
    files = [
        "keyword_overview_seeds.json",
        "suggestions_heat_pump_cost.json",
        "suggestions_mini_split_cost.json",
        "suggestions_heat_pump_rebate.json",
        "suggestions_heat_pump_vs_furnace.json",
        "suggestions_heat_pump_calculator.json",
        "suggestions_geothermal.json",
    ]
    seen = {}
    for fname in files:
        path = RAW / fname
        if not path.exists():
            continue
        try:
            items = load_items(path)
        except Exception as e:
            print(f"FAIL {fname}: {e}")
            continue
        for item in items:
            row = flatten(item)
            kw = (row["keyword"] or "").strip().lower()
            if not kw:
                continue
            if kw not in seen or (row["volume"] or 0) > (seen[kw]["volume"] or 0):
                row["source"] = fname
                seen[kw] = row
    rows = list(seen.values())
    rows.sort(key=lambda r: (r["volume"] or 0), reverse=True)
    out_path = OUT / "cache" / "national_keywords.json"
    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(rows, f, indent=2)
    print(f"keywords={len(rows)}")
    print("\n=== TOP 40 BY VOLUME ===")
    for r in rows[:40]:
        print(f"{r['volume']:>7} kd={str(r['kd']):>4} cpc={str(r['cpc']):>6} {r['intent'] or '':<14} ai={int(r['has_ai_overview'])} loc={int(r['has_local_pack'])}  {r['keyword']}")
    print("\n=== SEEDS / HIGH COMMERCIAL ===")
    seeds_interest = [r for r in rows if any(x in (r["keyword"] or "") for x in [
        "cost", "rebate", "calculator", "vs", "tax credit", "installer", "quote"
    ])]
    seeds_interest.sort(key=lambda r: (r["volume"] or 0), reverse=True)
    for r in seeds_interest[:50]:
        print(f"{r['volume']:>7} kd={str(r['kd']):>4} cpc={str(r['cpc']):>6} {r['intent'] or '':<14}  {r['keyword']}")


if __name__ == "__main__":
    main()
