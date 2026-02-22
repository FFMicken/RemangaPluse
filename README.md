# ReManga User Status & Notifications+

Неофициальное расширение для [ReManga.org](https://remanga.org), которое добавляет полезные функции для активных пользователей: онлайн-статус, расширенную историю уведомлений и фильтры в апгрейде карточек.

## Возможности

### Онлайн-статус пользователей

- Добавляет индикатор на аватар пользователя.
- Зеленый индикатор: пользователь онлайн.
- Красный индикатор: пользователь оффлайн.

### Улучшенные уведомления

- Бесконечная подгрузка истории уведомлений.
- Поддержка всех основных категорий уведомлений.

### Улучшение апгрейда карточек

- Быстрая загрузка карточек через API.
- Фильтры по рангу и тайтлу.
- Сортировка по рангу и по новизне.

## Установка в Chromium-браузеры (Chrome, Edge, Opera, Яндекс)

1. Скачай проект (`Code` -> `Download ZIP`) и распакуй его.
2. Открой страницу расширений:
- Chrome/Brave: `chrome://extensions`
- Edge: `edge://extensions`
- Opera: `opera://extensions`
- Яндекс: `browser://extensions`
3. Включи `Режим разработчика` (`Developer mode`).
4. Нажми `Загрузить распакованное расширение` (`Load unpacked`).
5. Выбери папку `dist/chromium`.

После обновления кода нажимай кнопку `Reload` у расширения на странице расширений.

## Установка в Firefox на ПК

1. Открой: `about:debugging#/runtime/this-firefox`
2. Нажми `Загрузить временное дополнение...` (`Load Temporary Add-on`).
3. Выбери файл `dist/firefox/manifest.json`.

Важно: временное дополнение в Firefox сбрасывается после полного закрытия браузера.

## Для разработчика

### Структура репозитория

- `src/` - общий код расширения
- `manifests/chromium/manifest.json` - манифест Chromium
- `manifests/firefox/manifest.json` - манифест Firefox
- `assets/icon48.png` - иконка
- `dist/` - собранные версии
- `scripts/` - скрипты сборки

### Сборка

```powershell
./scripts/build-chromium.ps1
./scripts/build-firefox.ps1
```

### Автосборка при изменениях

```powershell
./scripts/watch-build.ps1
```

Опции:

- `-Target all|chromium|firefox` (по умолчанию `all`)
- `-DebounceMs 400` - задержка перед пересборкой

Примеры:

```powershell
./scripts/watch-build.ps1 -Target chromium
./scripts/watch-build.ps1 -Target firefox -DebounceMs 700
```

### Упаковка Firefox `.xpi`

```powershell
./scripts/pack-firefox-xpi.ps1
```

Результат: `dist/remanga-plus-firefox.xpi`
