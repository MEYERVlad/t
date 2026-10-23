"""Строит серую коробку уровня L_IrinaFlat: хрущёвка Ирины Соколовой (прихожая, комната, кухня).

Запуск в редакторе Unreal: Tools -> Execute Python Script... -> выбрать этот файл.
Можно запускать повторно: удаляет только свои объекты (метка GEN_).
"""
import unreal

MAP_PATH = "/Game/Maps/L_IrinaFlat"
PREFIX = "GEN_"

actors = unreal.get_editor_subsystem(unreal.EditorActorSubsystem)
levels = unreal.get_editor_subsystem(unreal.LevelEditorSubsystem)

CUBE = unreal.load_asset("/Engine/BasicShapes/Cube.Cube")
CYLINDER = unreal.load_asset("/Engine/BasicShapes/Cylinder.Cylinder")
CASE_OBJECT = unreal.load_class(None, "/Script/BylaVSeti.CaseObjectActor")

H = 250       # потолок хрущёвки
T = 16        # толщина стен
DOOR_H = 205  # высота дверного проёма


def open_or_create_map():
    if unreal.EditorAssetLibrary.does_asset_exist(MAP_PATH):
        levels.load_level(MAP_PATH)
        for actor in actors.get_all_level_actors():
            if actor.get_actor_label().startswith((PREFIX, "DRESS_")):
                actors.destroy_actor(actor)
    else:
        levels.new_level(MAP_PATH)


def finish(actor, label, folder):
    actor.set_actor_label(PREFIX + label)
    actor.set_folder_path(folder)
    return actor


def box(label, center, size, folder="Flat/Geometry", mesh=None):
    actor = actors.spawn_actor_from_object(mesh or CUBE, unreal.Vector(*center))
    actor.set_actor_scale3d(unreal.Vector(size[0] / 100.0, size[1] / 100.0, size[2] / 100.0))
    return finish(actor, label, folder)


def case_object(label, object_id, center, size, mesh=None):
    actor = actors.spawn_actor_from_class(CASE_OBJECT, unreal.Vector(*center))
    actor.set_editor_property("object_id", object_id)
    actor.set_actor_scale3d(unreal.Vector(size[0] / 100.0, size[1] / 100.0, size[2] / 100.0))
    if mesh:
        actor.get_editor_property("mesh").set_static_mesh(mesh)
    return finish(actor, label, "Flat/Case")


def wall_x(label, y, x0, x1, gaps=()):
    """Стена вдоль оси X на линии y, от x0 до x1, с дверными проёмами gaps=[(a, b), ...]."""
    cuts = [x0] + [v for g in sorted(gaps) for v in g] + [x1]
    for i in range(0, len(cuts), 2):
        a, b = cuts[i], cuts[i + 1]
        if b - a > 1:
            box(f"{label}_{i}", ((a + b) / 2, y, H / 2), (b - a, T, H))
    for a, b in gaps:
        box(f"{label}_lintel_{a}", ((a + b) / 2, y, (DOOR_H + H) / 2), (b - a, T, H - DOOR_H))


def wall_y(label, x, y0, y1, gaps=()):
    """Стена вдоль оси Y на линии x."""
    cuts = [y0] + [v for g in sorted(gaps) for v in g] + [y1]
    for i in range(0, len(cuts), 2):
        a, b = cuts[i], cuts[i + 1]
        if b - a > 1:
            box(f"{label}_{i}", (x, (a + b) / 2, H / 2), (T, b - a, H))
    for a, b in gaps:
        box(f"{label}_lintel_{a}", (x, (a + b) / 2, (DOOR_H + H) / 2), (T, b - a, H - DOOR_H))


def floor_and_ceiling(label, x0, x1, y0, y1):
    cx, cy = (x0 + x1) / 2, (y0 + y1) / 2
    sx, sy = (x1 - x0) + T, (y1 - y0) + T
    box(label + "_Floor", (cx, cy, -5), (sx, sy, 10))
    box(label + "_Ceiling", (cx, cy, H + 5), (sx, sy, 10))


def point_light(label, center, radius=700.0):
    actor = actors.spawn_actor_from_class(unreal.PointLight, unreal.Vector(*center))
    comp = actor.get_component_by_class(unreal.PointLightComponent)
    if comp:
        comp.set_attenuation_radius(radius)
    return finish(actor, label, "Flat/Lights")


def build():
    if CASE_OBJECT is None:
        unreal.log_error("[build_irina_flat] Классы проекта не найдены. Сначала соберите C++ (см. INSTALL.md).")
        return

    open_or_create_map()

    # Комната: x 0..400, y 0..350. Прихожая: x -200..0, y 100..250. Кухня: x 0..250, y 350..600.
    floor_and_ceiling("Room", 0, 400, 0, 350)
    floor_and_ceiling("Hall", -200, 0, 100, 250)
    floor_and_ceiling("Kitchen", 0, 250, 350, 600)

    wall_x("Room_S", 0, 0, 400)
    wall_y("Room_E", 400, 0, 350)
    wall_x("Room_N", 350, 0, 400, gaps=[(100, 190)])
    wall_y("Room_W", 0, 0, 350, gaps=[(125, 225)])

    wall_x("Hall_S", 100, -200, 0)
    wall_x("Hall_N", 250, -200, 0)
    wall_y("Hall_W", -200, 100, 250)

    wall_y("Kitchen_W", 0, 350, 600)
    wall_y("Kitchen_E", 250, 350, 600)
    wall_x("Kitchen_N", 600, 0, 250)

    # Мебель комнаты
    box("Sofa", (320, 70, 25), (150, 70, 50), "Flat/Furniture")
    box("Table", (200, 200, 37.5), (100, 70, 75), "Flat/Furniture")
    box("Chair", (200, 130, 22.5), (45, 45, 45), "Flat/Furniture")
    box("Wardrobe", (370, 300, 100), (50, 90, 200), "Flat/Furniture")
    box("Shelf", (28, 300, 50), (40, 80, 100), "Flat/Furniture")

    # Кухня
    box("KitchenTable", (125, 500, 37.5), (90, 60, 75), "Flat/Furniture")
    box("Stove", (220, 560, 42.5), (50, 60, 85), "Flat/Furniture")
    box("Fridge", (30, 570, 90), (50, 50, 180), "Flat/Furniture")

    # Предметы дела
    case_object("AlinaPhone", "alina_phone", (200, 205, 76), (8, 15, 2))
    case_object("AlinaPhoto", "alina_photo", (28, 300, 113), (4, 22, 26))
    case_object("WallCalendar", "wall_calendar", (200, 10, 150), (40, 3, 50))
    case_object("Irina", "irina", (290, 250, 80), (50, 50, 160), CYLINDER)
    case_object("FlatExit", "flat_exit", (-190, 175, 102), (6, 90, 205))

    # Свет
    point_light("Light_Room", (200, 175, 230))
    point_light("Light_Hall", (-100, 175, 230), 400.0)
    point_light("Light_Kitchen", (125, 475, 230), 450.0)

    start = actors.spawn_actor_from_class(unreal.PlayerStart, unreal.Vector(-150, 175, 100))
    start.set_actor_rotation(unreal.Rotator(roll=0, pitch=0, yaw=0), False)
    finish(start, "PlayerStart", "Flat")

    levels.save_current_level()
    unreal.log("[build_irina_flat] Готово.")


build()
