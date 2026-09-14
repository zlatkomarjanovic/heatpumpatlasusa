#!/usr/bin/env python3
"""Compile keyword master CSV, SERP opportunities, and API spend."""
import csv
import json
import math
import re
from pathlib import Path

BASE = Path(r"C:\Users\PC\Desktop\heatpumpatlasusa\seo-research\heat-pump")
CACHE = BASE / "cache"

STATES = {
    "alabama": "AL", "alaska": "AK", "arizona": "AZ", "arkansas": "AR",
    "california": "CA", "colorado": "CO", "connecticut": "CT", "delaware": "DE",
    "florida": "FL", "georgia": "GA", "hawaii": "HI", "idaho": "ID",
    "illinois": "IL", "indiana": "IN", "iowa": "IA", "kansas": "KS",
    "kentucky": "KY", "louisiana": "LA", "maine": "ME", "maryland": "MD",
    "massachusetts": "MA", "michigan": "MI", "minnesota": "MN", "mississippi": "MS",
    "missouri": "MO", "montana": "MT", "nebraska": "NE", "nevada": "NV",
    "new hampshire": "NH", "new jersey": "NJ", "new mexico": "NM", "new york": "NY",
    "north carolina": "NC", "north dakota": "ND", "ohio": "OH", "oklahoma": "OK",
    "oregon": "OR", "pennsylvania": "PA", "rhode island": "RI", "south carolina": "SC",
    "south dakota": "SD", "tennessee": "TN", "texas": "TX", "utah": "UT",
    "vermont": "VT", "virginia": "VA", "washington": "WA", "west virginia": "WV",
    "wisconsin": "WI", "wyoming": "WY",
}

CITIES = [
    "new york", "los angeles", "chicago", "houston", "phoenix", "philadelphia",
    "dallas", "san diego", "san antonio", "austin", "boston", "seattle",
    "denver", "portland", "minneapolis", "detroit", "atlanta", "miami",
    "nashville", "charlotte", "columbus", "cleveland", "pittsburgh", "buffalo",
    "albany", "rochester", "syracuse", "worcester", "providence", "hartford",
    "burlington", "manchester", "anchorage", "honolulu", "salt lake city",
    "madison", "milwaukee", "grand rapids", "asheville", "boulder", "cambridge",
    "newark", "baltimore", "washington dc", "orlando", "tampa",
]


def load_json(path):
    if not path.exists():
        return []
    return json.loads(path.read_text(encoding="utf-8"))


def parse_geo(keyword):
    k = keyword.lower()
    state = ""
    city = ""
    market = "National"
    for name in sorted(STATES, key=len, reverse=True):
        if re.search(rf"\b{re.escape(name)}\b", k):
            state = STATES[name]
            market = name.title()
            break
    for name in sorted(CITIES, key=len, reverse=True):
        if re.search(rf"\b{re.escape(name)}\b", k):
            city = name.title()
            if market == "National":
                market = city
            break
    utilities = [
        ("mass save", "MA", "Mass Save"),
        ("nyserda", "NY", "NYSERDA"),
        ("efficiency maine", "ME", "Efficiency Maine"),
        ("eversource", "", "Eversource"),
        ("national grid", "", "National Grid"),
        ("con edison", "NY", "Con Edison"),
        ("pseg", "NJ", "PSEG"),
        ("xcel", "CO", "Xcel Energy"),
        ("pge", "CA", "PG&E"),
        ("sce", "CA", "SCE"),
        ("duke energy", "", "Duke Energy"),
        ("comed", "IL", "ComEd"),
        ("bge", "MD", "BGE"),
    ]
    for needle, st, label in utilities:
        if needle in k:
            market = label
            if st and not state:
                state = st
            break
    return market, state, city


def page_type(keyword):
    k = keyword.lower()
    if "calculator" in k:
        return "calculator"
    if "near me" in k or "installer" in k or "contractor" in k or "quotes" in k:
        return "local-installer"
    if any(x in k for x in ["rebate", "tax credit", "incentive", "ira "]):
        if any(u in k for u in ["mass save", "nyserda", "eversource", "xcel", "pge", "sce", "comed", "pseg", "national grid", "con edison", "duke", "bge"]):
            return "utility-rebate"
        if any(s in k for s in STATES):
            return "state-rebate"
        return "national-rebate"
    if "vs" in k:
        return "comparison"
    if "mini split" in k or "ductless" in k:
        return "mini-split-cost"
    if any(x in k for x in ["operating", "electricity", "monthly cost", "annual cost", "savings"]):
        return "operating-cost"
    if any(x in k for x in ["water heater", "geothermal", "cold climate", "air source", "panel", "ev charger", "insulation", "furnace replacement", "hvac replacement"]):
        return "related-system"
    if any(s in k for s in STATES) or any(c in k for c in CITIES):
        return "geo-cost"
    if "cost" in k:
        return "national-cost"
    return "supporting"


def intent_score(intent):
    return {
        "transactional": 100,
        "commercial": 88,
        "informational": 58,
        "navigational": 28,
    }.get((intent or "").lower(), 60)


def vol_score(vol):
    vol = vol or 0
    if vol <= 0:
        return 0
    return min(100, (math.log10(vol + 1) / math.log10(50000)) * 100)


def cpc_score(cpc):
    if not cpc:
        return 20
    return min(100, (float(cpc) / 25.0) * 100)


def kd_score(kd):
    if kd is None:
        return 55
    return max(0, 100 - float(kd))


def serp_weakness_score(row):
    feats = (row.get("serp_features") or "")
    score = 45
    if row.get("has_forums"):
        score += 18
    if "discussions_and_forums" in feats:
        score += 8
    if row.get("has_local_pack"):
        score += 6
    avg_rank = row.get("avg_main_domain_rank")
    if avg_rank is not None:
        if avg_rank < 400:
            score += 15
        elif avg_rank < 520:
            score += 8
        else:
            score -= 8
    return max(1, min(10, round(score / 10)))


def calculator_flag(keyword, ptype):
    k = keyword.lower()
    if "calculator" in k or ptype in ("calculator", "operating-cost", "national-cost", "comparison", "geo-cost"):
        return "high" if "calculator" in k or ptype == "calculator" else "medium"
    return "low"


def local_flag(keyword, city, state, ptype):
    if "near me" in keyword or ptype == "local-installer" or city or (state and ptype in ("geo-cost", "state-rebate", "utility-rebate")):
        return "high"
    return "low"


def opportunity_score(row):
    vol = row.get("volume") or 0
    cpc = row.get("cpc") or 0
    kd = row.get("kd")
    intent = row.get("intent") or ""
    ptype = row.get("page_type")
    ai = row.get("has_ai_overview")
    local = 1 if row.get("local_intent") == "high" else 0
    calc = 1 if row.get("calculator_intent") == "high" else 0.6 if row.get("calculator_intent") == "medium" else 0.2
    weakness = row.get("serp_weakness") or 5

    # Lead-value bonus for high-CPL commercial/local even at low volume
    lead_bonus = 0
    if cpc and cpc >= 8 and vol >= 10:
        lead_bonus = 8
    if ptype in ("utility-rebate", "state-rebate") and vol >= 100:
        lead_bonus += 10
    if ptype == "calculator":
        lead_bonus += 12
    if ptype == "geo-cost" and vol < 30:
        lead_bonus -= 15  # punish empty geo pSEO

    raw = (
        0.22 * vol_score(vol)
        + 0.16 * cpc_score(cpc)
        + 0.14 * intent_score(intent)
        + 0.14 * kd_score(kd)
        + 0.10 * (weakness * 10)
        + 0.08 * (100 if calc == 1 else 60 if calc == 0.6 else 25)
        + 0.08 * (80 if local else 35)
        + 0.08 * (35 if ai else 80)
    ) + lead_bonus
    return max(0, min(100, round(raw, 1)))


def infer_intent(keyword, existing):
    if existing:
        return existing
    k = keyword.lower()
    if "near me" in k or "installer" in k:
        return "transactional"
    if any(x in k for x in ["cost", "rebate", "price", "quotes", "calculator"]):
        return "commercial"
    if "vs" in k:
        return "commercial"
    return "informational"


def trend_label(yearly):
    if yearly is None:
        return ""
    if yearly >= 20:
        return f"up {yearly}%"
    if yearly <= -20:
        return f"down {yearly}%"
    return f"flat {yearly}%"


def main():
    national = load_json(CACHE / "national_keywords.json")
    states = load_json(CACHE / "ads_state_keywords.json")
    cities = load_json(CACHE / "ads_city_keywords.json")
    labs_states = load_json(CACHE / "state_keywords.json")

    merged = {}

    def upsert(src_row, source):
        kw = (src_row.get("keyword") or "").strip().lower()
        if not kw:
            return
        volume = src_row.get("volume") or 0
        existing = merged.get(kw)
        row = existing or {}
        if not existing or volume >= (row.get("volume") or 0):
            row["keyword"] = kw
            row["volume"] = volume
            if src_row.get("cpc") is not None:
                row["cpc"] = src_row.get("cpc")
            if src_row.get("competition_level") or src_row.get("competition"):
                row["competition"] = src_row.get("competition_level") or src_row.get("competition")
            if src_row.get("kd") is not None:
                row["kd"] = src_row.get("kd")
            if src_row.get("intent"):
                row["intent"] = src_row.get("intent")
            if src_row.get("trend_yearly") is not None:
                row["trend_yearly"] = src_row.get("trend_yearly")
            if src_row.get("yearly") is not None:
                row["trend_yearly"] = src_row.get("yearly")
            row["serp_features"] = src_row.get("serp_features") or row.get("serp_features") or ""
            row["has_ai_overview"] = bool(src_row.get("has_ai_overview") or row.get("has_ai_overview"))
            row["has_local_pack"] = bool(src_row.get("has_local_pack") or row.get("has_local_pack"))
            row["has_forums"] = bool(src_row.get("has_forums") or row.get("has_forums"))
            row["avg_main_domain_rank"] = src_row.get("avg_main_domain_rank") or row.get("avg_main_domain_rank")
            row["source"] = source
        merged[kw] = row

    for r in national:
        upsert(r, "labs-national")
    for r in labs_states:
        upsert(r, "labs-state")
    for r in states:
        upsert(r, "ads-state")
    for r in cities:
        upsert(r, "ads-city")

    out_rows = []
    for kw, r in merged.items():
        market, state, city = parse_geo(kw)
        ptype = page_type(kw)
        r["intent"] = infer_intent(kw, r.get("intent"))
        r["page_type"] = ptype
        r["market"] = market
        r["state"] = state
        r["city"] = city
        r["local_intent"] = local_flag(kw, city, state, ptype)
        r["calculator_intent"] = calculator_flag(kw, ptype)
        r["serp_weakness"] = serp_weakness_score(r)
        r["opportunity"] = opportunity_score(r)
        r["trend"] = trend_label(r.get("trend_yearly"))
        out_rows.append(r)

    out_rows.sort(key=lambda x: (x.get("opportunity") or 0, x.get("volume") or 0), reverse=True)

    csv_path = BASE / "keywords-master.csv"
    fields = [
        "Keyword", "Market", "State", "City", "Volume", "CPC", "Competition", "KD",
        "Intent", "Trend", "SERP Weakness", "Local Intent", "Calculator Intent",
        "Opportunity Score", "Recommended Page Type",
    ]
    with csv_path.open("w", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(f, fieldnames=fields)
        w.writeheader()
        for r in out_rows:
            w.writerow({
                "Keyword": r["keyword"],
                "Market": r.get("market") or "National",
                "State": r.get("state") or "",
                "City": r.get("city") or "",
                "Volume": r.get("volume") or 0,
                "CPC": r.get("cpc") if r.get("cpc") is not None else "",
                "Competition": r.get("competition") or "",
                "KD": r.get("kd") if r.get("kd") is not None else "",
                "Intent": r.get("intent") or "",
                "Trend": r.get("trend") or "",
                "SERP Weakness": r.get("serp_weakness") or "",
                "Local Intent": r.get("local_intent") or "",
                "Calculator Intent": r.get("calculator_intent") or "",
                "Opportunity Score": r.get("opportunity") or "",
                "Recommended Page Type": r.get("page_type") or "",
            })

    print(f"master_keywords={len(out_rows)}")
    print(f"vol>=500={sum(1 for r in out_rows if (r.get('volume') or 0) >= 500)}")
    print(f"kd<=20 and vol>=500={sum(1 for r in out_rows if (r.get('volume') or 0) >= 500 and r.get('kd') is not None and r['kd'] <= 20)}")
    print("TOP 25")
    for r in out_rows[:25]:
        print(f"{r['opportunity']:>5} vol={r.get('volume'):>6} kd={str(r.get('kd')):>4} cpc={str(r.get('cpc')):>6}  {r['keyword']}")

    Path(CACHE / "scored_keywords.json").write_text(json.dumps(out_rows, indent=2), encoding="utf-8")


if __name__ == "__main__":
    main()
