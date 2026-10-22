"""Проверка данных дела: python Scripts/validate_case.py (из папки проекта).

Ищет ссылки на несуществующие улики, флаги, которые нигде не выставляются,
и посты/предметы/решения, до которых невозможно дойти.
"""
import json
import pathlib
import sys

ROOT = pathlib.Path(__file__).resolve().parent.parent / "Content" / "Data" / "Case"


def load(name):
    with open(ROOT / name, encoding="utf-8") as f:
        return json.load(f)


evidence = {e["id"]: e for e in load("evidence.json")}
feed = load("feed.json")
hyps = load("hypotheses.json")
decisions = load("decisions.json")
objects = load("objects.json")
interrogations = {i["id"]: i for i in load("interrogations.json")}
load("ui_strings.json")

errors = []


def check_ev(where, ev_id):
    if ev_id not in evidence:
        errors.append(f"{where}: неизвестная улика '{ev_id}'")


for item in feed:
    for e in item.get("grantsEvidence", []):
        check_ev(f"feed/{item['id']}", e)
for h in hyps:
    for link in h["links"]:
        check_ev(f"hypothesis/{h['id']}", link["a"])
        check_ev(f"hypothesis/{h['id']}", link["b"])
for o in objects:
    for e in o.get("evidenceIds", []):
        check_ev(f"object/{o['id']}", e)
    if o.get("interrogationId") and o["interrogationId"] not in interrogations:
        errors.append(f"object/{o['id']}: неизвестный допрос '{o['interrogationId']}'")
for iid, i in interrogations.items():
    ids = {st["id"] for st in i["statements"]}
    for st in i["statements"]:
        if st.get("contradictedBy"):
            check_ev(f"interrogation/{iid}/{st['id']}", st["contradictedBy"])
        for e in st.get("grantsEvidence", []):
            check_ev(f"interrogation/{iid}/{st['id']}", e)
        if st.get("requiresStatement") and st["requiresStatement"] not in ids:
            errors.append(f"interrogation/{iid}/{st['id']}: неизвестное показание '{st['requiresStatement']}'")
    for r in i.get("requiredStatements", []):
        if r not in ids:
            errors.append(f"interrogation/{iid}: requiredStatements содержит неизвестное '{r}'")
    for e in i.get("finishEvidence", []):
        check_ev(f"interrogation/{iid}", e)

# Достижимость флагов: повторяем, пока множество растёт.
flags = {"start"}
published = set()
while True:
    before = len(flags)
    for item in feed:
        trig = item.get("triggerFlag")
        req = item.get("requiresFlag") or ""
        if trig in flags and (not req or req in flags):
            published.add(item["id"])
            if item.get("setsFlag"):
                flags.add(item["setsFlag"])
    for o in objects:
        req = o.get("requiresFlag") or ""
        if not req or req in flags:
            if o.get("setsFlag"):
                flags.add(o["setsFlag"])
    for h in hyps:
        req = h.get("requiresFlag") or ""
        if (not req or req in flags) and h.get("setsFlag"):
            flags.add(h["setsFlag"])
    for o in objects:
        req = o.get("requiresFlag") or ""
        iid = o.get("interrogationId")
        if iid and (not req or req in flags):
            i = interrogations[iid]
            for st in i["statements"]:
                if st.get("contradictedBy") and st.get("setsFlag"):
                    flags.add(st["setsFlag"])
            if i.get("finishFlag"):
                flags.add(i["finishFlag"])
    for d in decisions:
        req = d.get("requiresFlag") or ""
        if not req or req in flags:
            flags.add("decided_" + d["id"])
            for opt in d["options"]:
                if opt.get("setsFlag"):
                    flags.add(opt["setsFlag"])
    if len(flags) == before:
        break

for item in feed:
    if item["id"] not in published:
        errors.append(f"feed/{item['id']}: никогда не публикуется (флаг '{item.get('triggerFlag')}' недостижим)")
for o in objects:
    req = o.get("requiresFlag") or ""
    if req and req not in flags:
        errors.append(f"object/{o['id']}: требует недостижимый флаг '{req}'")
for d in decisions:
    req = d.get("requiresFlag") or ""
    if req and req not in flags:
        errors.append(f"decision/{d['id']}: требует недостижимый флаг '{req}'")

if errors:
    print("ОШИБКИ:")
    for e in errors:
        print("  -", e)
    sys.exit(1)

print(f"OK: улик {len(evidence)}, постов {len(feed)}, версий {len(hyps)}, "
      f"решений {len(decisions)}, предметов {len(objects)}, допросов {len(interrogations)}, достижимых флагов {len(flags)}")
