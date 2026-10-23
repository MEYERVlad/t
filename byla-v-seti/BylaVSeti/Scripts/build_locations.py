"""Строит серые коробки новых локаций:
  - L_LabArchive: архив ЭКЦ в подвале отдела;
  - L_Prichal:    кафе «Причал».

Запуск в редакторе Unreal: Tools -> Execute Python Script... -> выбрать этот файл.
Можно запускать повторно: удаляет только свои объекты (метка GEN_).
"""
import unreal

PREFIX = "GEN_"

actors = unreal.get_editor_subsystem(unreal.EditorActorSubsystem)
levels = unreal.get_editor_subsystem(unreal.LevelEditorSubsystem)

CUBE = unreal.load_asset("/Engine/BasicShapes/Cube.Cube")
CYLINDER = unreal.load_asset("/Engine/BasicShapes/Cylinder.Cylinder")
CASE_OBJECT = unreal.load_class(None, "/Script/BylaVSeti.CaseObjectActor")

T = 20


def open_or_create_map(path):
    if unreal.EditorAssetLibrary.does_asset_exist(path):
        levels.load_level(path)
        for actor in actors.get_all_level_actors():
            if actor.get_actor_label().startswith(PREFIX):
                actors.destroy_actor(actor)
    else:
        levels.new_level(path)


def finish(actor, label, folder):
    actor.set_actor_label(PREFIX + label)
    actor.set_folder_path(folder)
    return actor


def box(label, center, size, folder="Geometry", mesh=None):
    actor = actors.spawn_actor_from_object(mesh or CUBE, unreal.Vector(*center))
    actor.set_actor_scale3d(unreal.Vector(size[0] / 100.0, size[1] / 100.0, size[2] / 100.0))
    return finish(actor, label, folder)


def case_object(label, object_id, center, size, mesh=None):
    actor = actors.spawn_actor_from_class(CASE_OBJECT, unreal.Vector(*center))
    actor.set_editor_property("object_id", object_id)
    actor.set_actor_scale3d(unreal.Vector(size[0] / 100.0, size[1] / 100.0, size[2] / 100.0))
    if mesh:
        actor.get_editor_property("mesh").set_static_mesh(mesh)
    return finish(actor, label, "Case")


def room(label, x0, x1, y0, y1, h):
    """Закрытая коробка комнаты: пол, потолок, четыре стены."""
    cx, cy, sx, sy = (x0 + x1) / 2, (y0 + y1) / 2, (x1 - x0), (y1 - y0)
    box(label + "_Floor", (cx, cy, -5), (sx + 2 * T, sy + 2 * T, 10))
    box(label + "_Ceiling", (cx, cy, h + 5), (sx + 2 * T, sy + 2 * T, 10))
    box(label + "_Wall_S", (cx, y0 - T / 2, h / 2), (sx + 2 * T, T, h))
    box(label + "_Wall_N", (cx, y1 + T / 2, h / 2), (sx + 2 * T, T, h))
    box(label + "_Wall_W", (x0 - T / 2, cy, h / 2), (T, sy, h))
    box(label + "_Wall_E", (x1 + T / 2, cy, h / 2), (T, sy, h))


def point_light(label, center, radius=800.0):
    actor = actors.spawn_actor_from_class(unreal.PointLight, unreal.Vector(*center))
    comp = actor.get_component_by_class(unreal.PointLightComponent)
    if comp:
        comp.set_attenuation_radius(radius)
    return finish(actor, label, "Lights")


def player_start(center, yaw):
    start = actors.spawn_actor_from_class(unreal.PlayerStart, unreal.Vector(*center))
    start.set_actor_rotation(unreal.Rotator(roll=0, pitch=0, yaw=yaw), False)
    finish(start, "PlayerStart", "")


def build_archive():
    open_or_create_map("/Game/Maps/L_LabArchive")
    H = 280
    room("Archive", 0, 800, 0, 500, H)

    # Ряды стеллажей с коробками
    for i, x in enumerate((300, 450, 600)):
        box(f"Shelf_{i}", (x, 250, 110), (40, 260, 220), "Furniture")
        for j, y in enumerate((150, 220, 290, 360)):
            box(f"ShelfBox_{i}_{j}", (x, y, 150), (36, 50, 30), "Furniture")

    box("ClerkDesk", (150, 80, 37.5), (140, 70, 75), "Furniture")
    box("SideTable", (380, 60, 37.5), (80, 50, 75), "Furniture")
    box("ReadingTable", (520, 455, 37.5), (100, 60, 75), "Furniture")

    case_object("StairsUp", "archive_exit", (6, 250, 110), (6, 100, 220))
    case_object("ClerkJournal", "archive_clerk_desk", (150, 80, 77), (30, 22, 4))
    case_object("StaffFolder", "staff_folder", (380, 60, 77), (25, 32, 3))
    case_object("ExpertiseBox", "expertise_box", (520, 455, 85), (40, 30, 20))
    case_object("CameraCabinet", "camera_cabinet", (760, 90, 90), (60, 80, 180))

    point_light("Light_1", (150, 250, 260), 600.0)
    point_light("Light_2", (375, 250, 260), 600.0)
    point_light("Light_3", (600, 250, 260), 600.0)
    point_light("Light_4", (700, 100, 260), 450.0)

    player_start((80, 250, 100), 0)
    levels.save_current_level()
    unreal.log("[build_locations] Архив готов.")


def build_prichal():
    open_or_create_map("/Game/Maps/L_Prichal")
    H = 320
    room("Cafe", 0, 900, 0, 600, H)

    # Барная стойка вдоль северной стены и стол Мальцева за ней
    box("Counter", (650, 470, 55), (400, 60, 110), "Furniture")
    box("BackShelf", (650, 585, 120), (400, 25, 240), "Furniture")

    # Столики с табуретами
    for i, (x, y) in enumerate(((300, 250), (520, 250), (300, 420), (720, 220))):
        box(f"Table_{i}", (x, y, 37.5), (80, 80, 75), "Furniture")
        box(f"Stool_{i}_a", (x - 60, y, 22.5), (40, 40, 45), "Furniture")
        box(f"Stool_{i}_b", (x + 60, y, 22.5), (40, 40, 45), "Furniture")

    # Угловой столик Киры
    box("CornerTable", (140, 510, 37.5), (80, 80, 75), "Furniture")
    box("CornerBench", (60, 510, 22.5), (50, 120, 45), "Furniture")

    case_object("Exit", "prichal_exit", (450, 6, 105), (100, 6, 210))
    case_object("Maltsev", "maltsev", (700, 525, 85), (50, 50, 170), CYLINDER)
    case_object("CashJournal", "cash_journal", (560, 470, 112), (25, 32, 3))
    case_object("Kira", "kira", (75, 510, 70), (45, 45, 140), CYLINDER)

    point_light("Light_1", (250, 200, 290))
    point_light("Light_2", (650, 200, 290))
    point_light("Light_3", (650, 480, 290), 600.0)
    point_light("Light_Corner", (140, 500, 250), 400.0)

    player_start((450, 80, 100), 90)
    levels.save_current_level()
    unreal.log("[build_locations] Кафе готово.")


if CASE_OBJECT is None:
    unreal.log_error("[build_locations] Классы проекта не найдены. Сначала соберите C++ (см. INSTALL.md).")
else:
    build_archive()
    build_prichal()
    unreal.log("[build_locations] Готово. Откройте Maps/L_Office и нажмите Play.")
