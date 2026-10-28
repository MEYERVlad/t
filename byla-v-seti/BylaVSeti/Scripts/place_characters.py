"""Ставит готовых MetaHuman-персонажей на место серых цилиндров во всех локациях.

Запуск в редакторе Unreal: Tools -> Execute Python Script... -> выбрать этот файл.
Можно запускать повторно (старые расставленные персонажи с меткой CHAR_ удаляются и ставятся заново)
и в любой момент: если персонаж ещё не создан, он просто пропускается, цилиндр остаётся.

Что делает для каждого найденного персонажа (BP_MHC_<Имя>, где угодно в проекте):
  - ставит его на место цилиндра, ногами на пол, лицом к точке, куда смотрит персонаж;
  - включает спокойную анимацию стояния;
  - прячет серый цилиндр (зона для кнопки E остаётся);
  - связывает персонажа с цилиндром: кто появляется по сюжету (Кира, Света, Кулик),
    появится вместе с цилиндром.
"""
import math
import unreal

actors = unreal.get_editor_subsystem(unreal.EditorActorSubsystem)
levels = unreal.get_editor_subsystem(unreal.LevelEditorSubsystem)
registry = unreal.AssetRegistryHelpers.get_asset_registry()

CHAR = "CHAR_"
IDLE_ANIM_NAME = "AS_MH_Neutral_Stand_Idle_Loop"

# MetaHuman смотрит вдоль оси +Y, когда поворот актора равен 0. Если персонажи окажутся
# повёрнуты боком или спиной — поменяйте это число на 0, 90 или 180 и запустите скрипт снова.
FACING_OFFSET = -90.0

# уровень, цилиндр (метка без GEN_), имя персонажа (BP_MHC_<имя>), точка, на которую он смотрит (x, y)
CHARACTERS = [
    ("/Game/Maps/L_Office", "Artem", "Artem", (695, 200)),
    ("/Game/Maps/L_IrinaFlat", "Irina", "Irina", (200, 175)),
    ("/Game/Maps/L_Prichal", "Kira", "Kira", (200, 510)),
    ("/Game/Maps/L_Prichal", "Maltsev", "Maltsev", (700, 300)),
    ("/Game/Maps/L_Prichal", "Svetlana", "Svetlana", (450, 80)),
    ("/Game/Maps/L_Prichal", "Kulik", "Kulik", (300, 300)),
    ("/Game/Maps/L_Court", "Judge", "Judge", (500, 850)),
]


_all_assets = None


def find_asset_by_name(name, class_name=None):
    """Ищет ассет по имени во всём проекте (включая плагины)."""
    global _all_assets
    if _all_assets is None:
        _all_assets = registry.get_all_assets()
    for data in _all_assets:
        if str(data.asset_name) != name:
            continue
        if class_name and str(data.asset_class_path.asset_name) != class_name:
            continue
        return data
    return None


def find_blueprint(char_name):
    data = find_asset_by_name(f"BP_MHC_{char_name}", "Blueprint")
    if data is None:
        return None
    return unreal.EditorAssetLibrary.load_blueprint_class(str(data.package_name))


def find_idle():
    """Берёт копию анимации из проекта (/Game). Анимацию из папки плагина Optional
    игра не грузит надёжно и не кладёт в .exe, поэтому её используем только как запасной вариант."""
    global _all_assets
    _all_assets = registry.get_all_assets()  # свежий список: копию могли сделать только что
    plugin_copy = None
    for data in _all_assets:
        if str(data.asset_name) != IDLE_ANIM_NAME:
            continue
        path = str(data.package_name)
        if path.startswith("/Game/"):
            unreal.log(f"[characters] Анимация стояния: {path}")
            return unreal.load_asset(path)
        plugin_copy = path
    if plugin_copy:
        unreal.log_warning(
            f"[characters] {IDLE_ANIM_NAME} есть только внутри плагина ({plugin_copy}). "
            "Сделайте копию в проект (CHARACTERS.md, шаг «Анимация в проект») и запустите скрипт снова. "
            "Пока ставлю анимацию из плагина: в редакторе работает, но в Message Log будут ошибки.")
        return unreal.load_asset(plugin_copy)
    return None


def from_plugin(asset):
    return asset is not None and asset.get_path_name().startswith("/MetaHumanCharacter/")


def set_idle(actor, idle):
    for comp in actor.get_components_by_class(unreal.SkeletalMeshComponent):
        # Убираем ссылки на превью-анимации из плагина (лицо и т.п.), они дают ошибки загрузки.
        if comp.get_name() != "Body" and comp.get_editor_property("animation_mode") == unreal.AnimationMode.ANIMATION_SINGLE_NODE:
            data = comp.get_editor_property("animation_data")
            if from_plugin(data.get_editor_property("anim_to_play")):
                data.set_editor_property("anim_to_play", None)
                comp.set_editor_property("animation_data", data)
        if idle is not None and comp.get_name() == "Body":
            comp.set_editor_property("animation_mode", unreal.AnimationMode.ANIMATION_SINGLE_NODE)
            data = comp.get_editor_property("animation_data")
            data.set_editor_property("anim_to_play", idle)
            data.set_editor_property("saved_looping", True)
            data.set_editor_property("saved_playing", True)
            comp.set_editor_property("animation_data", data)


def place_level(level_path, entries, idle):
    if not unreal.EditorAssetLibrary.does_asset_exist(level_path):
        unreal.log_warning(f"[characters] Нет уровня {level_path} — сначала build-скрипты.")
        return 0
    levels.load_level(level_path)
    all_actors = actors.get_all_level_actors()
    for a in all_actors:
        # Удаляем прошлую расстановку и персонажей, поставленных вручную (BP_MHC_...).
        if a.get_actor_label().startswith(CHAR) or a.get_class().get_name().startswith("BP_MHC_"):
            actors.destroy_actor(a)
    gen = {a.get_actor_label(): a for a in actors.get_all_level_actors()}

    placed = 0
    for cylinder_name, char_name, look_at in entries:
        cylinder = gen.get("GEN_" + cylinder_name)
        bp = find_blueprint(char_name)
        if cylinder is None:
            unreal.log_warning(f"[characters] На уровне нет цилиндра GEN_{cylinder_name}.")
            continue
        if bp is None:
            unreal.log(f"[characters] BP_MHC_{char_name} ещё не создан — пропускаю, цилиндр остаётся.")
            cylinder.set_editor_property("hide_mesh", False)
            cylinder.set_editor_property("linked_actors", [])
            continue

        origin, extent = cylinder.get_actor_bounds(False)
        floor_z = origin.z - extent.z
        angle = math.degrees(math.atan2(look_at[1] - origin.y, look_at[0] - origin.x))

        person = actors.spawn_actor_from_class(bp, unreal.Vector(origin.x, origin.y, floor_z))
        # Корень MetaHuman — на уровне ступней, поэтому ставим прямо на пол.
        person.set_actor_rotation(unreal.Rotator(roll=0, pitch=0, yaw=angle + FACING_OFFSET), False)
        person.set_actor_label(f"{CHAR}{char_name}")
        person.set_folder_path("Characters")
        set_idle(person, idle)

        cylinder.set_actor_hidden_in_game(False)   # видимостью теперь управляет игра
        cylinder.set_editor_property("hide_mesh", True)
        cylinder.set_editor_property("linked_actors", [person])
        placed += 1

    levels.save_current_level()
    return placed


def main():
    idle = find_idle()
    if idle is None:
        unreal.log_warning(f"[characters] Анимация {IDLE_ANIM_NAME} не найдена — персонажи будут без анимации.")
    by_level = {}
    for level, cylinder, char, look in CHARACTERS:
        by_level.setdefault(level, []).append((cylinder, char, look))
    total = 0
    # Кабинет последним, чтобы редактор остался в нём.
    for level in sorted(by_level, key=lambda p: p.endswith("L_Office")):
        total += place_level(level, by_level[level], idle)
    unreal.log(f"[characters] Готово: расставлено персонажей — {total}.")


main()
