"""Собирает сценарий озвучки из данных дела (interrogations.json).

Запуск обычным Python (не в Unreal):  python Scripts/make_vo_script.py
Пишет:
  - VO_SCRIPT.md               — сценарий для записи: по персонажам, имя файла, текст, как играть;
  - Scripts/voice/lines.json   — те же реплики для генератора голоса (tts_silero.py).

Имя файла реплики = её Id в игре. Игра ищет звук /Game/Voice/<Id> (например, artem__never_touched).
"""
import json
import os
import re

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA = os.path.join(ROOT, "Content", "Data", "Case", "interrogations.json")

# Кто говорит и каким голосом (для генератора; при своей записи — подсказка, как звучать).
CAST = {
    "artem": {"name": "Артём Лаптев, 27", "voice": "aidar", "pitch": "medium", "rate": "medium",
              "about": "Чинит телефоны. Защищается, злится, но под этим — страх за брата."},
    "irina": {"name": "Ирина Соколова, 52", "voice": "baya", "pitch": "low", "rate": "slow",
              "about": "Мать Алины. Десять лет горя. Говорит тихо и устало, иногда срывается."},
    "kira": {"name": "Кира Ланская, 33", "voice": "kseniya", "pitch": "medium", "rate": "medium",
             "about": "Бывший криминалист. Собранная, нервная, держит лицо, пока не ломается."},
    "maltsev": {"name": "Сергей Мальцев, 55", "voice": "eugene", "pitch": "low", "rate": "fast",
                "about": "Хозяин кафе. Громкий, грубый, привык давить."},
    "svetlana": {"name": "Света Котова, 29", "voice": "xenia", "pitch": "medium", "rate": "medium",
                 "about": "Подруга Алины, официантка. Боится, но хочет, чтобы правду узнали."},
    "kulik": {"name": "Кулик, 60+", "voice": "aidar", "pitch": "x-low", "rate": "slow",
              "about": "Понятой. Пьющий, помятый, виноватый. Говорит хрипло и с паузами."},
    "court": {"name": "Судья Ракитин, 61", "voice": "eugene", "pitch": "medium", "rate": "slow",
              "about": "Судья. Строго, ровно, официально. Каждое слово весомо."},
}

HINTS = {
    "statement": "Показание. Уверенно, как будто это правда.",
    "yes": "Показание опровергнуто: сдаётся, признаётся, меняется тон.",
    "no": "Неверная улика: отмахивается, раздражён или удивлён.",
    "wrong": "Неверная улика (общая фраза): отмахивается.",
    "live": "Реакция на пост, который пришёл прямо во время допроса.",
}
COURT_HINTS = {
    "statement": "Вопрос суда. Строго, по-деловому.",
    "yes": "Суд принимает довод. Твёрдо, официально.",
    "no": "Довод не принят. Сухо.",
    "wrong": "Довод не принят. Сухо.",
    "live": "Реакция суда.",
}

# Чтение чисел и латиницы для генератора голоса (в субтитрах остаётся как было).
TTS_FIX = [
    ("22:00", "двадцать два ноль ноль"),
    ("22:14", "двадцать два четырнадцать"),
    ("22:17", "двадцать два семнадцать"),
    ("23:40", "двадцать три сорок"),
    ("21:10", "двадцать один десять"),
    ("4,2 км", "четыре и две десятых километра"),
    ("в 3 км", "в трёх километрах"),
    ("VPN", "ви пи эн"),
    ("BMW", "бэ эм вэ"),
    ("АЗС", "а зэ эс"),
    ("«О.»", "«О»"),
]


def tts_text(text):
    t = text
    for a, b in TTS_FIX:
        t = t.replace(a, b)
    # Ремарки в скобках не читаются: вместо них пауза.
    t = re.sub(r"\([^)]*\)", " ... ", t)
    t = re.sub(r"\s+", " ", t).strip()
    return t


def stage_notes(text):
    return "; ".join(re.findall(r"\(([^)]*)\)", text))


def collect():
    data = json.load(open(DATA, encoding="utf-8-sig"))
    lines = []
    for it in data:
        iid = it["id"]

        def add(vid, kind, text):
            if text:
                lines.append({"id": vid, "who": iid, "kind": kind, "text": text,
                              "tts": tts_text(text), "notes": stage_notes(text)})

        for st in it.get("statements", []):
            base = f"{iid}__{st['id']}"
            add(base, "statement", st.get("text"))
            add(base + "__yes", "yes", st.get("reaction"))
            add(base + "__no", "no", st.get("wrongReaction"))
        add(f"{iid}__no", "wrong", it.get("wrongReaction"))
        for lr in it.get("liveReactions", []):
            add(f"{iid}__live__{lr['feedId']}", "live", lr.get("text"))
    return lines


def write_markdown(lines, path):
    out = ["# Сценарий озвучки «Была в сети»", "",
           f"Всего реплик: **{len(lines)}**. Записывайте по персонажу за раз — так проще держать голос.", "",
           "Формат файла: **WAV**, моно, 44100 или 48000 Гц, 16 бит. Имя файла — ровно как в колонке «Файл» + `.wav`.",
           "Ремарки в скобках (садится, долго молчит) не читаются — это подсказка, что делать паузу или как звучать.",
           "Перед первой фразой и после последней оставьте полсекунды тишины, затем обрежьте лишнее.", ""]
    for who, cast in CAST.items():
        mine = [l for l in lines if l["who"] == who]
        if not mine:
            continue
        hints = COURT_HINTS if who == "court" else HINTS
        out += [f"## {cast['name']}", "", f"_{cast['about']}_", "",
                "| Файл | Текст | Как играть |", "|---|---|---|"]
        for l in mine:
            how = hints[l["kind"]] + (f" Ремарка: {l['notes']}." if l["notes"] else "")
            text = l["text"].replace("|", "/")
            out.append(f"| `{l['id']}` | {text} | {how} |")
        out.append("")
    with open(path, "w", encoding="utf-8") as f:
        f.write("\n".join(out))


def main():
    lines = collect()
    os.makedirs(os.path.join(ROOT, "Scripts", "voice"), exist_ok=True)
    with open(os.path.join(ROOT, "Scripts", "voice", "lines.json"), "w", encoding="utf-8") as f:
        json.dump({"cast": CAST, "lines": lines}, f, ensure_ascii=False, indent=1)
    write_markdown(lines, os.path.join(ROOT, "VO_SCRIPT.md"))
    print(f"Реплик: {len(lines)} -> VO_SCRIPT.md, Scripts/voice/lines.json")


if __name__ == "__main__":
    main()
