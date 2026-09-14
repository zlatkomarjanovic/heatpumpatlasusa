# Heat Pump Data Sources

Research date: 14 September 2026.

This file documents sources a production calculator and local pages would need. Public does not automatically mean easy to maintain.

## Energy prices

### EIA residential electricity prices
- URL: https://www.eia.gov/electricity/monthly/epm_table_grapher.php?t=epmt_5_6_a
- Also: https://www.eia.gov/electricity/monthly/
- Fields: state-level residential, commercial, industrial cents/kWh; monthly and YTD (tables 5.6.A / 5.6.B)
- Latest used here: June 2026. US residential average 18.34 c/kWh. Hawaii 52.72. California 34.74. Massachusetts 29.61. Maine 29.59. New York 29.49. Nevada 13.11.
- Update frequency: monthly, about two months lagged
- API/download: XLS from Electric Power Monthly; also EIA Open Data API
- Legal: US government work, public domain
- Reliability: high for state averages; poor for the actual tariff a homeowner pays
- Maintenance: easy at state level. Hard if you want utility or TOU rates

### EIA natural gas residential prices
- URL: https://www.eia.gov/dnav/ng/ng_pri_sum_a_EPG0_PRS_DMcf_m.htm
- Fields: state residential $/Mcf or $/therm
- Update frequency: monthly
- Legal: public domain
- Reliability: high for state averages
- Maintenance: easy
- Gap: does not give the customer’s gas utility tariff or fixed customer charges

### EIA heating oil
- URL: https://www.eia.gov/petroleum/heatingoilpropane/
- Fields: weekly heating oil prices, Northeast-heavy coverage
- Update frequency: weekly in heating season
- Legal: public domain
- Reliability: good for Northeast oil markets; weak elsewhere
- Maintenance: medium. Seasonality matters

### EIA propane
- URL: https://www.eia.gov/petroleum/heatingoilpropane/
- Fields: weekly residential propane
- Coverage: incomplete outside heating-fuel states
- Maintenance: medium

### OpenEI Utility Rate Database
- URL: https://openei.org/wiki/Utility_Rate_Database
- Fields: utility tariffs, energy charges, sometimes TOU
- Update frequency: irregular, community + NREL
- Legal: check OpenEI / NREL license. Generally usable with attribution
- Reliability: medium. Many tariffs stale
- Maintenance: hard. This is the difference between a toy calculator and a useful one

## Climate

### NOAA / NCEI climate normals
- URL: https://www.ncei.noaa.gov/products/land-based-station/us-climate-normals
- Fields: temperature normals, HDD/CDD at station level
- Update frequency: 30-year normals plus monthly updates
- Legal: public domain
- Reliability: high
- Maintenance: medium. Need ZIP-to-station mapping

### NREL ResStock
- URL: https://resstock.nrel.gov/datasets
- Fields: housing archetypes, end-use savings shapes, heat pump upgrade packages, Alaska/Hawaii in 2025 release
- Update frequency: periodic research releases
- Legal: NREL data. Typically usable with citation. Confirm license per dataset
- Reliability: high for stock-level modeling, not a single-home audit
- Maintenance: medium. Best used as lookup tables by climate + vintage + fuel, not live simulation

### ASHRAE climate zones / IECC zones
- URL: IECC climate zone maps; DOE climate zone resources
- Fields: climate zone, moist/dry/marine
- Reliability: high
- Maintenance: easy
- Legal: IECC text is copyrighted. Zone maps and DOE summaries are usable. Do not copy code language verbatim

### Design temperatures
- Sources: ASHRAE Handbook Fundamentals; ACCA Manual J
- Legal: copyrighted. You cannot republish tables wholesale
- Practical approach: use NOAA extremes + published Manual J methodology, not scraped ASHRAE tables

## Rebates and incentives

### DSIRE
- URL: https://www.dsireusa.org/
- Fields: state, utility, and local incentive records
- Update frequency: ongoing, but not real-time
- API: limited / licensed in practice. Do not assume free wholesale republishing
- Legal: NC Clean Energy Technology Center. Check terms before scraping or mirroring
- Reliability: best national directory, still lags program pauses
- Maintenance: high. This is the most expensive content surface

### Federal IRA / tax credit sources
- IRS 25C page: https://www.irs.gov/credits-deductions/energy-efficient-home-improvement-credit
- ENERGY STAR tax credit pages: https://www.energystar.gov/about/federal-tax-credits
- DOE home upgrades: https://www.energy.gov/save/home-upgrades
- Finding: 25C expired 31 December 2025 for new installs. Official pages still ranked for “heat pump tax credit” in September 2026 and still read as if the credit is live. This is both a content opportunity and a legal/accuracy risk.
- HEAR / HOMES: state-administered, funded through 2031, launch status uneven. California single-family HEEHRA reserved by February 2026.
- Maintenance: brutal. Do not hard-code dollar amounts in templates

### State program sites
- Mass Save, Efficiency Maine, NYSERDA / NY Clean Heat, Colorado Energy Office, TECH Clean California
- These win branded SERPs. Your page should interpret stacking, not impersonate the portal
- Legal: do not copy program T&Cs. Link out

## Housing

### Census ACS table B25040 (house heating fuel)
- URL: https://data.census.gov/ (table B25040)
- Fields: utility gas, bottled/tank/LP, electricity, fuel oil, coal, wood, solar, other, no fuel
- Geography: nation, state, county, place, ZCTA in many years
- Update frequency: annual
- Legal: public domain
- Reliability: high
- Maintenance: easy yearly refresh
- Why it matters: oil and propane share is the real “heat pump wins on operating cost” filter

### ACS housing age and type
- Tables: B25034 year built, B25024 units in structure
- Use: vintage and single-family vs multifamily assumptions in the calculator

### RECS (EIA Residential Energy Consumption Survey)
- URL: https://www.eia.gov/consumption/residential/
- Fields: end uses, equipment, consumption
- Update frequency: multi-year
- Good for national assumptions, weak for city pages

## Equipment

### ENERGY STAR product lists
- URL: https://www.energystar.gov/
- Fields: certified ASHP, CCHP, HPWH
- Legal: ENERGY STAR marks have brand rules. Data is usable with attribution
- Maintenance: medium

### AHRI Directory
- URL: https://www.ahridirectory.org/
- Fields: certified capacity and efficiency
- Legal: directory terms restrict wholesale scraping. Use for spot checks, not a mirrored catalog
- Maintenance: hard if you try to own the full catalog

## Local cost and labor

### BLS Occupational Employment and Wage Statistics
- URL: https://www.bls.gov/oes/
- Fields: HVAC mechanic wages by metro
- Legal: public domain
- Use: labor-cost index, not installed price

### RSMeans / contractor bid data
- Commercial, licensed, not free
- Better than guessing, expensive to keep current

### Angi / HomeGuide / Homewyse published ranges
- Useful as competitor benchmarks, not as a data license
- Do not scrape and republish their price matrices

## Recommended production pipeline

1. Monthly EIA electricity, gas, oil, propane ingest
2. Annual ACS heating-fuel and housing vintage ingest
3. ZIP to climate zone + HDD/CDD lookup
4. ResStock-derived savings coefficients by climate + existing fuel + vintage
5. Manual rebate registry for 15 launch programs only, reviewed weekly
6. Do not ingest the full DSIRE universe on day one
7. Do not claim live utility-tariff precision until OpenEI/utility parsers are proven

## Sources that look useful and are not enough

- Generic national “average heat pump cost is $X” blogs
- Expired 25C pages
- Pool heat pump calculators ranking for HVAC queries
- UK and Canadian cost pages ranking in US SERPs
