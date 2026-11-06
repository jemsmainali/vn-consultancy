"""Build per-country university lists from official registers.

Usage: python -I scripts/build_university_lists.py <registers_dir> vn-frontend/src/data/destinations/universities
<registers_dir> holds the downloaded files: hd2023.zip (IPEDS), fr.csv (MESR open data export),
hs_liste.txt (Hochschulkompass), cricos-institutions.csv and cricos-locations.csv (data.gov.au CRICOS).
Writes <slug>.json with { country, lastVerified, regionLabel, scope, sources, universities[] }.
Every row comes from a register file or an official page read on CHECKED; nothing is filled in by hand
except the Ireland and New Zealand rows below, which are copied from the official pages named in `sources`.
"""
import csv, json, os, re, sys, zipfile

REG, OUT = sys.argv[1], sys.argv[2]
CHECKED = "2026-11-06"
os.makedirs(OUT, exist_ok=True)


def website(url):
    url = (url or "").strip()
    if not url:
        return ""
    if not re.match(r"^https?://", url, re.I):
        url = "http://" + url  # browsers upgrade to HTTPS where the site supports it
    return url if re.match(r"^https?://[^\s\"'<>]+$", url) else ""


def tidy(name):
    return re.sub(r"\s+", " ", name).strip()


def write(slug, country, region_label, scope, sources, rows):
    rows = sorted(rows, key=lambda r: r["name"].casefold())
    for r in rows:
        r["vnGroupPartner"] = False  # only set true from an explicit partner record
    data = {"country": country, "lastVerified": CHECKED, "regionLabel": region_label, "scope": scope, "sources": sources, "universities": rows}
    with open(os.path.join(OUT, f"{slug}.json"), "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, separators=(",", ":"))
    missing = [r for r in rows if not r["name"]]
    print(f"{slug}: {len(rows)} rows, {sum(1 for r in rows if r['website'])} with website, missing name: {len(missing)}")


# ---------- United States: IPEDS HD2023 ----------
US_STATES = {"AL": "Alabama", "AK": "Alaska", "AZ": "Arizona", "AR": "Arkansas", "CA": "California", "CO": "Colorado", "CT": "Connecticut", "DE": "Delaware", "DC": "District of Columbia", "FL": "Florida", "GA": "Georgia", "HI": "Hawaii", "ID": "Idaho", "IL": "Illinois", "IN": "Indiana", "IA": "Iowa", "KS": "Kansas", "KY": "Kentucky", "LA": "Louisiana", "ME": "Maine", "MD": "Maryland", "MA": "Massachusetts", "MI": "Michigan", "MN": "Minnesota", "MS": "Mississippi", "MO": "Missouri", "MT": "Montana", "NE": "Nebraska", "NV": "Nevada", "NH": "New Hampshire", "NJ": "New Jersey", "NM": "New Mexico", "NY": "New York", "NC": "North Carolina", "ND": "North Dakota", "OH": "Ohio", "OK": "Oklahoma", "OR": "Oregon", "PA": "Pennsylvania", "RI": "Rhode Island", "SC": "South Carolina", "SD": "South Dakota", "TN": "Tennessee", "TX": "Texas", "UT": "Utah", "VT": "Vermont", "VA": "Virginia", "WA": "Washington", "WV": "West Virginia", "WI": "Wisconsin", "WY": "Wyoming", "PR": "Puerto Rico", "GU": "Guam", "VI": "U.S. Virgin Islands", "AS": "American Samoa", "MP": "Northern Mariana Islands", "FM": "Micronesia", "MH": "Marshall Islands", "PW": "Palau"}
CONTROL = {"1": "Public", "2": "Private non-profit", "3": "Private for-profit"}
with zipfile.ZipFile(os.path.join(REG, "hd2023.zip")) as z:
    name = next(n for n in z.namelist() if n.lower().endswith(".csv"))
    text = z.read(name).decode("cp1252")
rows = []
for r in csv.DictReader(text.splitlines()):
    # SECTOR 0 = administrative unit (system or district office), not a school.
    if not (r["ICLEVEL"] == "1" and r["DEGGRANT"] == "1" and r["CYACTIVE"] == "1" and r["SECTOR"] != "0"):
        continue
    levels = []
    if r["UGOFFER"] == "1":
        levels.append("Bachelor's")
    if r["GROFFER"] == "1":
        levels.append("Postgraduate")
    if r["HDEGOFR1"] in ("11", "12"):
        levels.append("Doctorate (research)")
    state = US_STATES.get(r["STABBR"], r["STABBR"])
    rows.append({"name": tidy(r["INSTNM"]), "place": f"{r['CITY'].strip()}, {r['STABBR']}", "regions": [state], "type": CONTROL.get(r["CONTROL"], ""), "levels": levels, "website": website(r["WEBADDR"])})
write("united-states", "United States", "State", "Active four-year, degree-granting institutions (colleges and universities) in the U.S. Department of Education's IPEDS directory, 2023-24 collection.",
      [{"label": "IPEDS Institutional Characteristics, Directory information (HD2023), National Center for Education Statistics", "url": "https://nces.ed.gov/ipeds/datacenter/DataFiles.aspx"}], rows)

# ---------- France: MESR principaux établissements ----------
FR_TYPES = {"Université": "University", "Grand établissement": "Grand établissement", "École": "School (école)", "Autre établissement": "Other institution"}
rows = []
for r in csv.DictReader(open(os.path.join(REG, "fr.csv"), encoding="utf-8-sig"), delimiter=";"):
    kind = FR_TYPES.get(r["type_d_etablissement"], r["type_d_etablissement"])
    sector = {"public": "Public", "privé": "Private"}.get(r["secteur_d_etablissement"], "")
    rows.append({"name": tidy(r["uo_lib"]), "place": r["com_nom"].strip(), "regions": [r["reg_nom"].strip()] if r["reg_nom"].strip() else [], "type": " · ".join(x for x in (kind, sector) if x), "levels": [], "website": website(r["url"])})
write("france", "France", "Region", "Main higher education institutions (universities, grands établissements and écoles) listed by the French Ministry of Higher Education and Research.",
      [{"label": "Principaux établissements d'enseignement supérieur, Ministère de l'Enseignement supérieur et de la Recherche (open data)", "url": "https://data.enseignementsup-recherche.gouv.fr/explore/dataset/fr-esr-principaux-etablissements-enseignement-superieur/"}], rows)

# ---------- Germany: Hochschulkompass (HRK) ----------
DE_TYPES = {"Universitäten": "University", "Fachhochschulen / HAW": "University of applied sciences", "Künstlerische Hochschulen": "Art and music university", "Verwaltungshochschule": "Public administration college", "Hochschulen eigenen Typs": "Other higher education institution"}
DE_SECTOR = {"öffentlich-rechtlich": "Public", "privat, staatlich anerkannt": "Private, state-recognised", "kirchlich, staatlich anerkannt": "Church, state-recognised"}
DE_STATES = {"Baden-Württemberg": "Baden-Württemberg", "Bayern": "Bavaria", "Berlin": "Berlin", "Brandenburg": "Brandenburg", "Bremen": "Bremen", "Hamburg": "Hamburg", "Hessen": "Hesse", "Mecklenburg-Vorpommern": "Mecklenburg-Western Pomerania", "Niedersachsen": "Lower Saxony", "Nordrhein-Westfalen": "North Rhine-Westphalia", "Rheinland-Pfalz": "Rhineland-Palatinate", "Saarland": "Saarland", "Sachsen": "Saxony", "Sachsen-Anhalt": "Saxony-Anhalt", "Schleswig-Holstein": "Schleswig-Holstein", "Thüringen": "Thuringia"}
text = open(os.path.join(REG, "hs_liste.txt"), "rb").read().decode("cp1252")
rows = []
for r in csv.DictReader(text.splitlines(), delimiter="\t"):
    kind = DE_TYPES.get(r["Hochschultyp"], r["Hochschultyp"])
    sector = DE_SECTOR.get(r["Trägerschaft"], "")
    levels = ["Doctorate (research)"] if r["Promotionsrecht"].startswith("Ja") else []
    state = r["Bundesland"].strip()
    rows.append({"name": tidy(r["Hochschulname"]), "place": r["Ort (Hausanschrift)"].strip(), "regions": [DE_STATES.get(state, state)] if state else [], "type": " · ".join(x for x in (kind, sector) if x), "levels": levels, "website": website(r["Home Page"])})
write("germany", "Germany", "State", "All state-recognised higher education institutions in the Hochschulkompass of the German Rectors' Conference (HRK). \"Doctorate\" marks institutions with the right to award doctoral degrees.",
      [{"label": "Hochschulkompass, list of higher education institutions (Hochschulrektorenkonferenz)", "url": "https://www.hochschulkompass.de/hochschulen/downloads.html"}], rows)

# ---------- Australia: CRICOS ----------
AU_STATES = {"NSW": "New South Wales", "VIC": "Victoria", "QLD": "Queensland", "WA": "Western Australia", "SA": "South Australia", "TAS": "Tasmania", "ACT": "Australian Capital Territory", "NT": "Northern Territory"}
locations = {}
for r in csv.DictReader(open(os.path.join(REG, "cricos-locations.csv"), encoding="utf-8-sig")):
    if r["State"].strip() in AU_STATES:
        locations.setdefault(r["CRICOS Provider Code"], set()).add(AU_STATES[r["State"].strip()])
NOT_UNIVERSITY = re.compile(r"\bcollege\b|\bpty\b|enterprises|\bkaplan\b", re.I)
by_name = {}
for r in csv.DictReader(open(os.path.join(REG, "cricos-institutions.csv"), encoding="utf-8-sig")):
    inst, trading = r["Institution Name"], r["Trading Name"]
    if NOT_UNIVERSITY.search(inst):
        continue
    if re.search(r"\buniversity\b", inst, re.I):
        name = inst
    else:
        name = next((t for t in re.split(r"[,;]", trading) if re.search(r"\buniversity\b", t, re.I)), "")
        if not name or NOT_UNIVERSITY.search(name):
            continue
    name = tidy(re.sub(r"\s*\([^)]*\)", "", name))
    name = re.sub(r"\s+(Limited|Ltd)$", "", name)
    state = AU_STATES.get(r["Postal Address State"].strip(), "")
    regions = locations.get(r["CRICOS Provider Code"]) or ({state} if state else set())
    if name in by_name:  # one university, several CRICOS codes
        by_name[name]["regions"] = sorted(set(by_name[name]["regions"]) | regions)
        by_name[name]["website"] = by_name[name]["website"] or website(r["Website"])
        continue
    by_name[name] = {"name": name, "place": "", "regions": sorted(regions), "type": {"Government": "Public", "Private": "Private"}.get(r["Institution Type"], ""), "levels": [], "website": website(r["Website"])}
write("australia", "Australia", "State or territory", "Universities registered on CRICOS, the Australian Government register of providers that may teach overseas students. Pathway colleges, university colleges and English-language centres are not included. States are where the university has registered CRICOS locations.",
      [{"label": "CRICOS Institutions and Locations, Department of Education (data.gov.au), data as at 2 November 2026", "url": "https://data.gov.au/data/dataset/cricos"}], list(by_name.values()))

# ---------- Ireland: HEA list and institution pages ----------
HEA = "https://hea.ie/higher-education-institutions/"
ie = [
    ("Atlantic Technological University", "Technological University", ["Galway", "Mayo", "Sligo", "Donegal"], "https://www.atu.ie/"),
    ("Dublin City University", "University", ["Dublin"], "http://www.dcu.ie"),
    ("Dun Laoghaire Institute of Art and Design & Technology", "Institute of art, design and technology", ["Dublin"], "http://www.iadt.ie"),
    ("Dundalk Institute of Technology", "Institute of technology", ["Dundalk"], "http://www.dkit.ie"),
    ("Mary Immaculate College", "College of education and liberal arts", ["Limerick"], "http://www.mic.ul.ie/"),
    ("Maynooth University", "University", ["Maynooth"], "http://www.maynoothuniversity.ie"),
    ("Munster Technological University", "Technological University", ["Cork", "Kerry"], "https://www.mtu.ie/"),
    ("National College of Art & Design", "College of art and design", ["Dublin"], "http://www.ncad.ie/"),
    ("RCSI University of Medicine and Health Sciences", "Health sciences university", ["Dublin"], "http://www.rcsi.ie"),
    ("South East Technological University", "Technological University", ["Waterford", "Carlow", "Wexford", "Wicklow"], "https://www.setu.ie/"),
    ("Technological University Dublin", "Technological University", ["Dublin"], "http://www.tudublin.ie"),
    ("Technological University Shannon: Midlands Midwest", "Technological University", ["Limerick", "Athlone"], "https://tus.ie/"),
    ("Trinity College Dublin", "University", ["Dublin"], "http://www.tcd.ie"),
    ("University College Cork", "University", ["Cork"], "http://www.ucc.ie"),
    ("University College Dublin", "University", ["Dublin"], "http://www.ucd.ie"),
    ("University of Galway", "University", ["Galway"], "http://www.universityofgalway.ie/"),
    ("University of Limerick", "University", ["Limerick"], "http://www.ul.ie"),
]
write("ireland", "Ireland", "City or county", "Higher education institutions listed by the Higher Education Authority (HEA). The Royal Irish Academy, also on the HEA list, is a learned society rather than a teaching institution and is not included.",
      [{"label": "Higher education institutions, Higher Education Authority", "url": HEA}],
      [{"name": n, "place": ", ".join(c), "regions": c, "type": t, "levels": [], "website": website(w)} for n, t, c, w in ie])

# ---------- New Zealand: Universities New Zealand ----------
nz = [
    ("Waipapa Taumata Rau, University of Auckland", "https://www.auckland.ac.nz/en.html"),
    ("Auckland University of Technology", "https://www.aut.ac.nz/"),
    ("University of Waikato", "https://www.waikato.ac.nz/"),
    ("Te Kunenga ki Pūrehuroa Massey University", "https://www.massey.ac.nz/"),
    ("Te Herenga Waka—Victoria University of Wellington", "https://www.wgtn.ac.nz/"),
    ("Te Whare Wānanga o Waitaha | University of Canterbury", "https://www.canterbury.ac.nz/"),
    ("Te Whare Wānaka o Aoraki Lincoln University", "https://www.lincoln.ac.nz/"),
    ("University of Otago - Ōtākou Whakaihu Waka", "https://www.otago.ac.nz/"),
]
write("new-zealand", "New Zealand", "", "New Zealand's eight universities, as listed by Universities New Zealand – Te Pōkai Tara.",
      [{"label": "Introducing NZ's eight universities, Universities New Zealand – Te Pōkai Tara", "url": "https://www.universitiesnz.ac.nz/universities"}],
      [{"name": n, "place": "", "regions": [], "type": "University", "levels": [], "website": website(w)} for n, w in nz])
