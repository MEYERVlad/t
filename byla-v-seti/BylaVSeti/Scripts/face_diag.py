"""Сбор сведений для мимики MetaHuman. Ничего не меняет в проекте.

Запуск: Tools -> Execute Python Script... -> этот файл (лучше с открытым уровнем L_Office).
Результат: папка Saved/face_diag в папке проекта:
  - face_diag.txt                 — как устроено лицо персонажей и что умеет MetaHuman Animator в этой версии;
  - process_audio_performance.py,
    export_performance.py         — официальные примеры Epic (копии из плагина), если найдены.
Пришлите все файлы из этой папки в чат.
"""
import os
import shutil

import unreal

OUT = os.path.join(unreal.Paths.project_saved_dir(), "face_diag")
os.makedirs(OUT, exist_ok=True)
lines = []


def log(text=""):
    lines.append(str(text))


def prop(obj, name):
    try:
        value = obj.get_editor_property(name)
    except Exception as e:  # noqa: BLE001
        return f"<нет: {e.__class__.__name__}>"
    if hasattr(value, "get_path_name"):
        return value.get_path_name()
    return str(value)


# 1. Лица персонажей на текущем уровне.
log("=== Персонажи на уровне " + unreal.EditorLevelLibrary.get_editor_world().get_name())
actors = unreal.get_editor_subsystem(unreal.EditorActorSubsystem).get_all_level_actors()
for actor in actors:
    if not actor.get_actor_label().startswith("CHAR_"):
        continue
    log(f"\n{actor.get_actor_label()}  ({actor.get_class().get_path_name()})")
    for comp in actor.get_components_by_class(unreal.SkeletalMeshComponent):
        mesh = None
        for getter in ("get_skeletal_mesh_asset", "get_editor_property"):
            try:
                mesh = comp.get_skeletal_mesh_asset() if getter == "get_skeletal_mesh_asset" \
                    else comp.get_editor_property("skeletal_mesh_asset")
                break
            except Exception:  # noqa: BLE001
                continue
        log(f"  [{comp.get_name()}]")
        log(f"     animation_mode = {prop(comp, 'animation_mode')}")
        log(f"     anim_class     = {prop(comp, 'anim_class')}")
        log(f"     leader_pose    = {prop(comp, 'leader_pose_component')}")
        if mesh:
            log(f"     mesh           = {mesh.get_path_name()}")
            log(f"     skeleton       = {prop(mesh, 'skeleton')}")
            log(f"     post_process   = {prop(mesh, 'post_process_anim_blueprint')}")
        else:
            log(f"     mesh           = {prop(comp, 'skeletal_mesh_asset')}")

# 2. Анимационные блупринты лица в проекте.
log("\n=== Анимационные блупринты MetaHuman в проекте")
registry = unreal.AssetRegistryHelpers.get_asset_registry()
for data in registry.get_assets_by_path("/Game/MetaHumans", recursive=True):
    if str(data.asset_class_path.asset_name) == "AnimBlueprint":
        log(f"  {data.package_name}")

# 3. Готовые анимации лица в плагине (для моргания).
log("\n=== Анимации лица в плагине MetaHuman (Idle)")
for data in registry.get_all_assets():
    path = str(data.package_name)
    if path.startswith("/MetaHumanCharacter/") and "Idle" in path and str(data.asset_class_path.asset_name) == "AnimSequence":
        log(f"  {path}")
        anim = unreal.load_asset(path)
        if anim:
            log(f"     skeleton = {prop(anim, 'skeleton')}")

# 4. Что умеет Python MetaHuman Animator в этой версии движка.
log("\n=== Python API MetaHuman Animator")
for name in ("MetaHumanPerformance", "MetaHumanPerformanceExportUtils", "MetaHumanPerformanceExportAnimationSettings",
             "DataInputType", "PerformanceExportRange", "MetaHumanPerformanceExportRange", "ExportAnimationRange"):
    cls = getattr(unreal, name, None)
    if cls is None:
        log(f"  {name}: НЕТ")
        continue
    members = [m for m in dir(cls) if not m.startswith("_")]
    log(f"  {name}: {', '.join(members)}")

# 5. Официальные примеры скриптов Epic из плагина.
log("\n=== Примеры скриптов")
wanted = {"process_audio_performance.py", "export_performance.py", "process_performance.py"}
roots = [unreal.Paths.engine_plugins_dir(), unreal.Paths.project_plugins_dir()]
found = 0
for root in roots:
    root = os.path.abspath(root)
    for dirpath, _dirs, files in os.walk(root):
        if "MetaHuman" not in dirpath:
            continue
        for f in files:
            if f in wanted:
                src = os.path.join(dirpath, f)
                shutil.copy(src, os.path.join(OUT, f))
                log(f"  {src}")
                found += 1
if not found:
    log("  не найдены")

with open(os.path.join(OUT, "face_diag.txt"), "w", encoding="utf-8") as fh:
    fh.write("\n".join(lines) + "\n")
unreal.log("[face_diag] Готово. Пришлите в чат файлы из папки " + OUT)
