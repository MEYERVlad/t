"""Составляет список 3D-моделей и материалов, добавленных в проект (паки с Fab, Megascans).

Запуск в редакторе Unreal: Tools -> Execute Python Script... -> выбрать этот файл.
Результат: файл Saved/asset_inventory.txt в папке проекта. Пришлите его в чат —
по нему будет написан скрипт, который заменит серые блоки настоящей мебелью и стенами.
"""
import unreal

SKIP_PREFIXES = ("/Game/Maps", "/Game/Characters", "/Game/Data")

registry = unreal.AssetRegistryHelpers.get_asset_registry()
assets = registry.get_assets_by_path("/Game", recursive=True)

meshes = []
materials = []
for data in assets:
    package = str(data.package_name)
    if package.startswith(SKIP_PREFIXES):
        continue
    cls = str(data.asset_class_path.asset_name)
    if cls == "StaticMesh":
        meshes.append(package)
    elif cls in ("Material", "MaterialInstanceConstant"):
        materials.append(package)

lines = [f"Моделей: {len(meshes)}, материалов: {len(materials)}", "", "# МОДЕЛИ: путь | размер X x Y x Z (см)"]

with unreal.ScopedSlowTask(len(meshes), "Составляю список моделей...") as task:
    task.make_dialog(True)
    for path in sorted(meshes):
        if task.should_cancel():
            break
        task.enter_progress_frame(1)
        mesh = unreal.EditorAssetLibrary.load_asset(path)
        size = ""
        if mesh:
            box = mesh.get_bounding_box()
            ext = box.max - box.min
            size = f"{ext.x:.0f} x {ext.y:.0f} x {ext.z:.0f}"
        lines.append(f"{path} | {size}")

lines += ["", "# МАТЕРИАЛЫ"] + sorted(materials)

out = unreal.Paths.project_saved_dir() + "asset_inventory.txt"
with open(out, "w", encoding="utf-8") as f:
    f.write("\n".join(lines))

unreal.log(f"[inventory] Готово: {len(meshes)} моделей, {len(materials)} материалов -> {out}")
