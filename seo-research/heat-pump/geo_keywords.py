#!/usr/bin/env python3
"""Generate geo keyword lists for DataForSEO overview batches."""
import json
from pathlib import Path

OUT = Path(r"C:\Users\PC\Desktop\heatpumpatlasusa\seo-research\heat-pump\cache")

STATES = [
    "alabama","alaska","arizona","arkansas","california","colorado","connecticut",
    "delaware","florida","georgia","hawaii","idaho","illinois","indiana","iowa",
    "kansas","kentucky","louisiana","maine","maryland","massachusetts","michigan",
    "minnesota","mississippi","missouri","montana","nebraska","nevada",
    "new hampshire","new jersey","new mexico","new york","north carolina",
    "north dakota","ohio","oklahoma","oregon","pennsylvania","rhode island",
    "south carolina","south dakota","tennessee","texas","utah","vermont",
    "virginia","washington","west virginia","wisconsin","wyoming"
]

STATE_PATTERNS = [
    "heat pump cost {g}",
    "heat pump installation cost {g}",
    "heat pump rebates {g}",
    "mini split cost {g}",
    "heat pump vs furnace {g}",
]

CITIES = [
    "new york","los angeles","chicago","houston","phoenix","philadelphia",
    "san antonio","san diego","dallas","san jose","austin","jacksonville",
    "fort worth","columbus","charlotte","indianapolis","san francisco","seattle",
    "denver","oklahoma city","nashville","washington dc","el paso","las vegas",
    "boston","detroit","portland","louisville","memphis","baltimore","milwaukee",
    "albuquerque","tucson","fresno","sacramento","mesa","kansas city","atlanta",
    "omaha","colorado springs","raleigh","virginia beach","long beach","miami",
    "oakland","minneapolis","tulsa","tampa","arlington","new orleans","wichita",
    "cleveland","bakersfield","aurora","anaheim","honolulu","santa ana","riverside",
    "corpus christi","lexington","henderson","stockton","saint paul","cincinnati",
    "pittsburgh","greensboro","st louis","lincoln","orlando","irvine","newark",
    "durham","chula vista","toledo","fort wayne","st petersburg","laredo",
    "jersey city","chandler","madison","lubbock","scottsdale","buffalo","gilbert",
    "reno","glendale","norfolk","richmond","boise","spokane","baton rouge","tacoma",
    "des moines","rochester","yonkers","albany","syracuse","worcester","springfield",
    "providence","hartford","new haven","bridgeport","stamford","manchester",
    "burlington","concord","bangor","anchorage","fairbanks","billings","missoula",
    "fargo","sioux falls","cheyenne","salt lake city","provo","bozeman",
    "grand rapids","ann arbor","lansing","flint","duluth","green bay","appleton",
    "peoria","rockford","akron","allentown","harrisburg","scranton","erie",
    "trenton","wilmington","annapolis","frederick","charlottesville","roanoke",
    "charleston","huntington","asheville","savannah","columbia","greenville",
    "tallahassee","fort lauderdale","west palm beach","birmingham","huntsville",
    "mobile","knoxville","chattanooga","shreveport","jackson","little rock",
    "boulder","fort collins","santa fe","flagstaff","eugene","salem","bend",
    "olympia","cambridge","quincy","lowell","nashua","lewiston","rutland",
    "white plains","poughkeepsie","ithaca","binghamton","utica","newburgh",
]

CITY_PATTERNS_PRIMARY = [
    "heat pump cost {g}",
    "heat pump installation cost {g}",
    "mini split cost {g}",
]

CITY_PATTERNS_REBATE = [
    "heat pump rebates {g}",
    "heat pump rebate {g}",
]

HIGH_REBATE_CITIES = [
    "boston","worcester","springfield","cambridge","portland","manchester",
    "burlington","providence","hartford","new haven","albany","buffalo",
    "rochester","syracuse","new york","newark","jersey city","philadelphia",
    "pittsburgh","baltimore","washington","denver","boulder","seattle",
    "portland","minneapolis","st paul","chicago","detroit","ann arbor",
    "san francisco","oakland","sacramento","los angeles","san diego",
    "honolulu","anchorage","richmond","norfolk","raleigh","charlotte",
    "asheville","madison","milwaukee","columbus","cleveland","cincinnati",
]


def unique_keep_order(seq):
    seen = set()
    out = []
    for x in seq:
        if x not in seen:
            seen.add(x)
            out.append(x)
    return out


def main():
    state_kws = []
    for st in STATES:
        for p in STATE_PATTERNS:
            state_kws.append(p.format(g=st))
    # also common abbreviations / demonyms that actually get searched
    extras = [
        "heat pump cost massachusetts","heat pump rebates massachusetts",
        "mass save heat pump rebate","nyserda heat pump rebate",
        "heat pump rebates new york","heat pump cost maine",
        "efficiency maine heat pump rebate","heat pump rebates vermont",
        "heat pump rebates connecticut","heat pump rebates california",
        "heat pump rebates colorado","heat pump rebates minnesota",
        "heat pump rebates illinois","heat pump rebates new jersey",
        "heat pump rebates maryland","heat pump rebates oregon",
        "heat pump rebates washington","heat pump rebates rhode island",
        "heat pump cost texas","heat pump cost florida","heat pump cost california",
        "mini split cost florida","mini split cost texas","mini split cost california",
        "heat pump vs furnace minnesota","heat pump vs furnace massachusetts",
        "heat pump vs furnace maine","heat pump vs furnace michigan",
        "heat pump vs oil maine","heat pump vs oil vermont","heat pump vs oil new york",
        "heat pump vs oil massachusetts","heat pump vs propane maine",
        "heat pump vs gas new york","heat pump vs gas massachusetts",
        "con edison heat pump rebate","national grid heat pump rebate",
        "pseg heat pump rebate","eversource heat pump rebate",
        "xcel energy heat pump rebate","pge heat pump rebate",
        "sce heat pump rebate","duke energy heat pump rebate",
        "comed heat pump rebate","bge heat pump rebate",
    ]
    state_kws = unique_keep_order(state_kws + extras)

    city_names = unique_keep_order(CITIES)
    city_kws = []
    for city in city_names:
        for p in CITY_PATTERNS_PRIMARY:
            city_kws.append(p.format(g=city))
    for city in unique_keep_order(HIGH_REBATE_CITIES):
        for p in CITY_PATTERNS_REBATE:
            city_kws.append(p.format(g=city))
    city_kws = unique_keep_order(city_kws)

    (OUT / "geo_state_keywords.json").write_text(json.dumps(state_kws, indent=2), encoding="utf-8")
    (OUT / "geo_city_keywords.json").write_text(json.dumps(city_kws, indent=2), encoding="utf-8")
    print(f"state_keywords={len(state_kws)}")
    print(f"city_keywords={len(city_kws)}")
    print("CITY SAMPLE", city_kws[:8])
    # print batches of 700
    print("state batches", (len(state_kws)+699)//700)
    print("city batches", (len(city_kws)+699)//700)


if __name__ == "__main__":
    main()
