"""Строит серую коробку уровня L_Office: кабинет следователя + допросная.

Запуск в редакторе Unreal: Tools -> Execute Python Script... -> выбрать этот файл.
Скрипт можно запускать повторно: он удаляет всё, что создал раньше (объекты с меткой GEN_), и строит заново.
Ваши собственные объекты на уровне он не трогает.
"""
import unreal

MAP_PATH = "/Game/Maps/L_Office"
PREFIX = "GEN_"

actors = unreal.get_editor_subsystem(unreal.EditorActorSubsystem)
levels = unreal.get_editor_subsystem(unreal.LevelEditorSubsystem)

CUBE = unreal.load_asset("/Engine/BasicShapes/Cube.Cube")
CYLINDER = unreal.load_asset("/Engine/BasicShapes/Cylinder.Cylinder")

CASE_OBJECT = unreal.load_class(None, "/Script/BylaVSeti.CaseObjectActor")
LAPTOP = unreal.load_class(None, "/Script/BylaVSeti.LaptopActor")


def open_or_create_map():
    if unreal.EditorAssetLibrary.does_asset_exist(MAP_PATH):
        levels.load_level(MAP_PATH)
        removed = 0
        for actor in actors.get_all_level_actors():
            if actor.get_actor_label().startswith((PREFIX, "DRESS_")):
                actors.destroy_actor(actor)
                removed += 1
        unreal.log(f"[build_office] Уровень открыт, удалено старых объектов: {removed}")
    else:
        levels.new_level(MAP_PATH)
        unreal.log("[build_office] Создан новый уровень " + MAP_PATH)


def finish(actor, label, folder):
    actor.set_actor_label(PREFIX + label)
    actor.set_folder_path(folder)
    return actor


def box(label, center, size, folder="Office/Geometry", mesh=None):
    """Куб с центром center (см) и размером size (см)."""
    actor = actors.spawn_actor_from_object(mesh or CUBE, unreal.Vector(*center))
    actor.set_actor_scale3d(unreal.Vector(size[0] / 100.0, size[1] / 100.0, size[2] / 100.0))
    return finish(actor, label, folder)


def case_object(label, object_id, center, size, mesh=None):
    actor = actors.spawn_actor_from_class(CASE_OBJECT, unreal.Vector(*center))
    actor.set_editor_property("object_id", object_id)
    actor.set_actor_scale3d(unreal.Vector(size[0] / 100.0, size[1] / 100.0, size[2] / 100.0))
    if mesh:
        actor.get_editor_property("mesh").set_static_mesh(mesh)
    return finish(actor, label, "Office/Case")


def point_light(label, center, radius=900.0):
    actor = actors.spawn_actor_from_class(unreal.PointLight, unreal.Vector(*center))
    comp = actor.get_component_by_class(unreal.PointLightComponent)
    if comp:
        comp.set_attenuation_radius(radius)
    return finish(actor, label, "Office/Lights")


def build():
    if CASE_OBJECT is None or LAPTOP is None:
        unreal.log_error("[build_office] Классы проекта не найдены. Сначала соберите C++ (см. INSTALL.md).")
        return

    open_or_create_map()

    H = 300  # высота потолка
    T = 20   # толщина стен

    # --- Кабинет следователя: x 0..600, y 0..500
    box("Office_Floor", (300, 250, -5), (620, 520, 10))
    box("Office_Ceiling", (300, 250, H + 5), (620, 520, 10))
    box("Office_Wall_S", (300, -T / 2, H / 2), (640, T, H))
    box("Office_Wall_N", (300, 500 + T / 2, H / 2), (640, T, H))
    box("Office_Wall_W", (-T / 2, 250, H / 2), (T, 520, H))
    # Восточная стена с дверным проёмом y 180..280 в допросную.
    box("Office_Wall_E1", (600, 90, H / 2), (T, 180, H))
    box("Office_Wall_E2", (600, 390, H / 2), (T, 220, H))
    box("Office_Wall_E_Lintel", (600, 230, 260), (T, 100, 80))

    # --- Допросная: x 600..1000, y 0..400
    box("Interrogation_Floor", (800, 200, -5), (420, 420, 10), "Interrogation/Geometry")
    box("Interrogation_Ceiling", (800, 200, H + 5), (420, 420, 10), "Interrogation/Geometry")
    box("Interrogation_Wall_S", (800, -T / 2, H / 2), (420, T, H), "Interrogation/Geometry")
    box("Interrogation_Wall_N", (800, 400 + T / 2, H / 2), (420, T, H), "Interrogation/Geometry")
    box("Interrogation_Wall_E", (1000 + T / 2, 200, H / 2), (T, 420, H), "Interrogation/Geometry")

    # --- Мебель кабинета
    box("Desk", (300, 400, 37.5), (160, 80, 75), "Office/Furniture")
    box("Chair", (300, 320, 22.5), (50, 50, 45), "Office/Furniture")
    box("SideTable", (60, 120, 37.5), (60, 120, 75), "Office/Furniture")
    box("Cabinet", (550, 460, 90), (80, 60, 180), "Office/Furniture")
    box("Cabinet2", (450, 470, 90), (80, 50, 180), "Office/Furniture")

    # --- Предметы дела на столе
    laptop = actors.spawn_actor_from_class(LAPTOP, unreal.Vector(300, 395, 76))
    laptop.set_actor_rotation(unreal.Rotator(roll=0, pitch=0, yaw=180), False)
    finish(laptop, "Laptop", "Office/Case")

    case_object("CaseFolder", "case_folder", (225, 400, 79), (32, 24, 8))
    case_object("LoginPrintout", "login_printout", (370, 390, 76.5), (21, 30, 1))
    case_object("DeskPhone", "desk_phone", (360, 425, 79), (20, 14, 8))
    case_object("ForumPrintout", "forum_printout", (60, 110, 76.5), (21, 30, 1))

    # --- Акт 2: второй том дела на полке и ключи от машины на стене у двери
    box("Shelf", (40, 400, 45), (60, 100, 90), "Office/Furniture")
    case_object("CaseVolume2", "case_volume_2", (40, 400, 94), (30, 22, 8))
    # Доска с ключами: каждая связка — своя поездка.
    box("KeyBoard", (4, 300, 140), (6, 110, 40), "Office/Furniture")
    case_object("CarKeys", "car_keys", (10, 260, 140), (6, 14, 10))
    case_object("CarKeysPrichal", "car_keys_prichal", (10, 286, 140), (6, 14, 10))
    case_object("CarKeysDacha", "car_keys_dacha", (10, 314, 140), (6, 14, 10))
    case_object("CarKeysCourt", "car_keys_court", (10, 340, 140), (6, 14, 10))

    # --- Дверь в подвал (архив ЭКЦ) в южной стене
    case_object("ArchiveDoor", "archive_door", (450, 4, 102), (90, 6, 205))

    # --- Допросная: стол, стулья, Артём (пока цилиндр-манекен)
    box("Interrogation_Table", (800, 200, 37.5), (140, 90, 75), "Interrogation/Furniture")
    box("Interrogation_Chair_Player", (695, 200, 22.5), (45, 45, 45), "Interrogation/Furniture")
    box("Interrogation_Chair_Suspect", (905, 260, 22.5), (45, 45, 45), "Interrogation/Furniture")
    case_object("Artem", "interrogation_artem", (910, 200, 85), (50, 50, 170), CYLINDER)

    # --- Свет
    point_light("Light_Office_1", (180, 250, 270))
    point_light("Light_Office_2", (420, 250, 270))
    point_light("Light_Interrogation", (800, 200, 270), 700.0)

    # --- Точка появления игрока
    start = actors.spawn_actor_from_class(unreal.PlayerStart, unreal.Vector(150, 120, 100))
    start.set_actor_rotation(unreal.Rotator(roll=0, pitch=0, yaw=50), False)
    finish(start, "PlayerStart", "Office")

    levels.save_current_level()
    unreal.log("[build_office] Готово. Нажмите Play (Alt+P).")


build()
