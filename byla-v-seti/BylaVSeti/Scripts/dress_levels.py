"""Оформляет серые коробки ассетами из ваших паков (RestaurantScene, Downtown_West, PN_interactiveSpruceForest).

Запуск в редакторе Unreal: Tools -> Execute Python Script... -> выбрать этот файл.
Запускать ПОСЛЕ скриптов build_*.py. Можно запускать повторно: старое оформление (метка DRESS_) удаляется.

Что делает:
  - надевает материалы на стены, полы, потолки и мебель во всех локациях;
  - кафе «Причал»: настоящие столы, стулья, диван, полки, лампы, пол, стены, жалюзи;
  - дача: деревянный забор, ели вокруг участка, земля, листва;
  - суд: деревянные скамьи;
  - кабинет, допросная, квартира: стулья, растение, жалюзи.
Стены, полы и предметы дела (то, с чем взаимодействует игрок) остаются на месте: меняется только внешний вид.

Если какой-то ассет не найден, скрипт пропустит его и напишет предупреждение в Output Log.
Материалы для каждой локации можно поменять в таблицах ниже.
"""
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
    replace(gen, "Desk", "table", fit=True)
    replace(gen, "SideTable", "table", yaw=90, fit=True)
    replace(gen, "Interrogation_Table", "table", fit=True)
    replace(gen, "Chair", "chair", yaw=90)
    replace(gen, "Interrogation_Chair_Player", "chair", yaw=0)
    replace(gen, "Interrogation_Chair_Suspect", "chair", yaw=180)
    place("Plant", "pot", 560, 60, 0)
    place("Mug", "mug", 260, 425, top("Desk", 75))
    place("Newspaper", "newspaper", 70, 150, top("SideTable", 75), yaw=20)
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
    place("Mug", "mug", 125, 505, top("KitchenTable", 75))
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
        place("WallS", "wall", 150 + ix * 300, 8, 0, yaw=0, scale=(1, 1, sz))
        place("WallN", "wall", 150 + ix * 300, L - 8, 0, yaw=180, scale=(1, 1, sz))
    for iy in range(2):
        place("WallW", "wall", 8, 150 + iy * 300, 0, yaw=90, scale=(1, 1, sz))
        place("WallE", "wall", W - 8, 150 + iy * 300, 0, yaw=-90, scale=(1, 1, sz))

    # Столы и стулья вместо блоков.
    for i in range(4):
        replace(gen, f"Table_{i}", "table")
        replace(gen, f"Stool_{i}_a", "chair", yaw=0)
        replace(gen, f"Stool_{i}_b", "chair", yaw=180)
    replace(gen, "CornerTable", "table", yaw=90)
    replace(gen, "CornerBench", "booth", yaw=90)

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
    for (x, y) in ((250, 200), (650, 200), (300, 420), (650, 480), (140, 500)):
        place("Lamp", "lamp", x, y, H - 180)
    place("Plant", "plant", 830, 90, 0)
    place("Chalkboard", "chalkboard", 892, 300, 90, yaw=-90)
    place("Painting1", "painting1", 300, L - 18, 140, yaw=180)
    place("Painting2", "painting2", 8 + 10, 300, 140, yaw=90)
    save()


def dress_dacha():
    if not open_level("/Game/Maps/L_Dacha"):
        return
    gen = gen_actors()
    paint_matching(gen, [
        ("Ground", "dirt"), ("HouseRoof", "flat_roof"), ("House", "flat_boards"),
        ("Shed_Roof", "flat_roof"), ("Shed", "flat_shed"), ("OldCar", "flat_car"), ("Barrel", "flat_metal"),
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
        replace(gen, f"Bench_L_{r}", "bench")
        replace(gen, f"Bench_R_{r}", "bench")
    for x in (200, 300, 700, 800):
        place("Chair", "chair", x, 885, 0, yaw=90)
    place("PlantL", "plant", 60, 1300, 0)
    place("PlantR", "plant", 940, 60, 0)
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
