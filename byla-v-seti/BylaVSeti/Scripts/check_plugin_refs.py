"""Ищет в проекте ассеты, которые ссылаются на папку плагина MetaHuman «Optional».

Такие ссылки дают в Message Log ошибку «Unable to identify a valid mount point»
и не попадут в готовую игру (.exe). Скрипт ничего не меняет, только показывает список.

Запуск: Tools -> Execute Python Script... -> этот файл.
Результат: в Output Log и в файле Saved/plugin_refs.txt (папка проекта).
"""
import os
import unreal

BAD_PREFIX = "/MetaHumanCharacter/Optional/"

registry = unreal.AssetRegistryHelpers.get_asset_registry()
options = unreal.AssetRegistryDependencyOptions(
    include_soft_package_references=True,
    include_hard_package_references=True,
    include_searchable_names=False,
    include_soft_management_references=False,
    include_hard_management_references=False,
)

packages = sorted({str(a.package_name) for a in registry.get_assets_by_path("/Game", recursive=True)})
lines = []
for pkg in packages:
    deps = registry.get_dependencies(pkg, options) or []
    bad = sorted(str(d) for d in deps if str(d).startswith(BAD_PREFIX))
    if bad:
        lines.append(pkg)
        lines.extend("    -> " + d for d in bad)

if lines:
    text = "Ссылки на " + BAD_PREFIX + ":\n" + "\n".join(lines)
    unreal.log_warning("[plugin_refs] " + text)
else:
    text = "Чисто: ни один ассет проекта не ссылается на " + BAD_PREFIX
    unreal.log("[plugin_refs] " + text)

out = os.path.join(unreal.Paths.project_saved_dir(), "plugin_refs.txt")
with open(out, "w", encoding="utf-8") as f:
    f.write(text + "\n")
unreal.log("[plugin_refs] Сохранено в " + out)
