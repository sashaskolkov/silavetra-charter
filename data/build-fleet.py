#!/usr/bin/env python3
"""
Собирает базу, которую читает сайт: data/fleet.csv.

Источники:
  * yachts.csv — 140 парусных лодок из исходной таблицы (все круизные);
  * OWN ниже — 34 собственные лодки «Силы ветра»: спортивные, моторные
    и несколько круизных на витринных направлениях.

К схеме исходной таблицы добавлена одна колонка — «Тип лодки». Без неё
не выразить правило «спортивная берётся только на день и только с базы».

Запуск:  python3 build-fleet.py
"""

import csv
from pathlib import Path

HERE = Path(__file__).parent
SOURCE = HERE / "yachts.csv"
TARGET = HERE / "fleet.csv"

COLUMNS = [
    "Название", "Тип лодки", "Тип Яхты", "Команда", "Добавить повара",
    "Регион", "Порт", "Каюты", "Длина", "Места для гостей", "Туалет",
    "Стоимость за день", "Состояние", "Фото",
]

CAP = "Капитан"
MATE = "Капитан и помощник"
SPORT_PHOTO = "/photos/fleet-1.jpg"
SEA_PHOTO = "/photos/fleet-2.jpg"

# Название, тип, модель, команда, регион, порт, каюты, длина, гости, туалет, цена, состояние, фото
OWN = [
    # Спортивные: только базы «Силы ветра», аренда на день, кают и гальюна нет
    ("SV20 «Норд»", "Спортивная", "SV20", CAP, "Москва", "Пирогово", 0, 6, 5, "Нет", 28000, 5, SPORT_PHOTO),
    ("Platu 25 «Ветер»", "Спортивная", "Platu 25", CAP, "Москва", "Пирогово", 0, 8, 5, "Нет", 34000, 4, SPORT_PHOTO),
    ("SV20 «Ост»", "Спортивная", "SV20", CAP, "Невская губа", "Кронштадт", 0, 6, 5, "Нет", 30000, 5, SPORT_PHOTO),
    ("J/70 «Норд-Ост»", "Спортивная", "J/70", CAP, "Невская губа", "Кронштадт", 0, 7, 5, "Нет", 38000, 5, SPORT_PHOTO),
    ("Platu 25 «Юг»", "Спортивная", "Platu 25", CAP, "Большой Сочи", "Сочи", 0, 8, 5, "Нет", 36000, 4, SPORT_PHOTO),
    ("Melges 24 «Бриз»", "Спортивная", "Melges 24", CAP, "Геленджикская бухта", "Геленджик", 0, 7, 5, "Нет", 32000, 4, SPORT_PHOTO),
    ("SV20 «Вест»", "Спортивная", "SV20", CAP, "Владивосток", "Центральный", 0, 6, 5, "Нет", 29000, 5, SPORT_PHOTO),
    ("Beneteau First 7.5 «Стрелка»", "Спортивная", "Beneteau First 7.5", CAP, "Горьковское море", "Нижний Новгород", 0, 8, 5, "Нет", 26000, 4, SPORT_PHOTO),
    ("Platu 25 «Волга»", "Спортивная", "Platu 25", CAP, "Куйбышевское море", "Казань", 0, 8, 5, "Нет", 27000, 4, SPORT_PHOTO),
    ("Beneteau First 7.5 «Ярославна»", "Спортивная", "Beneteau First 7.5", CAP, "Рыбинское море", "Ярославль", 0, 8, 5, "Нет", 25000, 3, SPORT_PHOTO),

    # Круизные на витринных направлениях
    ("Bavaria Cruiser 46 «Валаам»", "Круизная", "Bavaria Cruiser 46", MATE, "Ладога", "Сортавала", 3, 14, 8, 2, 62000, 5, "/photos/ladoga.jpg"),
    ("Hanse 445 «Шхеры»", "Круизная", "Hanse 445", CAP, "Ладога", "Сортавала", 3, 13, 8, 2, 55000, 4, "/photos/ladoga.jpg"),
    ("Dufour 460 «Помор»", "Круизная", "Dufour 460 Grand Large", MATE, "Белое море", "Чупа", 4, 14, 8, 2, 78000, 5, "/photos/white-sea-pier.jpg"),
    ("Sun Odyssey 449 «Кижи»", "Круизная", "Jeanneau Sun Odyssey 449", CAP, "Онежское озеро", "Петрозаводск", 3, 14, 8, 2, 58000, 4, "/photos/onega.jpg"),
    ("Oceanis 45 «Авача»", "Круизная", "Beneteau Oceanis 45", MATE, "Камчатка", "Фриза", 4, 14, 8, 2, 96000, 5, "/photos/kamchatka.jpg"),
    ("Lagoon 42 «Анива»", "Круизная", "Lagoon 42", MATE, "Сахалин", "Корсаков", 4, 13, 10, 2, 105000, 5, "/photos/sakhalin.jpg"),
    ("Bavaria Cruiser 46 «Лена»", "Круизная", "Bavaria Cruiser 46", MATE, "Якутия", "Ленск", 3, 14, 8, 2, 88000, 4, "/photos/yakutia.jpg"),
    ("Hanse 458 «Выборг»", "Круизная", "Hanse 458", CAP, "Финский залив", "Санкт-Петербург", 4, 14, 8, 2, 68000, 5, SEA_PHOTO),
    ("Oceanis 41 «Ривьера»", "Круизная", "Beneteau Oceanis 41", CAP, "Большой Сочи", "Сочи", 3, 12, 8, 1, 52000, 4, SEA_PHOTO),
    ("Sun Odyssey 410 «Скалы»", "Круизная", "Jeanneau Sun Odyssey 410", CAP, "Геленджикская бухта", "Геленджик", 3, 12, 8, 1, 49000, 5, SEA_PHOTO),
    ("Hanse 415 «Русский»", "Круизная", "Hanse 415", CAP, "Владивосток", "Центральный", 3, 12, 8, 1, 64000, 4, SEA_PHOTO),
    ("Bavaria Cruiser 37 «Азов»", "Круизная", "Bavaria Cruiser 37", CAP, "Азовское море", "Ейск", 3, 11, 6, 1, 42000, 3, SEA_PHOTO),

    # Моторные
    ("Princess V50 «Магнолия»", "Моторная", "Princess V50", MATE, "Большой Сочи", "Сочи", 3, 15, 10, 2, 145000, 5, SEA_PHOTO),
    ("Azimut 55 «Кавказ»", "Моторная", "Azimut 55", MATE, "Геленджикская бухта", "Геленджик", 3, 17, 12, 3, 190000, 5, SEA_PHOTO),
    ("Galeon 425 «Нева»", "Моторная", "Galeon 425 HTS", CAP, "Невская губа", "Кронштадт", 2, 13, 10, 1, 128000, 5, SEA_PHOTO),
    ("Nimbus 405 «Гранит»", "Моторная", "Nimbus 405 Coupe", CAP, "Ладога", "Сортавала", 2, 13, 8, 1, 112000, 4, "/photos/ladoga.jpg"),
    ("Botnia Targa 37 «Косатка»", "Моторная", "Botnia Targa 37", MATE, "Авачинская губа", "Петропавловск-Камчатский", 2, 12, 8, 1, 168000, 5, "/photos/kamchatka.jpg"),
    ("Botnia Targa 32 «Кузова»", "Моторная", "Botnia Targa 32", MATE, "Белое море", "Чупа", 2, 10, 6, 1, 134000, 5, "/photos/white-sea-pier.jpg"),
    ("Azimut 43 «Попова»", "Моторная", "Azimut 43", MATE, "Владивосток", "Центральный", 2, 13, 10, 1, 152000, 4, SEA_PHOTO),
    ("Galeon 380 «Свияга»", "Моторная", "Galeon 380 Fly", CAP, "Куйбышевское море", "Казань", 2, 12, 8, 1, 98000, 4, SEA_PHOTO),
]


def main() -> None:
    with open(SOURCE, encoding="utf-8") as handle:
        source_rows = [
            {key.strip(): (value or "").strip() for key, value in row.items()}
            for row in csv.DictReader(handle)
        ]

    out = []

    for row in source_rows:
        out.append({**row, "Тип лодки": "Круизная"})

    for (name, kind, model, crew, region, port, cabins, length,
         guests, heads, price, condition, photo) in OWN:
        out.append({
            "Название": name,
            "Тип лодки": kind,
            "Тип Яхты": model,
            "Команда": crew,
            # Повар возможен от 12 метров и никогда на спортивной лодке.
            "Добавить повара": "Да" if kind != "Спортивная" and length >= 12 else "Нет",
            "Регион": region,
            "Порт": port,
            "Каюты": cabins,
            "Длина": f"{length} м",
            "Места для гостей": guests,
            "Туалет": heads,
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
        # На спортивной лодке больше пяти человек просто не помещается.
        if row["Тип лодки"] == "Спортивная" and int(row["Места для гостей"]) > 5:
            raise SystemExit(f"больше 5 гостей на спортивной: {row['Название']}")

    with open(TARGET, "w", encoding="utf-8", newline="") as handle:
        writer = csv.DictWriter(handle, fieldnames=COLUMNS)
        writer.writeheader()
        writer.writerows(out)

    kinds: dict[str, int] = {}
    for row in out:
        kinds[row["Тип лодки"]] = kinds.get(row["Тип лодки"], 0) + 1
    regions = len({r["Регион"] for r in out})
    print(f"{TARGET.name}: {len(out)} лодок, {regions} регионов, {kinds}")


if __name__ == "__main__":
    main()
