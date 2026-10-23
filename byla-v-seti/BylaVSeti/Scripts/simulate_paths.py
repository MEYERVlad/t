"""Симулятор прохождения: python Scripts/simulate_paths.py

Проходит дело по правилам игры (предметы, допросы, версии на доске, посты, решения) и перебирает
все варианты решений. Между решениями «игрок» делает всё, что может: изучает доступные предметы,
опровергает показания известными уликами, докладывает верные версии (ловушки — нет).
Показывает, к какой концовке ведёт каждая ветка, и находит тупики (нет решений и нет концовки).
"""
import json
import pathlib
import sys

ROOT = pathlib.Path(__file__).resolve().parent.parent / "Content" / "Data" / "Case"


def load(name):
    with open(ROOT / name, encoding="utf-8") as f:
        return json.load(f)


EVIDENCE = {e["id"]: e for e in load("evidence.json")}
FEED = load("feed.json")
HYPS = load("hypotheses.json")
DECISIONS = load("decisions.json")
OBJECTS = load("objects.json")
INTERROGATIONS = {i["id"]: i for i in load("interrogations.json")}
ENDINGS = load("endings.json")
HINTS = load("hints.json")
NO_HINT = []


class State:
    def __init__(self):
        self.flags = set()
        self.evidence = {e for e, v in EVIDENCE.items() if v.get("bStartsKnown")}
        self.published = set()
        self.broken = set()
        self.finished = set()
        self.confirmed = set()
        self.decided = set()
        self.used = set()
        self.trust = 60
        self.ending = None
        self.log = []

    def copy(self):
        s = State.__new__(State)
        for k, v in self.__dict__.items():
            setattr(s, k, v.copy() if isinstance(v, (set, list)) else v)
        return s

    def has(self, flag):
        return not flag or flag in self.flags

    def set_flag(self, flag):
        if not flag or flag in self.flags:
            return
        self.flags.add(flag)
        for item in FEED:
            if item.get("triggerFlag") == flag:
                self.publish(item)
        self.check_endings(flag)

    def publish(self, item):
        if item["id"] in self.published or not self.has(item.get("requiresFlag")):
            return
        if item.get("blockedByFlag") and item["blockedByFlag"] in self.flags:
            return
        self.published.add(item["id"])
        self.evidence.update(item.get("grantsEvidence", []))
        self.trust = max(0, min(100, self.trust + item.get("trustDelta", 0)))
        self.set_flag(item.get("setsFlag"))

    def score(self, iid):
        return sum(1 for st in INTERROGATIONS[iid]["statements"] if (iid, st["id"]) in self.broken)

    def check_endings(self, flag):
        if self.ending:
            return
        for e in ENDINGS:
            if e.get("triggerFlag") != flag:
                continue
            if not all(f in self.flags for f in e.get("requiresAll", [])):
                continue
            if any(f in self.flags for f in e.get("requiresNone", [])):
                continue
            if e.get("scoreInterrogation") and self.score(e["scoreInterrogation"]) < e.get("minScore", 0):
                continue
            self.ending = e["id"]
            return

    def visible_statements(self, iid):
        return [st for st in INTERROGATIONS[iid]["statements"]
                if not st.get("requiresStatement") or (iid, st["requiresStatement"]) in self.broken]

    def explore(self):
        """Делает всё доступное, пока что-то меняется."""
        changed = True
        while changed and not self.ending:
            changed = False
            for o in OBJECTS:
                if not self.has(o.get("requiresFlag")) or not self.has(o.get("showFlag")):
                    continue
                iid = o.get("interrogationId")
                if iid:
                    changed |= self.interrogate(iid)
                    continue
                if o["id"] in self.used:
                    continue
                self.used.add(o["id"])
                self.evidence.update(o.get("evidenceIds", []))
                self.set_flag(o.get("setsFlag"))
                self.log.append("предмет " + o["id"])
                changed = True
            for h in HYPS:
                if h["id"] in self.confirmed or h.get("bTrap") or not self.has(h.get("requiresFlag")):
                    continue
                if all(l["a"] in self.evidence and l["b"] in self.evidence for l in h["links"]):
                    self.confirmed.add(h["id"])
                    self.set_flag(h.get("setsFlag"))
                    self.log.append("версия " + h["id"])
                    changed = True

    def interrogate(self, iid):
        i = INTERROGATIONS[iid]
        changed = False
        progress = True
        while progress:
            progress = False
            for st in self.visible_statements(iid):
                key = (iid, st["id"])
                if key in self.broken:
                    continue
                answers = ([st["contradictedBy"]] if st.get("contradictedBy") else []) + st.get("alsoContradictedBy", [])
                if any(a in self.evidence for a in answers):
                    self.broken.add(key)
                    self.evidence.update(st.get("grantsEvidence", []))
                    self.set_flag(st.get("setsFlag"))
                    self.log.append(f"допрос {iid}/{st['id']}")
                    progress = changed = True
        req = i.get("requiredStatements", [])
        if req and iid not in self.finished and all((iid, r) in self.broken for r in req):
            self.finished.add(iid)
            self.evidence.update(i.get("finishEvidence", []))
            self.set_flag(i.get("finishFlag"))
            changed = True
        return changed

    def current_hint(self):
        for h in HINTS:
            if self.has(h.get("requiresFlag")) and not any(f in self.flags for f in h.get("doneFlags", [])):
                return h["id"]
        return None

    def available_decisions(self):
        return [d for d in DECISIONS if d["id"] not in self.decided and self.has(d.get("requiresFlag"))]


def choose(state, d, idx):
    s = state.copy()
    s.decided.add(d["id"])
    s.set_flag("decided_" + d["id"])
    s.set_flag(d["options"][idx]["setsFlag"])
    s.log.append(f"РЕШЕНИЕ {d['id']} -> {d['options'][idx]['label']}")
    return s


def run():
    start = State()
    start.set_flag("start")
    results = []
    stack = [(start, [])]
    while stack:
        state, path = stack.pop()
        state.explore()
        if state.ending:
            results.append((path, state))
            continue
        if not state.current_hint():
            NO_HINT.append(path)
        options = state.available_decisions()
        # Суд завершаем последним: пока есть другие решения, их принимаем раньше.
        others = [d for d in options if d["id"] != "close_hearing"]
        pick = others or options
        if not pick:
            results.append((path, state))
            continue
        d = pick[0]
        for idx, opt in enumerate(d["options"]):
            stack.append((choose(state, d, idx), path + [f"{d['id']}={idx + 1}"]))
        if d["id"] == "close_hearing":
            # Небрежный игрок: закрывает суд, ответив только на первые два вопроса.
            lazy = state.copy()
            court = [st["id"] for st in INTERROGATIONS["court"]["statements"]]
            lazy.broken = {k for k in lazy.broken if k[0] != "court" or k[1] in court[:2]}
            stack.append((choose(lazy, d, 0), path + ["суд-кое-как"]))
    return results


def main():
    results = run()
    by_ending = {}
    dead = []
    for path, state in results:
        if state.ending:
            by_ending.setdefault(state.ending, []).append((path, state))
        else:
            dead.append((path, state))

    print(f"Веток: {len(results)}")
    for e in ENDINGS:
        items = by_ending.get(e["id"], [])
        print(f"\n«{e['title']}» ({e['id']}): {len(items)} веток")
        for path, state in items[:4]:
            court = state.score("court") if "court" in INTERROGATIONS else "-"
            print(f"   {' '.join(path)}   | суд {court}/6, улик {len(state.evidence)}, доверие {state.trust}")

    if NO_HINT:
        print("\nНЕТ ПОДСКАЗКИ в ветках:")
        for path in NO_HINT[:10]:
            print("  ", " ".join(path) or "(начало)")
    missing = [e["id"] for e in ENDINGS if e["id"] not in by_ending]
    if dead:
        print("\nТУПИКИ (нет решений и нет концовки):")
        for path, state in dead:
            print("  ", " ".join(path), "| флаги:", sorted(state.flags)[-8:])
    if missing:
        print("\nНЕДОСТИЖИМЫЕ КОНЦОВКИ:", missing)
    if dead or missing or NO_HINT:
        sys.exit(1)
    print("\nOK: все концовки достижимы, тупиков нет.")


if __name__ == "__main__":
    main()
