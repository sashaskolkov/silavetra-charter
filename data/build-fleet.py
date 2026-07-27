#!/usr/bin/env python3
"""
Собирает базу, которую читает сайт: data/fleet.csv.

Источники:
  * yachts.csv — 140 парусных лодок из исходной таблицы (все круизные);
  * OWN ниже — собственные лодки «Силы ветра»: спортивные, моторные
    и несколько круизных на витринных направлениях;
  * geography.py — карта «акватория → большой регион и порт».

К схеме исходной таблицы добавлены две колонки:
  * «Тип лодки» — без неё не выразить правила класса: спортивную берут
    только с базы «Силы ветра», она вмещает четверых, и компанию крупнее
    сажают на несколько лодок;
  * «Регион» — большое направление, по которому идёт поиск. То, что
    исходная таблица звала регионом, теперь называется «Акватория»:
    Темрюкский залив никто не ищет, ищут Азовское море.

Запуск:  python3 build-fleet.py
"""

import csv
import json
from pathlib import Path

import geography

HERE = Path(__file__).parent
SOURCE = HERE / "yachts.csv"
# Расширение на реки, водохранилища и большие озёра — см. expansion.py.
# Отдельным файлом, чтобы исходная таблица оставалась неприкосновенной.
EXTRA = HERE / "expansion.csv"
TARGET = HERE / "fleet.csv"
# Фотопул по темам — см. find-photos.py.
THEMES = HERE / "photos.themes.json"
# Порядок регионов — с запада на восток. В CSV его не выразить,
# поэтому кладём рядом отдельным файлом: сайт читает оба.
ORDER = HERE / "geography.json"

COLUMNS = [
    "Название", "Тип лодки", "Тип Яхты", "Команда", "Добавить повара",
    "Регион", "Акватория", "Порт", "Каюты", "Длина", "Места для гостей",
    "Туалет", "Корпус", "Лодок", "Стоимость за день", "Состояние", "Фото",
]

# Сколько одинаковых корпусов стоит на базе.
#
# Спортивные базы держат флот одного класса: на нём ходят группой
# и гоняются между собой. Компанию больше четырёх человек развозят
# по нескольким лодкам — но только пока лодки есть.
#
# Это ограничение обязано жить в данных. Иначе сайт считает цену
# за три лодки там, где стоит одна, и обещает то, чего нет.
#
# Круизная и моторная всегда одна: её фрахтуют целиком, конкретный корпус.
SPORT_FLEET = {
    "J/70 «Норд-Ост»": 6,
    "SV20 «Ост»": 4,
    "SV20 «Норд»": 5,
    "Platu 25 «Ветер»": 3,
    "Platu 25 «Юг»": 3,
    "Melges 24 «Бриз»": 2,
    "SV20 «Вест»": 2,
    "Beneteau First 7.5 «Стрелка»": 2,
    "Platu 25 «Волга»": 2,
    # «Ярославна» намеренно одна. База с единственной лодкой должна
    # быть в данных, иначе этот случай никто никогда не проверит.
    "Beneteau First 7.5 «Ярославна»": 1,
}

# Корпус: киль или подъёмный шверт.
#
# Свойство только спортивного класса — там есть и то, и другое, и от этого
# зависит характер выхода: килевая устойчивее и не переворачивается,
# швертбот легче и острее на руле. У круизных и моторных киль по определению,
# и колонка у них пустая: пустая ячейка честно говорит «к этой лодке
# не относится», тогда как «Килевая» у всех подряд ничего не сообщала бы.
#
# Отдельная таблица под это не нужна: свойство одно, а строки те же.
# Разводить базы стоило бы, если бы у спортивных набрался свой набор полей.
#
# Весь нынешний спортивный парк килевой. Список ниже пуст намеренно:
# он показывает, где заводить швертбот, когда тот появится.
KEEL = "Килевая"
DINGHY = "Швертбот"
DINGHY_MODELS: set[str] = set()


def hull_of(kind: str, model: str) -> str:
    """Корпус есть только у спортивных; остальным — пусто."""
    if kind != "Спортивная":
        return ""
    return DINGHY if model in DINGHY_MODELS else KEEL

CAP = "Капитан"
MATE = "Капитан и помощник"
SPORT_PHOTO = "/photos/fleet-1.jpg"
SEA_PHOTO = "/photos/fleet-2.jpg"
# Своего кадра у Байкала пока нет — до съёмки ставим общий вид под парусом.
BAIKAL_PHOTO = "/photos/fleet-3.jpg"

# Название, тип, модель, команда, акватория, каюты, длина, гости, туалет, цена, состояние, фото
#
# Порт не указываем: он выводится из акватории через geography.py.
# Иначе «Владивосток» и «Центральный» разъезжаются при первой же правке.
OWN = [
    # Спортивные: только базы «Силы ветра», четыре места, кают и гальюна нет
    ("SV20 «Норд»", "Спортивная", "SV20", CAP, "Москва", 0, 6, 4, "Нет", 28000, 5, SPORT_PHOTO),
    ("Platu 25 «Ветер»", "Спортивная", "Platu 25", CAP, "Москва", 0, 8, 4, "Нет", 34000, 4, SPORT_PHOTO),
    ("SV20 «Ост»", "Спортивная", "SV20", CAP, "Невская губа", 0, 6, 4, "Нет", 30000, 5, SPORT_PHOTO),
    ("J/70 «Норд-Ост»", "Спортивная", "J/70", CAP, "Невская губа", 0, 7, 4, "Нет", 38000, 5, SPORT_PHOTO),
    ("Platu 25 «Юг»", "Спортивная", "Platu 25", CAP, "Большой Сочи", 0, 8, 4, "Нет", 36000, 4, SPORT_PHOTO),
    ("Melges 24 «Бриз»", "Спортивная", "Melges 24", CAP, "Геленджикская бухта", 0, 7, 4, "Нет", 32000, 4, SPORT_PHOTO),
    ("SV20 «Вест»", "Спортивная", "SV20", CAP, "Владивосток", 0, 6, 4, "Нет", 29000, 5, SPORT_PHOTO),
    ("Beneteau First 7.5 «Стрелка»", "Спортивная", "Beneteau First 7.5", CAP, "Горьковское море", 0, 8, 4, "Нет", 26000, 4, SPORT_PHOTO),
    ("Platu 25 «Волга»", "Спортивная", "Platu 25", CAP, "Куйбышевское море", 0, 8, 4, "Нет", 27000, 4, SPORT_PHOTO),
    ("Beneteau First 7.5 «Ярославна»", "Спортивная", "Beneteau First 7.5", CAP, "Рыбинское море", 0, 8, 4, "Нет", 25000, 3, SPORT_PHOTO),

    # Круизные на витринных направлениях
    ("Bavaria Cruiser 46 «Валаам»", "Круизная", "Bavaria Cruiser 46", MATE, "Ладога", 3, 14, 8, 2, 62000, 5, "/photos/ladoga.jpg"),
    ("Hanse 445 «Шхеры»", "Круизная", "Hanse 445", CAP, "Ладога", 3, 13, 8, 2, 55000, 4, "/photos/ladoga.jpg"),
    ("Dufour 460 «Помор»", "Круизная", "Dufour 460 Grand Large", MATE, "Белое море", 4, 14, 8, 2, 78000, 5, "/photos/white-sea-pier.jpg"),
    ("Sun Odyssey 449 «Кижи»", "Круизная", "Jeanneau Sun Odyssey 449", CAP, "Онежское озеро", 3, 14, 8, 2, 58000, 4, "/photos/onega.jpg"),
    ("Oceanis 45 «Авача»", "Круизная", "Beneteau Oceanis 45", MATE, "Камчатка", 4, 14, 8, 2, 96000, 5, "/photos/kamchatka.jpg"),
    ("Lagoon 42 «Анива»", "Круизная", "Lagoon 42", MATE, "Сахалин", 4, 13, 10, 2, 105000, 5, "/photos/sakhalin.jpg"),
    ("Bavaria Cruiser 46 «Лена»", "Круизная", "Bavaria Cruiser 46", MATE, "Якутия", 3, 14, 8, 2, 88000, 4, "/photos/yakutia.jpg"),
    ("Hanse 458 «Выборг»", "Круизная", "Hanse 458", CAP, "Финский залив", 4, 14, 8, 2, 68000, 5, SEA_PHOTO),
    ("Oceanis 41 «Ривьера»", "Круизная", "Beneteau Oceanis 41", CAP, "Большой Сочи", 3, 12, 8, 1, 52000, 4, SEA_PHOTO),
    ("Sun Odyssey 410 «Скалы»", "Круизная", "Jeanneau Sun Odyssey 410", CAP, "Геленджикская бухта", 3, 12, 8, 1, 49000, 5, SEA_PHOTO),
    ("Hanse 415 «Русский»", "Круизная", "Hanse 415", CAP, "Владивосток", 3, 12, 8, 1, 64000, 4, SEA_PHOTO),
    ("Bavaria Cruiser 37 «Азов»", "Круизная", "Bavaria Cruiser 37", CAP, "Азовское море", 3, 11, 6, 1, 42000, 3, SEA_PHOTO),

    # Байкал: пресноводный регион без спортивной базы — баз остаётся восемь
    ("Bavaria Cruiser 41 «Ольхон»", "Круизная", "Bavaria Cruiser 41", CAP, "Южный Байкал", 3, 12, 8, 2, 32000, 5, BAIKAL_PHOTO),
    ("Hanse 415 «Баргузин»", "Круизная", "Hanse 415", CAP, "Южный Байкал", 3, 12, 8, 1, 30500, 4, BAIKAL_PHOTO),
    ("Sun Odyssey 449 «Сарма»", "Круизная", "Jeanneau Sun Odyssey 449", MATE, "Южный Байкал", 4, 14, 10, 2, 41000, 5, BAIKAL_PHOTO),
    ("Bavaria Cruiser 37 «Хужир»", "Круизная", "Bavaria Cruiser 37", CAP, "Малое Море", 3, 11, 6, 1, 22500, 4, BAIKAL_PHOTO),
    ("Oceanis 45 «Шаманка»", "Круизная", "Beneteau Oceanis 45", MATE, "Малое Море", 4, 14, 10, 2, 38500, 4, BAIKAL_PHOTO),

    # Моторные
    ("Princess V50 «Магнолия»", "Моторная", "Princess V50", MATE, "Большой Сочи", 3, 15, 10, 2, 145000, 5, SEA_PHOTO),
    ("Azimut 55 «Кавказ»", "Моторная", "Azimut 55", MATE, "Геленджикская бухта", 3, 17, 12, 3, 190000, 5, SEA_PHOTO),
    ("Galeon 425 «Нева»", "Моторная", "Galeon 425 HTS", CAP, "Невская губа", 2, 13, 10, 1, 128000, 5, SEA_PHOTO),
    ("Nimbus 405 «Гранит»", "Моторная", "Nimbus 405 Coupe", CAP, "Ладога", 2, 13, 8, 1, 112000, 4, "/photos/ladoga.jpg"),
    ("Botnia Targa 37 «Косатка»", "Моторная", "Botnia Targa 37", MATE, "Авачинская губа", 2, 12, 8, 1, 168000, 5, "/photos/kamchatka.jpg"),
    ("Botnia Targa 32 «Кузова»", "Моторная", "Botnia Targa 32", MATE, "Белое море", 2, 10, 6, 1, 134000, 5, "/photos/white-sea-pier.jpg"),
    ("Azimut 43 «Попова»", "Моторная", "Azimut 43", MATE, "Владивосток", 2, 13, 10, 1, 152000, 4, SEA_PHOTO),
    ("Galeon 380 «Свияга»", "Моторная", "Galeon 380 Fly", CAP, "Куйбышевское море", 2, 12, 8, 1, 98000, 4, SEA_PHOTO),
]


# Модель → семейство верфи. Ключ ищется в названии модели как подстрока,
# поэтому «Bavaria Cruiser 46» и «Bavaria 45» одинаково попадают в bavaria.
#
# Порядок важен: «Beneteau First 7.5» должна уйти в спорт, а не в beneteau,
# поэтому спортивные корпуса проверяются раньше верфей.
FAMILY_BY_MODEL = [
    ("motor", ("Princess", "Azimut", "Ferretti", "Sunseeker", "Galeon",
               "Nimbus", "Targa", "Bayliner", "Jongert")),
    ("catamaran", ("Lagoon",)),
    ("bavaria", ("Bavaria",)),
    ("beneteau", ("Beneteau", "Oceanis")),
    ("jeanneau", ("Jeanneau", "Sun Odyssey")),
    ("hanse", ("Hanse",)),
    ("dufour", ("Dufour",)),
    ("hallberg", ("Hallberg",)),
    ("swan", ("Swan",)),
    ("elan", ("Elan", "Salona", "Grand Soleil")),
    # Советские корпуса — «Конрад», «Полутонник», «Дракон» — идут в общий
    # пул круизных. Сначала я завёл им семейство «классика», но запросы
    # про классику вытянули архив начала XX века: чёрно-белую Сиднейскую
    # гавань и один броненосец. Каталог сдаёт лодки сегодня, а не в 1908-м.
]


# Парусные семейства взаимозаменяемы: сперва лодка берёт кадры своей верфи,
# а когда те кончились — любые круизные под парусом.
SAIL_FAMILIES = (
    "cruiser", "bavaria", "beneteau", "jeanneau",
    "hanse", "dufour", "elan", "hallberg", "swan",
)


def family_of(model: str) -> str:
    """Семейство верфи по названию модели; всё неопознанное — в общий пул."""
    for family, marks in FAMILY_BY_MODEL:
        if any(mark.lower() in model.lower() for mark in marks):
            return family
    return "cruiser"


def assign_photos(rows: list[dict]) -> None:
    """
    Раздаёт кадры по модели лодки.

    Первая версия раздавала по региону — «лодке её море». Идея была красивая,
    но категории мест по определению отдают пейзаж, и в базе оказались сотни
    снимков воды без единой яхты в кадре. Ось оказалась не та: человек
    смотрит на карточку, чтобы увидеть **лодку**.

    Теперь Bavaria Cruiser 46 получает кадр «Баварии», Lagoon — катамаран,
    а Princess — моторную. Там, где своей съёмки на свободных лицензиях
    почти нет (Hanse, Dufour), семейство добирается общим пулом круизных.
    """
    if not THEMES.exists():
        print("  нет photos.themes.json — кадры остаются как есть")
        return

    by_family = json.loads(THEMES.read_text(encoding="utf-8"))
    cursors: dict[str, int] = {}

    for row in rows:
        # Спортивной оставляем её кадр с гонки: в чартерных каталогах
        # гоночных килевиков нет, а круизник вместо «Мелджеса» — обман.
        if row["Тип лодки"] == "Спортивная":
            continue

        family = family_of(row["Тип Яхты"])
        pool = list(by_family.get(family, []))

        # Круизный парусник без опознанной верфи — это в основном советские
        # корпуса, а их в базе больше сотни. Своего пула им не набрать,
        # поэтому берут любой парусный кадр: «Конрад» и «Бавария» — обе
        # круизные лодки одного размера, и подмена не режет глаз.
        if family in SAIL_FAMILIES:
            for sail in SAIL_FAMILIES:
                pool += [u for u in by_family.get(sail, []) if u not in pool]
        elif len(pool) < 8:
            pool += [u for u in by_family.get("cruiser", []) if u not in pool]
        if not pool:
            continue

        index = cursors.get(family, 0)
        row["Фото"] = pool[index % len(pool)]
        cursors[family] = index + 1


def main() -> None:
    geography.check()

    with open(SOURCE, encoding="utf-8") as handle:
        source_rows = [
            {key.strip(): (value or "").strip() for key, value in row.items()}
            for row in csv.DictReader(handle)
        ]

    out = []

    # В исходной таблице колонка «Регион» хранит акваторию, а «Порт» иногда
    # промахивается мимо гавани. Раскладываем и то и другое по geography.py.
    for row in source_rows:
        region, area, port = geography.resolve(row["Регион"])
        out.append({
            **row,
            "Тип лодки": "Круизная",
            "Регион": region,
            "Акватория": area,
            "Порт": port,
            "Корпус": hull_of("Круизная", row["Тип Яхты"]),
            "Лодок": 1,
        })

    # Расширение говорит на новом словаре: в колонке «Регион» у него уже
    # акватория, и порт назван верно. Поэтому берём только регион.
    if EXTRA.exists():
        with open(EXTRA, encoding="utf-8") as handle:
            for row in csv.DictReader(handle):
                row = {k.strip(): (v or "").strip() for k, v in row.items()}
                area = row["Регион"]
                out.append({
                    **row,
                    "Регион": geography.region_of(area),
                    "Акватория": area,
                    "Корпус": hull_of(row["Тип лодки"], row["Тип Яхты"]),
                    "Лодок": 1,
                })

    for (name, kind, model, crew, source_area, cabins, length,
         guests, heads, price, condition, photo) in OWN:
        region, area, port = geography.resolve(source_area)
        out.append({
            "Название": name,
            "Тип лодки": kind,
            "Тип Яхты": model,
            "Команда": crew,
            # Повар возможен от 12 метров и никогда на спортивной лодке.
            "Добавить повара": "Да" if kind != "Спортивная" and length >= 12 else "Нет",
            "Регион": region,
            "Акватория": area,
            "Порт": port,
            "Каюты": cabins,
            "Длина": f"{length} м",
            "Места для гостей": guests,
            "Туалет": heads,
            "Корпус": hull_of(kind, model),
            "Лодок": SPORT_FLEET.get(name, 1),
            "Стоимость за день": price,
            "Состояние": condition,
            "Фото": photo,
        })

    names = [r["Название"] for r in out]
    duplicates = {n for n in names if names.count(n) > 1}
    if duplicates:
        raise SystemExit(f"дубли названий: {sorted(duplicates)}")

    for row in out:
        length = int("".join(ch for ch in row["Длина"] if ch.isdigit()))
        if row["Добавить повара"] == "Да" and length < 12:
            raise SystemExit(f"повар на лодке короче 12 м: {row['Название']}")
        if row["Тип лодки"] == "Спортивная" and row["Каюты"] != 0:
            raise SystemExit(f"каюты на спортивной лодке: {row['Название']}")
        # В спортивную лодку больше четверых просто не помещается:
        # компанию крупнее сажают на две лодки, а не докупают места.
        if row["Тип лодки"] == "Спортивная" and int(row["Места для гостей"]) > 4:
            raise SystemExit(f"больше 4 гостей на спортивной: {row['Название']}")
        sport = row["Тип лодки"] == "Спортивная"
        if sport and not row["Корпус"]:
            raise SystemExit(f"спортивная без корпуса: {row['Название']}")
        if not sport and row["Корпус"]:
            raise SystemExit(f"корпус у неспортивной лодки: {row['Название']}")
        fleet = int(row["Лодок"])
        if fleet < 1:
            raise SystemExit(f"ноль лодок на базе: {row['Название']}")
        # Круизную и моторную фрахтуют целиком — второй такой же нет.
        if not sport and fleet != 1:
            raise SystemExit(f"неспортивная лодка не одна: {row['Название']}")

    assign_photos(out)

    # Акватория обязана жить в одном регионе: иначе поиск по региону
    # покажет лодку, а хлебные крошки уведут в другое место.
    homes: dict[str, str] = {}
    for row in out:
        home = homes.setdefault(row["Акватория"], row["Регион"])
        if home != row["Регион"]:
            raise SystemExit(
                f"акватория «{row['Акватория']}» разошлась по регионам: "
                f"{home} и {row['Регион']}"
            )

    with open(TARGET, "w", encoding="utf-8", newline="") as handle:
        writer = csv.DictWriter(handle, fieldnames=COLUMNS)
        writer.writeheader()
        writer.writerows(out)

    with open(ORDER, "w", encoding="utf-8") as handle:
        json.dump(
            {"regions": geography.REGION_ORDER},
            handle,
            ensure_ascii=False,
            indent=2,
        )
        handle.write("\n")

    kinds: dict[str, int] = {}
    for row in out:
        kinds[row["Тип лодки"]] = kinds.get(row["Тип лодки"], 0) + 1
    regions = len({r["Регион"] for r in out})
    areas = len({r["Акватория"] for r in out})
    bases = len({r["Порт"] for r in out if r["Тип лодки"] == "Спортивная"})
    print(
        f"{TARGET.name}: {len(out)} лодок, {regions} регионов, "
        f"{areas} акваторий, {bases} спортивных баз, {kinds}"
    )


if __name__ == "__main__":
    main()
