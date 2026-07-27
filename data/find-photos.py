#!/usr/bin/env python3
# coding: utf-8
"""
Собирает фотографии чартерных яхт из каталога searadar.com.

Две предыдущие попытки провалились, и обе поучительны.

1. Пул набирался по категориям Викисклада вида «Байкал», «Чёрное море» —
   логика «лодке её море». Но категория места по определению отдаёт пейзаж,
   и в базе оказались сотни снимков воды без единой яхты в кадре.

2. Пул набирался по верфям на Викискладе — уже лодки, но не те: запросы
   «wooden / vintage / classic yacht» вытянули архив начала XX века,
   чёрно-белую Сиднейскую гавань и однажды броненосец. Свободных лицензий
   на современную чартерную съёмку почти нет — её снимают верфи и брокеры.

Отсюда третий заход: брать оттуда, где такая съёмка и живёт. searadar —
чартерный каталог, и у него в адресе картинки зашита модель лодки:
    .../crop/700/700/a40/b3/39212-1615826-bavaria-cruiser-32-lila.jpeg
                            ^лодка ^фото  ^модель            ^имя
Размер кропа — часть пути, поэтому те же кадры берутся сразу в 1200×675.

Запуск:  python3 find-photos.py
Выход:   photos.source.json, photos.themes.json, PHOTO-CREDITS.md
"""

import json
import os
import re
import time
import urllib.parse
import urllib.request
from collections import defaultdict

HERE = os.path.dirname(os.path.abspath(__file__))
TARGET = os.path.join(HERE, "photos.source.json")
THEMES_FILE = os.path.join(HERE, "photos.themes.json")
CREDITS = os.path.join(HERE, "PHOTO-CREDITS.md")

SEARCH = "https://searadar.com/search"
UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36"

# Карточка на сайте широкая — берём кадр под неё, а не квадратный кроп.
SIZE = "1200/675"

# Первые кадры листинга — экстерьер под парусом и на стоянке,
# дальше идут камбуз, гальюн и каюты. Каталогу нужна лодка снаружи.
MAX_PHOTO_INDEX = 4

# Сколько кадров держим на семейство.
PER_FAMILY = 20

# Откуда собираем. Разные акватории дают разный свет и ракурсы,
# типы лодок — разные корпуса.
REGIONS = ["greece", "croatia", "turkey", "italy", "spain", "montenegro"]
PAGES = [1, 2, 3]

# Коды типов в searadar. Первый — гулеты, турецкие деревянные шхуны;
# к нашему флоту они отношения не имеют и в сборку не идут.
#
# Тип задаёт семейство жёстко: без этого «Aquila 32 Sport» и надувной
# «3D Tender» попадали в круизные парусники — по имени файла верфь
# не опознавалась, и они валились в общий пул.
SAIL, CATAMARAN, MOTOR = 2, 3, 4
BOAT_TYPES = [SAIL, CATAMARAN, MOTOR]

# Заказчик просил чартерные лодки от 25 до 55 футов. Длину берём
# из названия модели: «Bavaria Cruiser 32» — 32 фута, «Oceanis 393» —
# 39, у трёхзначных первые две цифры и есть футы.
MIN_FEET, MAX_FEET = 25, 55

# Признак верфи в имени файла → семейство. Проверяется по порядку.
FAMILIES = [
    ("catamaran", ("lagoon", "catamaran", "nautitech", "fountaine", "bali-",
                   "leopard", "seawind")),
    ("motor", ("princess", "azimut", "ferretti", "sunseeker", "galeon",
               "nimbus", "targa", "bayliner", "merry-fisher", "antares",
               "flybridge", "trawler", "motor")),
    ("bavaria", ("bavaria",)),
    ("beneteau", ("oceanis", "beneteau", "-first-")),
    ("jeanneau", ("sun-odyssey", "jeanneau", "sun-loft")),
    ("hanse", ("hanse",)),
    ("dufour", ("dufour",)),
    ("hallberg", ("hallberg",)),
    ("swan", ("swan", "nautor")),
    ("elan", ("elan", "salona", "more-", "grand-soleil", "x-yacht")),
]

IMG = re.compile(r"<img[^>]+>", re.I)
SRC = re.compile(r'src="([^"]*uploads/boats/crop/[^"]+)"', re.I)
ALT = re.compile(r'alt="([^"]*)"', re.I)
# «Lila | Bavaria Cruiser 32 photo 1»
CAPTION = re.compile(r"^(.*?)\s*\|\s*(.+?)\s+photo\s+(\d+)\s*$", re.I)


def fetch(url: str) -> str:
    request = urllib.request.Request(url, headers={"User-Agent": UA})
    with urllib.request.urlopen(request, timeout=45) as response:
        return response.read().decode("utf-8", "replace")


def family_of(slug: str, boat_type: int) -> str:
    """Семейство: тип лодки главнее имени файла, верфь уточняет внутри паруса."""
    if boat_type == CATAMARAN:
        return "catamaran"
    if boat_type == MOTOR:
        return "motor"
    for family, marks in FAMILIES:
        if any(mark in slug for mark in marks):
            return family
    return "cruiser"


def feet_of(model: str) -> int | None:
    """
    Длина в футах из названия модели.

    «Bavaria Cruiser 32» → 32. «Oceanis 393» и «Sun Odyssey 349» — тоже
    футы, просто с десятыми: 39.3 и 34.9, поэтому берём первые две цифры.
    """
    numbers = re.findall(r"\d+", model)
    if not numbers:
        return None
    longest = max(numbers, key=len)
    if len(longest) >= 3:
        return int(longest[:2])
    if len(longest) == 2:
        return int(longest)
    return None


def harvest(region: str, boat_type: int, page: int) -> list[dict]:
    query = urllib.parse.urlencode({
        "filter": region, "boatTypes": boat_type,
        "dateFrom": "2026-08-01", "dateTo": "2026-08-08", "p": page,
    })
    try:
        html = fetch(f"{SEARCH}?{query}")
    except Exception as error:
        print(f"    ! {region}/{boat_type}/{page}: {error}")
        return []

    out = []
    for tag in IMG.findall(html):
        src, alt = SRC.search(tag), ALT.search(tag)
        if not src or not alt:
            continue
        caption = CAPTION.match(alt.group(1).strip())
        if not caption:
            continue

        name, model, index = caption.groups()
        if int(index) > MAX_PHOTO_INDEX:
            continue

        feet = feet_of(model)
        if feet is not None and not MIN_FEET <= feet <= MAX_FEET:
            continue

        url = src.group(1)
        if url.startswith("/"):
            url = "https://searadar.com" + url
        # Кроп задан прямо в пути — подменяем на широкий.
        url = re.sub(r"/crop/\d+/\d+/", f"/crop/{SIZE}/", url)

        filename = url.rsplit("/", 1)[-1]
        boat_id = filename.split("-", 1)[0]

        out.append({
            "title": f"{model} «{name}»"[:80],
            "url": url,
            "author": "searadar.com",
            "lic": "каталог чартера, права владельцев",
            "src": "searadar",
            "boat": boat_id,
            "index": int(index),
            "family": family_of(filename.lower(), boat_type),
        })
    return out


def main() -> None:
    everything: list[dict] = []
    for region in REGIONS:
        for boat_type in BOAT_TYPES:
            for page in PAGES:
                found = harvest(region, boat_type, page)
                everything += found
                time.sleep(1.2)  # чужой сайт, ходим спокойно
        print(f"  {region:12} накоплено {len(everything)}")

    # По одному кадру на лодку, и это первый кадр листинга: он почти
    # всегда экстерьер, а нам нужна лодка, а не её камбуз.
    best: dict[str, dict] = {}
    for item in everything:
        current = best.get(item["boat"])
        if current is None or item["index"] < current["index"]:
            best[item["boat"]] = item

    by_family: dict[str, list[dict]] = defaultdict(list)
    for item in best.values():
        by_family[item["family"]].append(item)

    pool: dict[str, dict] = {}
    themes: dict[str, list[str]] = {}
    for family, items in sorted(by_family.items()):
        items.sort(key=lambda x: x["title"])
        picked = items[:PER_FAMILY]
        for item in picked:
            pool[item["url"]] = item
        themes[family] = [item["url"] for item in picked]
        print(f"  {family:10} {len(picked):3} из {len(items)} лодок")

    with open(TARGET, "w", encoding="utf-8") as handle:
        json.dump(list(pool.values()), handle, ensure_ascii=False, indent=1)
        handle.write("\n")

    with open(THEMES_FILE, "w", encoding="utf-8") as handle:
        json.dump(themes, handle, ensure_ascii=False, indent=1)
        handle.write("\n")

    lines = [
        "# Фотографии",
        "",
        "Кадры каталога — съёмка чартерных яхт с [searadar.com](https://searadar.com).",
        "Собрано скриптом `find-photos.py`.",
        "",
        f"Всего кадров: {len(pool)}.",
        "",
        "| Лодка | Источник |",
        "| --- | --- |",
    ]
    for item in sorted(pool.values(), key=lambda x: x["title"]):
        lines.append(f"| {item['title'].replace('|', '/')} | searadar.com |")

    lines += [
        "",
        "## Витрина направлений",
        "",
        "Четыре кадра на главной — съёмка «Силы ветра» с silavetra.com",
        "(`dest-arctic`, `dest-far-east`, `dest-white-sea`, `dest-kamchatka`).",
        "Ещё два с Викисклада: `dest-black-sea` (Novo bay) и `dest-yakutia`",
        "(Lena Pillars).",
        "",
    ]
    with open(CREDITS, "w", encoding="utf-8") as handle:
        handle.write("\n".join(lines))

    print(f"\n{os.path.basename(TARGET)}: {len(pool)} кадров, {len(themes)} семейств")


if __name__ == "__main__":
    main()
