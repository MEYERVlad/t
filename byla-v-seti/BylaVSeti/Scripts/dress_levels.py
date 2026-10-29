"""Оформляет серые коробки ассетами из ваших паков (RestaurantScene, Downtown_West, PN_interactiveSpruceForest,
DetectiveOffice, TeenagerRoom).

Запуск в редакторе Unreal: Tools -> Execute Python Script... -> выбрать этот файл.
Запускать ПОСЛЕ скриптов build_*.py. Можно запускать повторно: старое оформление (метка DRESS_) удаляется.

Что делает:
  - надевает материалы на стены, полы, потолки и мебель во всех локациях;
  - кафе «Причал»: настоящие столы, стулья, диван, полки, лампы, пол, стены, жалюзи;
  - дача: деревянный забор, ели вокруг участка, земля, листва;
  - суд: деревянные скамьи;
  - кабинет: стол, кресло, шкафы, сейф, коробки с делами, деревянные панели, доска с уликами и нитями;
  - предметы дела везде (компьютер, папки, телефон, ключи, двери): модели поверх серых блоков,
    серый блок в игре невидим и остаётся зоной для кнопки E;
  - квартира: шкаф, диван, гитара и часы Алины.
Стены, полы и предметы дела (то, с чем взаимодействует игрок) остаются на месте: меняется только внешний вид.

Если какой-то ассет не найден, скрипт пропустит его и напишет предупреждение в Output Log.
Материалы для каждой локации можно поменять в таблицах ниже.
"""
import math
import unreal

actors = unreal.get_editor_subsystem(unreal.EditorActorSubsystem)
levels = unreal.get_editor_subsystem(unreal.LevelEditorSubsystem)

GEN = "GEN_"
DRESS = "DRESS_"

# ---------------------------------------------------------------- ассеты

R = "/Game/RestaurantScene"
D = "/Game/Downtown_West"
F = "/Game/PN_interactiveSpruceForest"

MAT = {
    "plaster": f"{R}/Materials/MI_PlasterWall",
    "paint": f"{R}/Materials/MI_WallPaint",
    "paint2": f"{R}/Materials/MI_WallPaint_2",
    "epoxy": f"{R}/Materials/MI_EpoxyFlooring",
    "wood": f"{R}/Materials/MI_WoodTrim",
    "furniture": f"{R}/Materials/MI_BoothChairTableTrim",
    "furniture2": f"{R}/Materials/MI_BoothChairTableTrim_2",
    "metal": f"{R}/Materials/MI_Metal",
    "concrete_tiles": f"{D}/Materials/Ground_Shared/MI_Concrete_Ground_Tiles_A_WS",
    "concrete": f"{D}/Materials/Ground_Shared/MI_Concrete_Stamped_A_WS",
    "dirt": f"{D}/Materials/Ground_Shared/MI_Dirt_Gardens_A_WS",
    "plaster_a": f"{D}/Materials/Buildings_Shared/MI_Building_Plaster_A",
    "plaster_b": f"{D}/Materials/Buildings_Shared/MI_Building_Plaster_B",
    "plaster_c": f"{D}/Materials/Buildings_Shared/MI_Building_Plaster_C",
    "wood_brown": f"{D}/Materials/Buildings_Shared/MI_Building_Wood_Trim_Brown",
    "wood_grey": f"{D}/Materials/Buildings_Shared/MI_Building_Wood_Trim_Grey",
    "wood_dark": f"{D}/Materials/Buildings_Shared/MI_Building_Wood_Trim_DarkGrey",
    "roof": f"{D}/Materials/Buildings_Shared/MI_Building_Wood_Brick_Trim_C_Darker",
    "painted_metal": f"{D}/Materials/General_Shared/MI_Painted_Metal_Trim_A",
    "painted_white": f"{D}/Materials/General_Shared/MI_Painted_Metal_Trim_A_White",
    "bricks": f"{D}/Materials/Buildings_Shared/MI_Building_Bricks_A_red_WS",
}

MESH = {
    "chair": f"{R}/Meshes/SM_Chair",
    "table": f"{R}/Meshes/SM_Table",
    "booth": f"{R}/Meshes/SM_Booth",
    "shelves": f"{R}/Meshes/SM_WallShelves",
    "lamp": f"{R}/Meshes/SM_CeilingLamp",
    "floor": f"{R}/Meshes/SM_Floor",
    "wall": f"{R}/Meshes/SM_Wall01",
    "blind": f"{R}/Meshes/SM_VenetianBlind02",
    "plant": f"{R}/Meshes/SM_PlantPot",
    "chalkboard": f"{R}/Meshes/SM_Chalkboard",
    "painting1": f"{R}/Meshes/SM_WallPainting_1",
    "painting2": f"{R}/Meshes/SM_WallPainting_2",
    "bottle1": f"{R}/Meshes/SM_Winebottle_1",
    "bottle2": f"{R}/Meshes/SM_Winebottle_2",
    "bottle3": f"{R}/Meshes/SM_Winebottle_3",
    "mug": f"{R}/Meshes/SM_CoffeMug",
    "napkins": f"{R}/Meshes/SM_NapkinDispenser",
    "newspaper": f"{R}/Meshes/SM_NewsPaper",
    "cart": f"{R}/Meshes/SM_UtilityCart",
    "bench": f"{D}/Assets/props/prop_bench_wood/SM_bench_wood_a",
    "fence_a": f"{D}/Assets/props/prop_fence_wood/SM_wood_fence_wood_fence_a",
    "fence_b": f"{D}/Assets/props/prop_fence_wood/SM_wood_fence_wood_fence_b",
    "fence_c": f"{D}/Assets/props/prop_fence_wood/SM_wood_fence_wood_fence_c",
    "pot": f"{D}/Assets/props/prop_pots/SM_pot_b",
    "leaves": f"{D}/Assets/foliage/leaves_piles/SM_leafpiles_ground_leaves_pile_c",
    "leaves2": f"{D}/Assets/foliage/leaves_piles/SM_leafpiles_ground_leaves_pile_b",
    "bush": f"{D}/Assets/foliage/bush/SM_bush_a",
    "grass": f"{D}/Assets/foliage/grass_patches/SM_grass_patch_a_large",
    "spruce1": f"{F}/Meshes/full/low/spruce_full_01_low",
    "spruce2": f"{F}/Meshes/full/low/spruce_full_02_low",
    "spruce3": f"{F}/Meshes/full/low/spruce_full_03_low",
    "spruce_half": f"{F}/Meshes/half/low/spruce_half_02_low",
    "spruce_small": f"{F}/Meshes/small/spruce_small_03",
}

# Паки DetectiveOffice и TeenagerRoom: двери, предметы дела, мебель кабинета и квартиры.
DO = "/Game/DetectiveOffice/StaticMeshes"
TR = "/Game/TeenagerRoom/Placeable"
MESH.update({
    "door": f"{DO}/SM_door_Baked_0021",
    "keys": f"{DO}/SM_key_set_001",
    "phone": f"{DO}/SM_phone",
    "paper_stack": f"{DO}/SM_Table_stack_2",
    "books": f"{TR}/SM_Place_FewBooks",
    "pc": f"{TR}/SM_Place_PC",
    "office_desk": f"{DO}/SM_office_desk_2",
    "office_chair": f"{DO}/SM_office_chair_2",
    "cabinet_tall": f"{DO}/SM_wooden_cabinet_1_Baked",
    "cabinet_low": f"{DO}/SM_wooden_cabinet_2_001_Baked_039",
    "box_big": f"{DO}/SM_box_1_001",
    "box_small": f"{DO}/SM_box_2_001",
    "coat_rack": f"{DO}/SM_coat_rack",
    "safe": f"{DO}/SM_safe",
    "clock": f"{DO}/SM_clock",
    "floor_lamp": f"{DO}/SM_lamp_1",
    "carpet": f"{DO}/SM_carpet_21",
    "ashtray": f"{DO}/SM_ashtrey",
    "radio": f"{DO}/SM_radio",
    "wood_panel": f"{DO}/SM_wooden_panel1",
    "sofa_small": f"{DO}/SM_sofa1",
    "wardrobe": f"{TR}/SM_Place_Wardrobe",
    "guitar": f"{TR}/SM_Place_Guitar",
    "wall_clock": f"{TR}/SM_Place_Clock",
    "teen_desk": f"{TR}/SM_Place_Desk",
    "small_cabinet": f"{TR}/SM_Place_SmallMobile",
})
MAT["pictures"] = "/Game/DetectiveOffice/MaterialInstances/MI_pictures"
MAT["cork"] = "/Game/DetectiveOffice/MaterialInstances/MI_cork"

# Однотонные материалы для мебели: создаются скриптом в /Game/Byla/Materials.
# (Материалы паков для мебели — «атласы», на простых коробках они превращаются в полосы.)
FLAT = {
    # имя: (цвет R, G, B, шероховатость, металличность)
    "flat_wood_dark": (0.10, 0.06, 0.035, 0.55, 0.0),
    "flat_wood": (0.30, 0.19, 0.10, 0.6, 0.0),
    "flat_metal": (0.22, 0.23, 0.24, 0.45, 0.7),
    "flat_metal_light": (0.45, 0.46, 0.47, 0.4, 0.6),
    "flat_enamel": (0.80, 0.80, 0.77, 0.3, 0.0),
    "flat_sofa": (0.20, 0.10, 0.08, 0.9, 0.0),
    "flat_cardboard": (0.42, 0.30, 0.17, 0.9, 0.0),
    "flat_car": (0.08, 0.09, 0.11, 0.3, 0.5),
    "flat_roof": (0.12, 0.12, 0.12, 0.8, 0.0),
    "flat_boards": (0.28, 0.27, 0.24, 0.85, 0.0),
    "flat_shed": (0.22, 0.15, 0.09, 0.85, 0.0),
    "flat_screen": (0.02, 0.02, 0.03, 0.2, 0.0),
    "flat_paper": (0.85, 0.83, 0.78, 0.9, 0.0),
    "flat_thread": (0.55, 0.02, 0.02, 0.6, 0.0),
}
FLAT_FOLDER = "/Game/Byla/Materials"

_cache = {}
_missing = set()


def flat_material(name):
    path = f"{FLAT_FOLDER}/M_{name}"
    if unreal.EditorAssetLibrary.does_asset_exist(path):
        return unreal.load_asset(path)
    r, g, b, rough, metal = FLAT[name]
    tools = unreal.AssetToolsHelpers.get_asset_tools()
    m = tools.create_asset(f"M_{name}", FLAT_FOLDER, unreal.Material, unreal.MaterialFactoryNew())
    lib = unreal.MaterialEditingLibrary
    color = lib.create_material_expression(m, unreal.MaterialExpressionConstant3Vector, -400, 0)
    color.set_editor_property("constant", unreal.LinearColor(r, g, b, 1.0))
    lib.connect_material_property(color, "", unreal.MaterialProperty.MP_BASE_COLOR)
    rough_node = lib.create_material_expression(m, unreal.MaterialExpressionConstant, -400, 200)
    rough_node.set_editor_property("r", rough)
    lib.connect_material_property(rough_node, "", unreal.MaterialProperty.MP_ROUGHNESS)
    metal_node = lib.create_material_expression(m, unreal.MaterialExpressionConstant, -400, 300)
    metal_node.set_editor_property("r", metal)
    lib.connect_material_property(metal_node, "", unreal.MaterialProperty.MP_METALLIC)
    lib.recompile_material(m)
    unreal.EditorAssetLibrary.save_asset(path)
    return m


def asset(path):
    if path not in _cache:
        _cache[path] = unreal.load_asset(path)
        if _cache[path] is None and path not in _missing:
            _missing.add(path)
            unreal.log_warning(f"[dress] Не найден ассет: {path}")
    return _cache[path]


def mat(key):
    if key in FLAT:
        if key not in _cache:
            _cache[key] = flat_material(key)
        return _cache[key]
    return asset(MAT[key])


def mesh(key):
    return asset(MESH[key])


# ---------------------------------------------------------------- утилиты

def open_level(path):
    if not unreal.EditorAssetLibrary.does_asset_exist(path):
        unreal.log_warning(f"[dress] Уровня {path} нет — сначала запустите build-скрипты.")
        return False
    levels.load_level(path)
    # Предметы дела, которым прошлый запуск надел модель: возвращаем им серый вид (модель поставим заново).
    for actor in actors.get_all_level_actors():
        cls = actor.get_class().get_name()
        if cls == "CaseObjectActor":
            linked = actor.get_editor_property("linked_actors") or []
            if any(a is not None and a.get_actor_label().startswith(DRESS) for a in linked):
                actor.set_editor_property("hide_mesh", False)
                actor.set_editor_property("linked_actors", [])
        elif cls == "LaptopActor":
            comp = actor.get_component_by_class(unreal.StaticMeshComponent)
            if comp:
                comp.set_editor_property("visible", True)
    for actor in actors.get_all_level_actors():
        label = actor.get_actor_label()
        if label.startswith(DRESS):
            actors.destroy_actor(actor)
        elif label.startswith(GEN) and actor.get_class().get_name() == "StaticMeshActor":
            # Блоки, спрятанные прошлым запуском, возвращаем: их заменят заново.
            actor.set_actor_hidden_in_game(False)
            actor.set_actor_enable_collision(True)
            actor.set_is_temporarily_hidden_in_editor(False)
    return True


def gen_actors():
    return {a.get_actor_label()[len(GEN):]: a for a in actors.get_all_level_actors()
            if a.get_actor_label().startswith(GEN)}


def paint(actor, material_key):
    """Надевает материал на все слоты меша актора."""
    material = mat(material_key)
    if actor is None or material is None:
        return
    comp = actor.get_component_by_class(unreal.StaticMeshComponent)
    if comp:
        for i in range(max(1, comp.get_num_materials())):
            comp.set_material(i, material)


def paint_matching(gen, rules):
    """rules: [(часть имени, ключ материала)] — первое совпадение побеждает."""
    for name, actor in gen.items():
        # Предметы дела не трогаем: они должны выделяться и остаться кликабельными.
        if actor.get_class().get_name() in ("CaseObjectActor", "LaptopActor"):
            continue
        for part, key in rules:
            if part in name:
                paint(actor, key)
                break


_counter = [0]


def align(actor, x, y, bottom):
    """Двигает актор так, чтобы центр габаритов был в (x, y), а низ — на высоте bottom."""
    origin, extent = actor.get_actor_bounds(False)
    loc = actor.get_actor_location()
    actor.set_actor_location(unreal.Vector(loc.x + (x - origin.x), loc.y + (y - origin.y),
                                           loc.z + (bottom - (origin.z - extent.z))), False, False)


def hide_box(box):
    """Прячет серый блок (а не удаляет), чтобы повторный запуск мог заменить его снова."""
    box.set_actor_hidden_in_game(True)
    box.set_actor_enable_collision(False)
    box.set_is_temporarily_hidden_in_editor(True)


def place(label, mesh_key, x, y, bottom, yaw=0.0, scale=(1.0, 1.0, 1.0), folder="Dressing"):
    """Ставит меш так, чтобы центр его габаритов был в (x, y), а низ — на высоте bottom."""
    m = mesh(mesh_key)
    if m is None:
        return None
    actor = actors.spawn_actor_from_object(m, unreal.Vector(x, y, bottom))
    actor.set_actor_rotation(unreal.Rotator(roll=0, pitch=0, yaw=yaw), False)
    actor.set_actor_scale3d(unreal.Vector(*scale))
    align(actor, x, y, bottom)
    _counter[0] += 1
    actor.set_actor_label(f"{DRESS}{label}_{_counter[0]}")
    actor.set_folder_path(folder)
    return actor


CUBE_PATH = "/Engine/BasicShapes/Cube.Cube"


def cube(label, center, size, material_key, folder="Dressing"):
    """Простой блок (например, полка стеллажа) с материалом."""
    actor = actors.spawn_actor_from_object(asset(CUBE_PATH), unreal.Vector(*center))
    actor.set_actor_scale3d(unreal.Vector(size[0] / 100.0, size[1] / 100.0, size[2] / 100.0))
    paint(actor, material_key)
    _counter[0] += 1
    actor.set_actor_label(f"{DRESS}{label}_{_counter[0]}")
    actor.set_folder_path(folder)
    return actor


TOPS = {}


def replace(gen, name, mesh_key, yaw=0.0, scale=(1.0, 1.0, 1.0), fit=False):
    """Заменяет серый блок мешем на том же месте. fit=True — подгоняет ширину и глубину под блок.
    Предметы дела, лежавшие на блоке, поднимаются/опускаются на новую высоту поверхности."""
    box = gen.get(name)
    if box is None or mesh(mesh_key) is None:
        return None
    origin, extent = box.get_actor_bounds(False)
    bottom, old_top = origin.z - extent.z, origin.z + extent.z
    new = place(name, mesh_key, origin.x, origin.y, bottom, yaw, scale)
    if not new:
        return None
    if fit:
        _, e2 = new.get_actor_bounds(False)
        fx, fy = extent.x / max(e2.x, 0.1), extent.y / max(e2.y, 0.1)
        s0 = new.get_actor_scale3d()
        if abs(abs(yaw) % 180 - 90) < 1:   # повёрнут на 90°: локальная X идёт вдоль мировой Y
            fx, fy = fy, fx
        new.set_actor_scale3d(unreal.Vector(s0.x * fx, s0.y * fy, s0.z))
        align(new, origin.x, origin.y, bottom)
    hide_box(box)

    o2, e2 = new.get_actor_bounds(False)
    new_top = o2.z + e2.z
    TOPS[name] = new_top
    delta = new_top - old_top
    if abs(delta) > 0.5:
        for a in actors.get_all_level_actors():
            if a.get_class().get_name() not in ("CaseObjectActor", "LaptopActor"):
                continue
            ao, ae = a.get_actor_bounds(False)
            on_top = abs((ao.z - ae.z) - old_top) < 2.5
            inside = abs(ao.x - origin.x) <= extent.x and abs(ao.y - origin.y) <= extent.y
            if on_top and inside:
                loc = a.get_actor_location()
                a.set_actor_location(unreal.Vector(loc.x, loc.y, loc.z + delta), False, False)
    return new


def top(name, default):
    return TOPS.get(name, default)


def no_collision(actor):
    comp = actor.get_component_by_class(unreal.StaticMeshComponent) if actor else None
    if comp:
        comp.set_collision_profile_name("NoCollision")


def cover(mesh_key, center, size, bottom, mode="stretch", yaw=0.0, label="Prop", folder="Dressing",
          roll=0.0, pitch=0.0, auto=True):
    """Ставит модель в коробку size (x, y, z в см) с центром center (x, y) и низом на высоте bottom.
    stretch — растянуть точно по коробке; uniform — сохранить пропорции и вписать в коробку.
    Если модель вытянута не вдоль той же оси, что коробка, она сама поворачивается на 90°."""
    m = mesh(mesh_key)
    if m is None:
        return None
    actor = actors.spawn_actor_from_object(m, unreal.Vector(center[0], center[1], bottom))
    actor.set_actor_rotation(unreal.Rotator(roll=roll, pitch=pitch, yaw=yaw), False)
    _, e = actor.get_actor_bounds(False)
    if auto and (size[0] >= size[1]) != (e.x >= e.y) and abs(size[0] - size[1]) > 1 and abs(e.x - e.y) > 0.5:
        yaw += 90.0
        actor.set_actor_rotation(unreal.Rotator(roll=roll, pitch=pitch, yaw=yaw), False)
    _, e = actor.get_actor_bounds(False)
    sx, sy, sz = max(e.x * 2, 0.1), max(e.y * 2, 0.1), max(e.z * 2, 0.1)
    if mode == "stretch":
        fx, fy, fz = size[0] / sx, size[1] / sy, size[2] / sz
    else:
        f = min(size[0] / sx, size[1] / sy)
        if size[2] > 1 and sz > 1:
            f = min(f, size[2] / sz)
        fx = fy = fz = f
    if roll or pitch:
        fx = fy = fz = min(fx, fy, fz)   # наклонённую модель масштабируем без искажений
    elif abs(abs(yaw) % 180 - 90) < 1:   # повёрнута на 90°: локальная X идёт вдоль мировой Y
        fx, fy = fy, fx
    actor.set_actor_scale3d(unreal.Vector(fx, fy, fz))
    align(actor, center[0], center[1], bottom)
    _counter[0] += 1
    actor.set_actor_label(f"{DRESS}{label}_{_counter[0]}")
    actor.set_folder_path(folder)
    return actor


def skin(target, mesh_key, mode="stretch", yaw=0.0, size=None, roll=0.0, pitch=0.0, auto=True):
    """Надевает модель на предмет дела. Серый блок становится невидимым в игре, но остаётся зоной для кнопки E;
    модель появляется и исчезает вместе с предметом (по сюжету)."""
    if target is None:
        return None
    origin, extent = target.get_actor_bounds(False)
    box = size or (extent.x * 2, extent.y * 2, extent.z * 2)
    actor = cover(mesh_key, (origin.x, origin.y), box, origin.z - extent.z, mode, yaw,
                  label=target.get_actor_label().replace(GEN, ""), folder="Dressing/Case",
                  roll=roll, pitch=pitch, auto=auto)
    if actor is None:
        return None
    link(target, [actor])
    return actor


def link(target, parts):
    """Серый блок предмета — невидимая зона для кнопки E; parts появляются и исчезают вместе с предметом."""
    for actor in parts:
        no_collision(actor)
    cls = target.get_class().get_name()
    if cls == "CaseObjectActor":
        target.set_editor_property("hide_mesh", True)
        target.set_editor_property("linked_actors", parts)
    elif cls == "LaptopActor":
        comp = target.get_component_by_class(unreal.StaticMeshComponent)
        if comp:
            comp.set_editor_property("visible", False)


def overlay(target, parts):
    """Собирает внешний вид предмета из простых блоков: parts = [(dx, dy, dz, (sx, sy, sz), материал)]
    относительно центра предмета."""
    if target is None:
        return
    o, _ = target.get_actor_bounds(False)
    made = [cube(target.get_actor_label().replace(GEN, ""), (o.x + dx, o.y + dy, o.z + dz), size, m,
                 folder="Dressing/Case") for dx, dy, dz, size, m in parts]
    link(target, [a for a in made if a])


def settle(box_name, top_z):
    """Кладёт предметы дела, лежащие на блоке box_name, ровно на его новую поверхность top_z."""
    box = gen_actors().get(box_name)
    if box is None:
        return
    bo, be = box.get_actor_bounds(False)
    for a in actors.get_all_level_actors():
        if a.get_class().get_name() not in ("CaseObjectActor", "LaptopActor"):
            continue
        ao, ae = a.get_actor_bounds(False)
        inside = abs(ao.x - bo.x) <= be.x and abs(ao.y - bo.y) <= be.y
        bottom = ao.z - ae.z
        if inside and abs(bottom - top_z) < 30:
            loc = a.get_actor_location()
            a.set_actor_location(unreal.Vector(loc.x, loc.y, loc.z + top_z - bottom), False, False)


def replace_box(gen, name, mesh_key, yaw=0.0):
    """Как replace, но растягивает модель точно по серому блоку (по всем трём осям)."""
    box = gen.get(name)
    if box is None:
        return None
    origin, extent = box.get_actor_bounds(False)
    actor = cover(mesh_key, (origin.x, origin.y), (extent.x * 2, extent.y * 2, extent.z * 2),
                  origin.z - extent.z, "stretch", yaw, label=name)
    if actor:
        hide_box(box)
    return actor


def case_objects():
    return {a.get_actor_label()[len(GEN):]: a for a in actors.get_all_level_actors()
            if a.get_actor_label().startswith(GEN) and a.get_class().get_name() in ("CaseObjectActor", "LaptopActor")}


def wainscot(start, end, fixed, along_x, gaps=()):
    """Деревянные панели (90 см) по низу стены от start до end; gaps — проёмы дверей (от, до)."""
    segs = [(start, end)]
    for g0, g1 in gaps:
        new = []
        for a, b in segs:
            if g1 <= a or g0 >= b:
                new.append((a, b))
                continue
            if g0 > a:
                new.append((a, g0))
            if g1 < b:
                new.append((g1, b))
        segs = new
    for a, b in segs:
        length = b - a
        if length < 20:
            continue
        n = max(1, round(length / 180.0))
        w = length / n
        for i in range(n):
            c = a + w * (i + 0.5)
            x, y = (c, fixed) if along_x else (fixed, c)
            size = (w, 3, 90) if along_x else (3, w, 90)
            cover("wood_panel", (x, y), size, 0, "stretch", label="Wainscot", folder="Dressing/Walls")


def evidence_board(cx, wall_y, bottom, w=200, h=120):
    """Пробковая доска с бумагами и красными нитями на северной стене (лицом на юг)."""
    y = wall_y - 2
    cube("Corkboard", (cx, y, bottom + h / 2), (w, 4, h), "cork", folder="Dressing/Board")
    notes = [(-70, 30), (-20, 40), (40, 25), (75, -20), (-55, -30), (10, -25)]
    pts = []
    for dx, dz in notes:
        p = (cx + dx, bottom + h / 2 + dz)
        cube("Note", (p[0], y - 2.5, p[1]), (18, 1, 24), "flat_paper", folder="Dressing/Board")
        pts.append(p)
    for i, j in ((0, 1), (1, 2), (2, 3), (4, 5), (1, 5)):
        (x1, z1), (x2, z2) = pts[i], pts[j]
        length = math.hypot(x2 - x1, z2 - z1)
        t = cube("Thread", ((x1 + x2) / 2, y - 3.5, (z1 + z2) / 2), (length, 0.5, 0.5), "flat_thread",
                 folder="Dressing/Board")
        t.set_actor_rotation(unreal.Rotator(roll=0, pitch=math.degrees(math.atan2(z2 - z1, x2 - x1)), yaw=0), False)


def save():
    levels.save_current_level()


# ---------------------------------------------------------------- локации

def dress_office():
    if not open_level("/Game/Maps/L_Office"):
        return
    gen = gen_actors()
    paint_matching(gen, [
        ("Interrogation_Floor", "concrete"), ("Interrogation_Ceiling", "plaster_a"), ("Interrogation_Wall", "plaster_c"),
        ("Floor", "concrete_tiles"), ("Ceiling", "plaster_a"), ("Wall", "paint2"),
        ("Cabinet", "painted_metal"), ("KeyBoard", "flat_wood"), ("Shelf", "flat_wood"),
    ])
    # Кабинет: мебель из пака DetectiveOffice.
    replace_box(gen, "Desk", "teen_desk")
    settle("Desk", 75)
    replace(gen, "SideTable", "table", yaw=90, fit=True)
    replace(gen, "Interrogation_Table", "table", fit=True)
    replace(gen, "Chair", "office_chair")
    replace(gen, "Interrogation_Chair_Player", "chair", yaw=0)
    replace(gen, "Interrogation_Chair_Suspect", "chair", yaw=180)
    replace_box(gen, "Cabinet", "cabinet_tall")
    replace_box(gen, "Cabinet2", "cabinet_tall")
    replace_box(gen, "Shelf", "small_cabinet")
    settle("Shelf", 90)

    # Предметы дела: модели поверх серых блоков (кнопка E работает как раньше).
    objs = case_objects()
    laptop = objs.get("Laptop")
    if laptop:
        # Зона кнопки E — размером с компьютер, чтобы срабатывать, когда смотришь на экран.
        o, e = laptop.get_actor_bounds(False)
        bottom = o.z - e.z
        laptop.set_actor_scale3d(unreal.Vector(0.55, 0.45, 0.40))
        laptop.set_actor_location(unreal.Vector(o.x, o.y, bottom + 20), False, False)
        # Монитор — экраном к креслу (на юг).
        skin(laptop, "pc", "uniform", yaw=180, size=(50, 55, 50), auto=False)
    skin(objs.get("CaseFolder"), "paper_stack", "uniform")
    skin(objs.get("LoginPrintout"), "paper_stack", "uniform")
    skin(objs.get("ForumPrintout"), "paper_stack", "uniform")
    skin(objs.get("DeskPhone"), "phone", "uniform")
    skin(objs.get("CaseVolume2"), "books", "uniform")
    for k in ("CarKeys", "CarKeysPrichal", "CarKeysDacha", "CarKeysCourt"):
        # Связка висит на крючке: кольцо сверху, плашмя к доске.
        skin(objs.get(k), "keys", "uniform", roll=90, yaw=90, auto=False)
    skin(objs.get("ArchiveDoor"), "door")

    # Стены кабинета: деревянные панели снизу, проёмы дверей свободны.
    wainscot(0, 600, 2, True, gaps=[(405, 495)])          # юг, дверь в архив
    wainscot(0, 600, 498, True)                          # север
    wainscot(0, 500, 2, False)                           # запад
    wainscot(0, 500, 588, False, gaps=[(180, 280)])      # восток, проход в допросную
    evidence_board(300, 500, 125)

    # Обстановка.
    place("Plant", "pot", 560, 60, 0)
    place("Mug", "mug", 260, 425, top("Desk", 75))
    place("Ashtray", "ashtray", 335, 432, top("Desk", 75))
    place("Newspaper", "newspaper", 70, 150, top("SideTable", 75), yaw=20)
    place("CoatRack", "coat_rack", 40, 40, 0)
    big = place("CaseBoxes", "box_big", 230, 35, 0)
    if big:
        o, e = big.get_actor_bounds(False)
        place("CaseBoxes", "box_small", 232, 35, o.z + e.z, yaw=8)
    place("FloorLamp", "floor_lamp", 560, 130, 0)
    place("Clock", "clock", 150, 5, 190)
    place("Radio", "radio", 450, 470, top("Cabinet2", 180))
    rug = place("Carpet", "carpet", 300, 230, 0.3, scale=(0.6, 0.55, 1.0))
    no_collision(rug)
    save()


def dress_flat():
    if not open_level("/Game/Maps/L_IrinaFlat"):
        return
    gen = gen_actors()
    paint_matching(gen, [
        ("Floor", "epoxy"), ("Ceiling", "plaster_a"), ("Kitchen_", "plaster_b"), ("Hall_", "paint2"), ("Room_", "paint"),
        ("Sofa", "flat_sofa"), ("Wardrobe", "flat_wood_dark"), ("Shelf", "flat_wood"),
        ("Stove", "flat_enamel"), ("Fridge", "flat_enamel"),
    ])
    replace(gen, "Table", "table", fit=True)
    replace(gen, "KitchenTable", "table", fit=True)
    replace(gen, "Chair", "chair", yaw=90)
    replace_box(gen, "Wardrobe", "wardrobe")
    replace(gen, "Sofa", "sofa_small", yaw=180, fit=True)
    place("Mug", "mug", 125, 505, top("KitchenTable", 75))
    # Вещи Алины: мать десять лет ничего не убирает.
    place("Guitar", "guitar", 386, 215, 0, yaw=90)
    place("Clock", "wall_clock", 320, 10, 180)
    objs = case_objects()
    skin(objs.get("FlatExit"), "door")
    if objs.get("AlinaPhone"):
        paint(objs["AlinaPhone"], "flat_screen")
    # Настенный календарь: лист, красная шапка, строки недель, обведённая дата.
    overlay(objs.get("WallCalendar"), [
        (0, 1.5, 0, (40, 1, 50), "flat_paper"),
        (0, 2.2, 20, (40, 1, 10), "flat_thread"),
        (0, 2.2, 8, (34, 0.5, 0.6), "flat_screen"),
        (0, 2.2, -1, (34, 0.5, 0.6), "flat_screen"),
        (0, 2.2, -10, (34, 0.5, 0.6), "flat_screen"),
        (0, 2.2, -19, (34, 0.5, 0.6), "flat_screen"),
        (6, 2.6, -5, (6, 0.5, 6), "flat_thread"),
    ])
    # Фотография Алины в рамке на полке (лицом в комнату).
    overlay(objs.get("AlinaPhoto"), [
        (0, 0, 0, (3, 22, 26), "flat_wood_dark"),
        (2, 0, 0, (1, 18, 22), "pictures"),
    ])
    save()


def dress_archive():
    if not open_level("/Game/Maps/L_LabArchive"):
        return
    gen = gen_actors()
    paint_matching(gen, [
        ("Floor", "concrete_tiles"), ("Ceiling", "plaster_a"), ("Wall", "plaster_c"),
        ("ShelfBox", "flat_cardboard"),
    ])
    replace(gen, "ClerkDesk", "table", fit=True)
    replace(gen, "SideTable", "table", fit=True)
    replace(gen, "ReadingTable", "table", fit=True)
    # Сплошные блоки стеллажей заменяем на каркас: стойки + полки.
    for i in range(3):
        box = gen.pop(f"Shelf_{i}", None)
        if not box:
            continue
        origin, extent = box.get_actor_bounds(False)
        hide_box(box)
        cx, cy = origin.x, origin.y
        w, l, h = extent.x * 2, extent.y * 2, extent.z * 2
        for sy in (-1, 1):
            for sx in (-1, 1):
                cube("Upright", (cx + sx * (w / 2 - 2), cy + sy * (l / 2 - 2), h / 2), (4, 4, h), "painted_metal")
        for z in (8, 70, 133, 200):
            cube("Board", (cx, cy, z - 2), (w, l, 4), "flat_metal_light")
    place("Cart", "cart", 230, 420, 0, yaw=90)
    # Коробки с делами на полках (вместо однотонных блоков) и ещё ряд на нижней полке.
    for name in [n for n in gen if n.startswith("ShelfBox_")]:
        replace_box(gen, name, "box_small")
    for x in (300, 450, 600):
        for y in (185, 255, 325):
            cover("box_small", (x, y), (36, 45, 28), 72, "stretch", label="ArchiveBox")
    objs = case_objects()
    skin(objs.get("StairsUp"), "door")
    skin(objs.get("ClerkJournal"), "paper_stack", "uniform")
    skin(objs.get("StaffFolder"), "paper_stack", "uniform")
    skin(objs.get("ExpertiseBox"), "box_small")
    skin(objs.get("CameraCabinet"), "cabinet_tall")
    place("Mug", "mug", 120, 70, top("ClerkDesk", 75))
    save()


def dress_prichal():
    if not open_level("/Game/Maps/L_Prichal"):
        return
    gen = gen_actors()
    paint_matching(gen, [
        ("Floor", "epoxy"), ("Ceiling", "plaster_a"), ("Wall", "plaster"),
        ("Counter", "flat_wood_dark"), ("BackShelf", "flat_wood_dark"),
    ])
    W, L, H = 900, 600, 320

    # Пол плиткой 3x3 м поверх серого пола (коллизия остаётся у серого).
    for ix in range(3):
        for iy in range(2):
            place("Floor", "floor", 150 + ix * 300, 150 + iy * 300, 0.5)
    # Панели стен поверх серых стен (высота подогнана под потолок).
    sz = H / 400.0
    for ix in range(3):
        if ix == 1:
            # Посередине южной стены — выход: панели только по бокам двери (x 400..500).
            place("WallS", "wall", 350, 8, 0, yaw=0, scale=(1 / 3.0, 1, sz))
            place("WallS", "wall", 550, 8, 0, yaw=0, scale=(1 / 3.0, 1, sz))
        else:
            place("WallS", "wall", 150 + ix * 300, 8, 0, yaw=0, scale=(1, 1, sz))
        place("WallN", "wall", 150 + ix * 300, L - 8, 0, yaw=180, scale=(1, 1, sz))
    for iy in range(2):
        place("WallW", "wall", 8, 150 + iy * 300, 0, yaw=90, scale=(1, 1, sz))
        place("WallE", "wall", W - 8, 150 + iy * 300, 0, yaw=-90, scale=(1, 1, sz))

    # Столы и стулья вместо блоков.
    # Четвёртый столик (у стойки) убран: мешал пройти к Мальцеву.
    for name in ("Table_3", "Stool_3_a", "Stool_3_b"):
        if gen.get(name):
            hide_box(gen[name])
    for i in range(3):
        replace(gen, f"Table_{i}", "table")
        replace(gen, f"Stool_{i}_a", "chair", yaw=0)
        replace(gen, f"Stool_{i}_b", "chair", yaw=180)
    replace(gen, "CornerTable", "table", yaw=90)
    # Спинка дивана к западной стене, сиденье — к столику.
    replace(gen, "CornerBench", "booth", yaw=-90)

    # За стойкой — полки с бутылками.
    box = gen.pop("BackShelf", None)
    if box:
        hide_box(box)
    place("Shelves1", "shelves", 550, 585, 60)
    place("Shelves2", "shelves", 750, 585, 60)
    for i, key in enumerate(("bottle1", "bottle2", "bottle3", "bottle1", "bottle2")):
        place("Bottle", key, 470 + i * 14, 470, 110)
    place("Napkins", "napkins", 820, 470, 110)
    place("Mug", "mug", 140, 500, 79)

    # Атмосфера: лампы, растение, меню на доске, картины, жалюзи на «окнах».
    # Лампы висят над столиками (не над проходом), чтобы игрок в них не упирался.
    for (x, y) in ((220, 200), (720, 200), (220, 330), (140, 510)):
        place("Lamp", "lamp", x, y, H - 180)
    place("Chalkboard", "chalkboard", 892, 300, 90, yaw=-90)
    place("Painting1", "painting1", 300, L - 18, 140, yaw=180)
    place("Painting2", "painting2", 8 + 10, 300, 140, yaw=90)
    objs = case_objects()
    skin(objs.get("Exit"), "door")
    skin(objs.get("CashJournal"), "paper_stack", "uniform")
    save()


def dress_dacha():
    if not open_level("/Game/Maps/L_Dacha"):
        return
    gen = gen_actors()
    paint_matching(gen, [
        # Кирпичный дачный дом, деревянный сарай, тёмная крыша, ржавая бочка.
        ("Ground", "dirt"), ("HouseRoof", "roof"), ("House", "bricks"),
        ("Shed_Roof", "roof"), ("Shed", "wood_grey"), ("OldCar", "flat_car"), ("Barrel", "painted_metal"),
    ])

    # Деревянный забор вместо серых стенок. На юге — проём для калитки (x 420..580).
    for name in ("Fence_0", "Fence_1", "Fence_2", "Fence_3"):
        box = gen.pop(name, None)
        if box:
            hide_box(box)
    fences = ("fence_a", "fence_b", "fence_c")
    step = 205
    k = 0
    for i in range(6):
        x = -100 + step / 2 + i * step
        for y in (-95, 1095):
            if y == -95 and x + step / 2 > 420 and x - step / 2 < 580:
                continue
            place("Fence", fences[k % 3], x, y, 0, yaw=90)
            k += 1
    for i in range(6):
        y = -100 + step / 2 + i * step
        for x in (-95, 1095):
            place("Fence", fences[k % 3], x, y, 0, yaw=0)
            k += 1

    # Ели вокруг участка — глухой лес за забором.
    trees = [(-450, -300), (-500, 300), (-420, 800), (-480, 1300), (0, 1500), (500, 1550), (1000, 1480),
             (1500, 1250), (1550, 700), (1480, 150), (1450, -350), (950, -500), (200, -550), (-150, -600)]
    for i, (x, y) in enumerate(trees):
        place("Spruce", ("spruce1", "spruce2", "spruce3", "spruce_half")[i % 4], x, y, 0, yaw=(i * 47) % 360)
    for (x, y) in ((150, 150), (1000, 300), (1000, 450), (600, 1000)):
        place("SmallSpruce", "spruce_small", x, y, 0, yaw=x % 360)

    # Листва, кусты, трава.
    for (x, y, key) in ((300, 500, "leaves"), (700, 300, "leaves2"), (850, 650, "leaves2"), (200, 950, "leaves")):
        place("Leaves", key, x, y, 0.5, yaw=(x + y) % 360)
    for (x, y) in ((40, 600), (1040, 900), (60, 80)):
        place("Bush", "bush", x, y, 0)
    for (x, y) in ((600, 150), (350, 650), (750, 500), (450, 900), (950, 150)):
        place("Grass", "grass", x, y, 0)
    skin(case_objects().get("Gate"), "fence_b")
    save()


def dress_court():
    if not open_level("/Game/Maps/L_Court"):
        return
    gen = gen_actors()
    paint_matching(gen, [
        ("Floor", "epoxy"), ("Ceiling", "plaster_a"), ("Wall", "plaster_b"),
        ("Judge", "flat_wood_dark"), ("Tribune", "flat_wood_dark"), ("VideoScreen", "flat_screen"),
    ])
    replace(gen, "ProsecutorTable", "table", fit=True)
    replace(gen, "DefenceTable", "table", fit=True)
    for r in range(4):
        # Публика сидит лицом к судье (на север).
        replace(gen, f"Bench_L_{r}", "bench", yaw=180)
        replace(gen, f"Bench_R_{r}", "bench", yaw=180)
    for x in (200, 300, 700, 800):
        place("Chair", "chair", x, 885, 0, yaw=90)
    place("PlantL", "plant", 60, 1300, 0)
    place("PlantR", "plant", 940, 60, 0)
    skin(case_objects().get("CourtDoor"), "door")
    save()


def main():
    dress_flat()
    dress_archive()
    dress_prichal()
    dress_dacha()
    dress_court()
    dress_office()   # последним, чтобы редактор остался в кабинете
    if _missing:
        unreal.log_warning(f"[dress] Не найдено ассетов: {len(_missing)} (см. предупреждения выше).")
    unreal.log("[dress] Готово. Нажмите Play.")


main()
