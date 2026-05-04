# Supabase

Схема БД и инструкции по применению миграций.

## Применение миграций

Workflow выбран простой: SQL-файлы вручную через дашборд.

1. Откройте https://supabase.com/dashboard → проект `ufvydbapqcvizoesppfb`
2. Слева **SQL Editor** → **New query**
3. Скопируйте содержимое нужного файла из `migrations/` и вставьте
4. Нажмите **Run**

Применять миграции **по порядку номеров**, по одной за раз. После каждой проверяйте, что нет ошибок, прежде чем переходить к следующей.

## Применённые миграции

- [x] `0001_init.sql` — расширение PostGIS, таблицы `pois`/`routes`/M2M/пользовательские, RLS, RPC `pois_in_bbox` и `pois_nearby`
- [ ] `0002_upsert_poi.sql` — RPC `upsert_poi` для импорта POI из content-pipeline (вызывается с service_role ключом из `pnpm content:import`)

## Storage buckets

После применения миграций — создать bucket для фото POI.

1. Дашборд → **Storage** → **New bucket**
2. Имя: `poi-images`
3. **Public bucket: ON** (фото открыты для чтения всем)
4. **Allowed MIME types**: `image/jpeg, image/png, image/webp`
5. **Max file size**: `5 MB`
6. Создать.

Дополнительные политики RLS на bucket пока не нужны — публичное чтение по умолчанию, запись будет только с сервера через secret key.

## Схема (краткое описание)

| Таблица | Назначение |
|---|---|
| `pois` | здание/мост/памятник: координата, текст, факты, фото |
| `routes` | готовый прогулочный маршрут |
| `route_pois` | состав маршрута: POI с порядком |
| `user_poi_favorites` | избранные POI пользователя |
| `user_route_favorites` | избранные маршруты пользователя |
| `user_poi_visits` | посещённые POI (для гейминфикации) |
| `user_route_sessions` | прогресс прохождения маршрута |

## RPC

| Функция | Что делает |
|---|---|
| `pois_in_bbox(west, south, east, north)` | POI в видимой области карты — основной запрос для маркеров |
| `pois_nearby(in_lng, in_lat, radius_m)` | ближайшие POI с дистанцией — для геолокационных оповещений |
| `upsert_poi(...)` | импорт POI с сервера: lng/lat → PostGIS Point, ON CONFLICT DO NOTHING (или OVERWRITE). Доступна только service_role |
