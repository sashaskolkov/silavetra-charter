#!/usr/bin/env python3
"""
Переназначает фотографии в fleet.csv.

Каждый из 38 кадров каталога отсмотрен глазами. Отбракованы те, что
не показывают нормальную парусную яхту: надувные катамараны и тримараны,
байдарки с парусом, разборные микро-лодки, а заодно баржа, портовые краны,
здание яхт-клуба, пустая набережная и моторные яхты.

Годные кадры раздаются по кругу — повторы допустимы, лишь бы на карточке
была настоящая парусная яхта.

Запуск:  python3 fix-photos.py
Скрипт идемпотентный: повторный запуск ничего не меняет.
"""

import csv
import json
from pathlib import Path

HERE = Path(__file__).parent
FLEET = HERE / "fleet.csv"
MANIFEST = (
    HERE.parent
    / "experiments/silavetra-charter/src/data/photo-manifest.json"
)

W = "https://upload.wikimedia.org/wikipedia/commons/"
T = "https://static.tildacdn.com/"

# --- Годные кадры: настоящие парусные яхты ---------------------------------
APPROVED = [
    # Шхуна «Пётр I» у айсберга
    W + "thumb/5/5d/Yaht_Peter_Pervy_M25A0153.jpg/1280px-Yaht_Peter_Pervy_M25A0153.jpg",
    # «Liberty» под камчатскими скалами
    T + "tild6266-3762-4766-b939-303630376638/_DSC1609.jpg",
    # Круизная яхта «Силы ветра» под парусами
    T + "tild3163-6436-4461-b630-333533373061/Photo_21052021_19_55.jpg",
    # Палуба шхуны на закате, Финский залив
    W + "thumb/0/0b/%D0%9F%D0%B0%D1%80%D1%83%D1%81%D0%BD%D0%B0%D1%8F_%D1%80%D0%B5%D0%B3%D0%B0%D1%82%D0%B0_%D0%B2_%D0%A1%D0%B0%D0%BD%D0%BA%D1%82-%D0%9F%D0%B5%D1%82%D0%B5%D1%80%D0%B1%D1%83%D1%80%D0%B3%D0%B5_IMG_3402WI.jpg/1280px-%D0%9F%D0%B0%D1%80%D1%83%D1%81%D0%BD%D0%B0%D1%8F_%D1%80%D0%B5%D0%B3%D0%B0%D1%82%D0%B0_%D0%B2_%D0%A1%D0%B0%D0%BD%D0%BA%D1%82-%D0%9F%D0%B5%D1%82%D0%B5%D1%80%D0%B1%D1%83%D1%80%D0%B3%D0%B5_IMG_3402WI.jpg",
    # Бушприт под парусами
    W + "thumb/7/7b/Sailing_in_Gulf_of_Finland%2C_Russia-1.jpg/1280px-Sailing_in_Gulf_of_Finland%2C_Russia-1.jpg",
    # Палуба под гиком, закат над Финским заливом
    W + "thumb/d/de/Sunset_over_Gulf_of_Finland%2C_Saint_Petersburg.jpg/1280px-Sunset_over_Gulf_of_Finland%2C_Saint_Petersburg.jpg",
    # «Адмирал Невельской» под парусами
    W + "a/aa/Admiral_nevelskoi_yacht.jpg",
    # «Вигри» в регате
    W + "8/81/%D0%AF%D1%85%D1%82%D0%B0_%22%D0%92%D0%B8%D0%B3%D1%80%D0%B8%22%2C_RUS_1226.jpg",
    # Регата на Онего
    W + "thumb/d/d2/40-th_Regatta_Onego-2011.JPG/1280px-40-th_Regatta_Onego-2011.JPG",
    # Яхты у причала Петрозаводска
    W + "thumb/d/d4/%D0%9F%D1%80%D0%B8%D1%87%D0%B0%D0%BB%D0%9F%D0%B5%D1%82%D1%80%D0%BE%D0%B7%D0%B0%D0%B2%D0%BE%D0%B4%D1%81%D0%BA%D0%BE%D0%B3%D0%BE%D0%9F%D0%BE%D1%80%D1%82%D0%B0.jpg/1280px-%D0%9F%D1%80%D0%B8%D1%87%D0%B0%D0%BB%D0%9F%D0%B5%D1%82%D1%80%D0%BE%D0%B7%D0%B0%D0%B2%D0%BE%D0%B4%D1%81%D0%BA%D0%BE%D0%B3%D0%BE%D0%9F%D0%BE%D1%80%D1%82%D0%B0.jpg",
    # Шхуна «Надежда» в Сортавале
    W + "f/fa/Sortavala_harbour.jpg",
    # Рейд с крейсерскими яхтами
    W + "thumb/1/13/%D0%AF%D1%85%D1%82%D1%8B_%D0%BD%D0%B0_%D0%A0%D0%B5%D0%B9%D0%B4%D0%B5.jpg/1280px-%D0%AF%D1%85%D1%82%D1%8B_%D0%BD%D0%B0_%D0%A0%D0%B5%D0%B9%D0%B4%D0%B5.jpg",
    # Яхта в ладожских шхерах
    W + "thumb/8/88/Ladoga._Lauvatsaari_island.jpg/1280px-Ladoga._Lauvatsaari_island.jpg",
    # Спортивные яхты в Строгино
    W + "2/2d/Yacht_Sierra_in_Strogino_2024.jpg",
    # Собственные кадры «Силы ветра»
    "/photos/fleet-1.jpg",
    "/photos/fleet-2.jpg",
]

# --- Отбраковка: что именно не так с кадром --------------------------------
REJECTED = {
    "Catamaran_sailboat_on_the_lake": "надувной походный катамаран",
    "Catamaran_m761": "надувной катамаран",
    "176_%D0%BE._%D0%A0%D0%B5%D0%B9%D0%BD%D0%B5%D0%BA%D0%B5": "старый катер у причала",
    "%D0%AF%D0%BD%D1%82%D0%B0%D1%80%D0%B8_92": "разборные тримараны на берегу",
    "%D0%9C%D0%B5%D0%B2%D1%8B_%D0%BD%D0%B0_%D0%90%D0%B7%D0%BE%D0%B2%D0%B5": "надувные швертботы «Мева»",
    "%D0%9F%D1%80%D0%BE%D1%81%D1%82%D0%BE%D1%80_2001": "надувной катамаран",
    "%D0%90%D0%BB%D1%8C%D0%B1%D0%B0%D1%82%D1%80%D0%BE%D1%81%D1%8B": "надувные катамараны",
    "%D0%91%D0%B5%D0%BB%D0%BE%D0%B5_%D0%BC%D0%BE%D1%80%D0%B5_76": "байдарки с парусом",
    "GRINDA_2010": "надувной тримаран",
    "%D0%92%D0%B5%D1%82%D0%B5%D1%80_%D0%9B%D0%B0%D0%B4%D0%BE%D0%B3%D0%B004": "надувной катамаран",
    "Ship_in_Oktyabrsky": "баржа с портовым краном",
    "Anlegestelle_in_Listvyanka": "моторные катера",
    "%D0%AF%D1%85%D1%82%D1%8B_%D0%BD%D0%B0_%D0%9E%D0%B1%D1%81%D0%BA%D0%BE%D0%BC": "лодки-точки под ЛЭП",
    "Yacht_club_Petrovskaya_kosa": "здание яхт-клуба зимой",
    "%D0%90%D1%80%D1%85%D0%B0%D0%BD%D0%B3%D0%B5%D0%BB%D1%8C%D1%81%D0%BA%D0%B8%D0%B9": "марина за забором",
    "%D0%AF%D1%85%D1%82-%D0%BA%D0%BB%D1%83%D0%B1_-_panoramio": "пустая набережная",
    "Nizhny_Novgorod": "городской вид, яхт почти не видно",
    "Taganrog": "портовые краны",
    "Kazan_River_port_area": "далёкая марина с теплоходом",
    "Unknown_Russian_Yacht": "моторная яхта",
    "Princess57": "моторная яхта",
    "Peterson_25": "мелкие гонщики на трейлерах",
}


def rejected_reason(url: str) -> str | None:
    for marker, reason in REJECTED.items():
        if marker in url:
            return reason
    return None


def check_approved() -> None:
    """
    Каждая внешняя ссылка должна быть уже скачана.

    Опечатка в хеш-префиксе Викисклада даёт живую с виду ссылку, которая
    не найдётся в манифесте — и кадр молча останется внешним. Ловим сразу.
    """
    if not MANIFEST.exists():
        print("манифест не найден, проверка ссылок пропущена")
        return

    known = set(json.loads(MANIFEST.read_text(encoding="utf-8")))
    missing = [u for u in APPROVED if u.startswith("http") and u not in known]
    if missing:
        raise SystemExit(
            "нет в манифесте (сначала npm run fetch-photos):\n  "
            + "\n  ".join(u[:110] for u in missing)
        )


def main() -> None:
    check_approved()

    with open(FLEET, encoding="utf-8") as handle:
        reader = csv.DictReader(handle)
        columns = reader.fieldnames or []
        rows = list(reader)

    replaced = 0
    reasons: dict[str, int] = {}

    for index, row in enumerate(rows):
        reason = rejected_reason(row["Фото"])
        if reason is None:
            continue
        row["Фото"] = APPROVED[index % len(APPROVED)]
        reasons[reason] = reasons.get(reason, 0) + 1
        replaced += 1

    left = [r["Фото"] for r in rows if rejected_reason(r["Фото"])]
    if left:
        raise SystemExit(f"остались плохие кадры: {left[:3]}")

    with open(FLEET, "w", encoding="utf-8", newline="") as handle:
        writer = csv.DictWriter(handle, fieldnames=columns)
        writer.writeheader()
        writer.writerows(rows)

    print(f"переназначено строк: {replaced}")
    for reason, count in sorted(reasons.items(), key=lambda p: -p[1]):
        print(f"  {count:3d}  {reason}")
    print(f"осталось уникальных кадров: {len({r['Фото'] for r in rows})}")


if __name__ == "__main__":
    main()
