"""Строит серые коробки новых локаций:
  - L_LabArchive: архив ЭКЦ в подвале отдела;
  - L_Prichal:    кафе «Причал»;
  - L_Dacha:      дача «Рассвет», участок 47;
  - L_Court:      зал районного суда.

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
            if actor.get_actor_label().startswith((PREFIX, "DRESS_", "CHAR_")):
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

    # Столики с табуретами: два ряда у стен, посередине свободный проход от входа к стойке (x 330..620).
    for i, (x, y) in enumerate(((220, 200), (720, 200), (220, 330))):
        box(f"Table_{i}", (x, y, 37.5), (80, 80, 75), "Furniture")
        box(f"Stool_{i}_a", (x - 60, y, 22.5), (40, 40, 45), "Furniture")
        box(f"Stool_{i}_b", (x + 60, y, 22.5), (40, 40, 45), "Furniture")

    # Угловой столик Киры
    box("CornerTable", (140, 510, 37.5), (80, 80, 75), "Furniture")
    box("CornerBench", (60, 510, 22.5), (50, 120, 45), "Furniture")

    case_object("Exit", "prichal_exit", (450, 6, 105), (100, 6, 210))
    case_object("Maltsev", "maltsev", (700, 525, 85), (50, 50, 170), CYLINDER)
    case_object("CashJournal", "cash_journal", (560, 470, 112), (25, 32, 3))
    case_object("Kira", "kira", (150, 425, 70), (45, 45, 140), CYLINDER)
    # Света — у столиков, Кулик — у стойки. Оба сбоку от прохода, чтобы не перегораживать его.
    case_object("Svetlana", "svetlana", (355, 265, 82), (45, 45, 164), CYLINDER)
    case_object("Kulik", "kulik", (490, 405, 80), (50, 50, 160), CYLINDER)

    point_light("Light_1", (250, 200, 290))
    point_light("Light_2", (650, 200, 290))
    point_light("Light_3", (650, 480, 290), 600.0)
    point_light("Light_Corner", (140, 500, 250), 400.0)

    player_start((450, 80, 100), 90)
    levels.save_current_level()
    unreal.log("[build_locations] Кафе готово.")


def build_dacha():
    open_or_create_map("/Game/Maps/L_Dacha")
    # Двор участка без потолка: земля, забор, домик, сарай.
    box("Ground", (500, 500, -5), (1200, 1200, 10))
    for i, (c, sz) in enumerate((((500, -95, 75), (1200, 10, 150)), ((500, 1095, 75), (1200, 10, 150)),
                                 ((-95, 500, 75), (10, 1200, 150)), ((1095, 500, 75), (10, 1200, 150)))):
        box(f"Fence_{i}", c, sz, "Fence")

    # Домик (закрытый, просто объём)
    box("House", (250, 800, 175), (400, 350, 350), "Buildings")
    box("HouseRoof", (250, 800, 380), (440, 390, 60), "Buildings")

    # Сарай: три стены и крыша, внутри — пол, под которым всё и было
    box("Shed_Back", (800, 900, 125), (300, 15, 250), "Shed")
    box("Shed_Left", (650, 800, 125), (15, 200, 250), "Shed")
    box("Shed_Right", (950, 800, 125), (15, 200, 250), "Shed")
    box("Shed_Roof", (800, 800, 260), (330, 230, 20), "Shed")
    case_object("ShedFloorFound", "dacha_shed_found", (800, 810, 3), (260, 160, 6))
    case_object("ShedFloorEmpty", "dacha_shed_empty", (800, 810, 4), (260, 160, 6))

    box("OldCar", (400, 300, 70), (420, 180, 140), "Props")
    box("Barrel", (980, 550, 45), (60, 60, 90), "Props", CYLINDER)

    case_object("Gate", "dacha_exit", (500, -85, 100), (160, 8, 200))

    # Светает: несколько ярких точек вместо солнца (серую коробку освещаем просто)
    point_light("Light_Yard_1", (500, 400, 400), 1600.0)
    point_light("Light_Yard_2", (800, 750, 230), 700.0)
    point_light("Light_Yard_3", (200, 200, 400), 1200.0)

    player_start((500, 60, 100), 90)
    levels.save_current_level()
    unreal.log("[build_locations] Дача готова.")


def build_court():
    open_or_create_map("/Game/Maps/L_Court")
    H = 450
    room("Court", 0, 1000, 0, 1400, H)

    # Подиум судьи у северной стены
    box("JudgePodium", (500, 1250, 60), (500, 150, 120), "Furniture")
    box("JudgeDesk", (500, 1200, 135), (400, 40, 30), "Furniture")
    case_object("Judge", "judge", (500, 1290, 200), (55, 55, 160), CYLINDER)

    # Трибуна для выступления, столы сторон, экран видеосвязи с колонией
    box("Tribune", (500, 850, 55), (100, 60, 110), "Furniture")
    box("ProsecutorTable", (250, 950, 37.5), (220, 80, 75), "Furniture")
    box("DefenceTable", (750, 950, 37.5), (220, 80, 75), "Furniture")
    box("VideoScreen", (960, 1000, 220), (10, 220, 130), "Furniture")

    # Ряды для публики
    for r in range(4):
        box(f"Bench_L_{r}", (250, 200 + r * 120, 22.5), (320, 50, 45), "Benches")
        box(f"Bench_R_{r}", (750, 200 + r * 120, 22.5), (320, 50, 45), "Benches")

    case_object("CourtDoor", "court_exit", (500, 8, 110), (140, 8, 220))

    point_light("Light_1", (500, 1100, 420), 1200.0)
    point_light("Light_2", (500, 600, 420), 1200.0)
    point_light("Light_3", (500, 250, 420), 900.0)

    player_start((500, 700, 100), 90)
    levels.save_current_level()
    unreal.log("[build_locations] Суд готов.")


if CASE_OBJECT is None:
    unreal.log_error("[build_locations] Классы проекта не найдены. Сначала соберите C++ (см. INSTALL.md).")
else:
    build_archive()
    build_prichal()
    build_dacha()
    build_court()
    unreal.log("[build_locations] Готово. Откройте Maps/L_Office и нажмите Play.")
