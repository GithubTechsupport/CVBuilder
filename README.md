# CV Builder

A local web app for building CVs. Pick a template, edit sections with rich text, reorder them by
drag and drop, and export PDFs. Everything runs on your own machine, and your CVs never leave it.

## Launching the app

Requires [Node.js](https://nodejs.org) 20.19 or newer.

```bash
npm install     # first time only (also downloads the headless Chrome used for PDF export)
npm run dev     # starts the API on :3001 and the app on :5173
```

Then open **http://localhost:5173**.

To run it as a single server instead (no hot reload):

```bash
npm run build
npm start       # open http://localhost:3001
```

## How CVs are stored

Each CV is saved as **one JSON file** in `data/cvs/`, named after the CV's id:

```
data/
└── cvs/
    ├── 54d1723c-5e19-42e4-9564-8a175236ae46.json
    ├── 4353c834-b345-4ffa-9a65-25bf5d44c1fb.json
    └── .seeded
```

- The editor **autosaves** while you type (Ctrl+S saves immediately) through the local Express API
  (`GET/PUT/DELETE /api/cvs/:id` in `server/index.js`).
- A file holds the whole CV: template, style settings, profile (including the photo as a data URL)
  and all sections. The shape is defined by the `CV` type in `src/types.ts`.
- On first start, when `data/cvs/` is empty, the dashboard is seeded with a fictional example CV
  (`server/seed/example.js`). The `.seeded` marker stops that from happening again.
- To back up or move a CV, copy its JSON file, or use **Export JSON** / **Import JSON** on the dashboard.
- Set `CV_DATA_DIR` to store CVs somewhere else, e.g. `CV_DATA_DIR=~/my-cvs npm start`.

`data/` is listed in `.gitignore`, so your CVs and personal details are never committed.

## PDF export

The server opens the app's `/print` route in headless Chrome (Puppeteer) and prints it, so the PDF
matches the on-screen preview exactly. If that fails, the app opens the print view in a new tab,
where the browser's **Save as PDF** gives the same result.

## Project layout

```
server/       Express API (CV storage, PDF rendering) and the example CV
src/cv/       CV renderer and template CSS (shared by preview, thumbnails and PDF)
src/editor/   Editor panels: sections, rich text, photo, design
src/pages/    Dashboard, Editor, Print route
src/lib/      Data model helpers, templates/palettes catalog, API client
data/cvs/     Saved CVs (one JSON file each, not committed)
```
