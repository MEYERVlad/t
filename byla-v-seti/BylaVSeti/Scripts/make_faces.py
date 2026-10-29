"""Мимика: делает анимации лица из файлов озвучки (MetaHuman Animator, «Audio Driven Animation»).

Запуск в Unreal: Tools -> Execute Python Script... -> этот файл.
Перед запуском голоса должны лежать в Content/Voice (см. VOICE.md).

Что делает:
  1. Для каждой реплики /Game/Voice/<Id> создаёт анимацию лица /Game/Voice/Face/<Id>:
     губы, моргание, мимика по голосу. Игра сама проигрывает её на лице говорящего.
  2. Делает «спокойное лицо» /Game/Characters/Animations/Face_Idle — моргание и мелкие движения,
     пока персонаж молчит (скрипт сам создаёт почти беззвучный файл Scripts/voice/Face_Idle.wav).
Уже готовые анимации пропускаются: можно прервать (кнопка «Отмена» в окне прогресса) и продолжить потом.
Переделать всё: поставьте FORCE = True.

Один файл обрабатывается 10–60 секунд — на все реплики уйдёт 15–40 минут.
"""
import os

import unreal

FORCE = False
VOICE = "/Game/Voice"
FACE_OUT = "/Game/Voice/Face"
IDLE_OUT = "/Game/Characters/Animations"
# Рабочие файлы обработки — вне папки Voice, чтобы не попасть в игру.
WORK = "/Game/_Editor/FacePerformances"
FACE_SKELETON = "/Game/MetaHumans/Common/Face/Face_Archetype_Skeleton"
IDLE_WAV = os.path.join(os.path.dirname(os.path.abspath(__file__)), "voice", "Face_Idle.wav")

assets = unreal.EditorAssetLibrary
tools = unreal.AssetToolsHelpers.get_asset_tools()
Export = unreal.MetaHumanPerformanceExportUtils


def write_idle_wav():
    """12 секунд почти тишины (тихий шум комнаты): из неё получается спокойное лицо с морганием."""
    import random
    import struct
    import wave
    os.makedirs(os.path.dirname(IDLE_WAV), exist_ok=True)
    rate = 48000
    rnd = random.Random(7)
    data = b"".join(struct.pack("<h", max(-32768, min(32767, int(rnd.gauss(0, 1) * 40)))) for _ in range(rate * 12))
    with wave.open(IDLE_WAV, "wb") as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(rate)
        w.writeframes(data)


def import_idle_sound():
    path = f"{WORK}/Face_Idle_Sound"
    if assets.does_asset_exist(path):
        return path
    if not os.path.exists(IDLE_WAV):
        write_idle_wav()
    task = unreal.AssetImportTask()
    task.set_editor_property("filename", IDLE_WAV)
    task.set_editor_property("destination_path", WORK)
    task.set_editor_property("destination_name", "Face_Idle_Sound")
    task.set_editor_property("automated", True)
    task.set_editor_property("save", True)
    task.set_editor_property("replace_existing", True)
    tools.import_asset_tasks([task])
    return path if assets.does_asset_exist(path) else None


def make_performance(sound_path, name):
    perf_path = f"{WORK}/{name}_Performance"
    if assets.does_asset_exist(perf_path):
        assets.delete_asset(perf_path)
    sound = unreal.load_asset(sound_path)
    perf = tools.create_asset(asset_name=f"{name}_Performance", package_path=WORK,
                              asset_class=unreal.MetaHumanPerformance, factory=unreal.MetaHumanPerformanceFactoryNew())
    # Как в официальном примере Epic process_audio_performance.py.
    perf.set_editor_property("input_type", unreal.DataInputType.AUDIO)
    perf.set_editor_property("audio", sound)
    overrides = unreal.AudioDrivenAnimationSolveOverrides()
    overrides.mood = unreal.AudioDrivenAnimationMood.AUTO_DETECT
    overrides.mood_intensity = 1.0
    perf.set_editor_property("audio_driven_animation_solve_overrides", overrides)
    perf.set_editor_property("audio_driven_animation_output_controls", unreal.AudioDrivenAnimationOutputControls.FULL_FACE)
    # Голову двигает анимация тела — лицо отвечает только за мимику.
    perf.set_editor_property("head_movement_mode", unreal.PerformanceHeadMovementMode.DISABLED)
    return perf


def process(perf):
    perf.set_blocking_processing(True)
    perf.start_pipeline()
    return perf.contains_animation_data()


def export(perf, package_path, asset_name):
    try:
        settings = Export.get_export_animation_sequence_settings(perf)
    except TypeError:
        settings = unreal.MetaHumanPerformanceExportAnimationSettings()
    settings.set_editor_property("show_export_dialog", False)
    settings.set_editor_property("package_path", package_path)
    settings.set_editor_property("asset_name", asset_name)
    settings.set_editor_property("auto_save_anim_sequence", True)
    settings.set_editor_property("export_range", unreal.PerformanceExportRange.WHOLE_SEQUENCE)
    settings.set_editor_property("enable_head_movement", False)
    settings.set_editor_property("export_face", True)
    try:
        settings.set_editor_property("export_body", False)
    except Exception:  # noqa: BLE001
        pass
    skeleton = unreal.load_asset(FACE_SKELETON)
    if skeleton:
        settings.set_editor_property("target_skeleton_or_skeletal_mesh", skeleton)
    try:
        return Export.export_animation_sequence(perf, settings)
    except TypeError:
        return Export.export_animation_sequence(settings, perf)


def job_list():
    jobs = []
    registry = unreal.AssetRegistryHelpers.get_asset_registry()
    for data in registry.get_assets_by_path(VOICE, recursive=False):
        if str(data.asset_class_path.asset_name) != "SoundWave":
            continue
        name = str(data.asset_name)
        if FORCE or not assets.does_asset_exist(f"{FACE_OUT}/{name}"):
            jobs.append((str(data.package_name), FACE_OUT, name))
    if FORCE or not assets.does_asset_exist(f"{IDLE_OUT}/Face_Idle"):
        jobs.insert(0, ("IDLE", IDLE_OUT, "Face_Idle"))
    return jobs


def main():
    jobs = job_list()
    if not jobs:
        unreal.log("[faces] Всё уже готово. Чтобы переделать, поставьте FORCE = True.")
        return
    ok, failed = 0, []
    with unreal.ScopedSlowTask(len(jobs), "Мимика: анимации лица из озвучки") as task:
        task.make_dialog(True)
        for sound_path, out_path, name in jobs:
            if task.should_cancel():
                break
            task.enter_progress_frame(1, f"{name}  ({ok + len(failed) + 1}/{len(jobs)})")
            if sound_path == "IDLE":
                sound_path = import_idle_sound()
                if not sound_path:
                    failed.append(name + " (не удалось импортировать Scripts/voice/Face_Idle.wav)")
                    continue
            try:
                perf = make_performance(sound_path, name)
                if not process(perf):
                    failed.append(name + " (обработка не дала анимации)")
                    continue
                result = export(perf, out_path, name)
                if not assets.does_asset_exist(f"{out_path}/{name}"):
                    failed.append(f"{name} (экспорт не создал файл, ответ: {result})")
                    continue
                ok += 1
                unreal.log(f"[faces] {out_path}/{name}")
            except Exception as e:  # noqa: BLE001
                failed.append(f"{name} ({e})")
    unreal.log(f"[faces] Готово: {ok}, с ошибками: {len(failed)}.")
    for f in failed:
        unreal.log_warning(f"[faces] Ошибка: {f}")


main()
