# Выкладка на GitHub Pages

Сейчас сайт выкладывается вручную: собранная статика уходит в ветку `gh-pages`,
Pages отдаёт её из корня этой ветки.

## Обновить сайт

Из `experiments/silavetra-charter`:

```bash
NEXT_PUBLIC_BASE_PATH=/silavetra-charter npm run build
npx gh-pages -d out --dotfiles
```

Флаг `--dotfiles` обязателен: без него не уедет `.nojekyll`, и Pages
выбросит папку `_next` — сайт останется без стилей и скриптов.

## Включить автосборку

Файл `github-pages.yml` — готовый workflow, он собирает и выкладывает сайт
при каждом пуше в `main`. Положить его на место мешает право `workflow`,
которого нет у текущего токена `gh`.

Чтобы включить, выполните в терминале:

```bash
gh auth refresh -s workflow          # откроется браузер, подтвердите доступ
git mv deploy/github-pages.yml .github/workflows/deploy.yml
git commit -m "CI: автосборка GitHub Pages"
git push
```

После этого в настройках репозитория (Settings → Pages) источником нужно
выбрать **GitHub Actions** вместо ветки `gh-pages`.

## Почему статика

GitHub Pages не умеет запускать сервер, поэтому в `next.config.ts` стоит
`output: "export"`. Из-за этого:

- страница подбора фильтрует каталог в браузере, а не на сервере;
- форма заявки проверяется на клиенте — серверных обработчиков нет;
- `next/image` работает без оптимизатора (`unoptimized: true`);
- к путям картинок вручную дописывается `basePath` — сам `next/image`
  этого не делает, и без хелпера `src/lib/asset.ts` фотографии отвалятся.
