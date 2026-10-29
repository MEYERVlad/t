"""Черновая озвучка всех реплик бесплатным русским синтезом речи Silero (работает без интернета после загрузки модели).

Запускать на своём компьютере через make_voices.bat (он сам поставит нужные библиотеки).
Можно и вручную:  python tts_silero.py            — озвучить всё, чего ещё нет в папке out
                  python tts_silero.py kira       — только Киру
                  python tts_silero.py --force    — переозвучить всё заново

Результат: папка out рядом с этим файлом, в ней <Id>.wav для каждой реплики.
Дальше: перетащить файлы из out в Unreal, в папку Content/Voice (см. VOICE.md).

ВАЖНО про лицензию: модели Silero бесплатны для некоммерческого использования.
Для стрима и показа друзьям — подходит. Для платного релиза (RuStore) голоса нужно записать самим.
"""
import json
import os
import sys
import urllib.request
import wave

HERE = os.path.dirname(os.path.abspath(__file__))
MODEL_URL = "https://models.silero.ai/models/tts/ru/v4_ru.pt"
MODEL_PATH = os.path.join(HERE, "v4_ru.pt")
OUT = os.path.join(HERE, "out")
RATE = 48000


def load_model():
    import torch
    if not os.path.exists(MODEL_PATH):
        print("Скачиваю модель голоса (~100 МБ, один раз)...")
        urllib.request.urlretrieve(MODEL_URL, MODEL_PATH)
    model = torch.package.PackageImporter(MODEL_PATH).load_pickle("tts_models", "model")
    model.to(torch.device("cpu"))
    torch.set_num_threads(max(1, (os.cpu_count() or 4) - 1))
    return model


def ssml(text, pitch, rate):
    text = text.replace("&", " и ").replace("<", " ").replace(">", " ")
    return f'<speak><prosody pitch="{pitch}" rate="{rate}">{text}</prosody></speak>'


def save_wav(path, audio):
    import numpy as np
    pcm = (np.clip(audio.numpy(), -1.0, 1.0) * 32767).astype("<i2")
    # Полсекунды тишины в конце, чтобы фраза не обрывалась.
    pcm = np.concatenate([pcm, np.zeros(RATE // 4, dtype="<i2")])
    with wave.open(path, "wb") as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(RATE)
        w.writeframes(pcm.tobytes())


def main():
    args = [a for a in sys.argv[1:] if not a.startswith("--")]
    force = "--force" in sys.argv
    data = json.load(open(os.path.join(HERE, "lines.json"), encoding="utf-8"))
    cast = data["cast"]
    lines = [l for l in data["lines"] if not args or l["who"] in args]
    os.makedirs(OUT, exist_ok=True)

    model = load_model()
    done = 0
    for i, line in enumerate(lines, 1):
        path = os.path.join(OUT, line["id"] + ".wav")
        if os.path.exists(path) and not force:
            continue
        c = cast[line["who"]]
        print(f"[{i}/{len(lines)}] {line['id']}")
        audio = model.apply_tts(ssml_text=ssml(line["tts"], c["pitch"], c["rate"]), speaker=c["voice"],
                                sample_rate=RATE, put_accent=True, put_yo=True)
        save_wav(path, audio)
        done += 1
    print(f"Готово: новых файлов {done}. Папка: {OUT}")


if __name__ == "__main__":
    main()
