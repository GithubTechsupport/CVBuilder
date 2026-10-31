import express from 'express';
import fs from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { randomUUID } from 'node:crypto';
import { buildExampleCV } from './seed/example.js';
import { renderPdf, closeBrowser } from './pdf.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const DATA_DIR = process.env.CV_DATA_DIR || path.join(ROOT, 'data', 'cvs');
const DIST_DIR = path.join(ROOT, 'dist');
const PORT = Number(process.env.PORT || 3001);

const ID_RE = /^[A-Za-z0-9_-]{1,64}$/;
const fileFor = (id) => path.join(DATA_DIR, `${id}.json`);

async function writeJsonAtomic(file, data) {
  const tmp = `${file}.${process.pid}.tmp`;
  await fs.writeFile(tmp, JSON.stringify(data, null, 2), 'utf8');
  try {
    await fs.rename(tmp, file);
  } catch {
    // OneDrive / antivirus can briefly lock the target on Windows; fall back to a direct write.
    await fs.writeFile(file, JSON.stringify(data, null, 2), 'utf8');
    await fs.rm(tmp, { force: true });
  }
}

async function readCV(id) {
  return JSON.parse(await fs.readFile(fileFor(id), 'utf8'));
}

async function ensureSeeded() {
  await fs.mkdir(DATA_DIR, { recursive: true });
  const marker = path.join(DATA_DIR, '.seeded');
  if (existsSync(marker)) return;
  const files = (await fs.readdir(DATA_DIR)).filter((f) => f.endsWith('.json'));
  if (files.length === 0) {
    const cv = await buildExampleCV(randomUUID());
    await writeJsonAtomic(fileFor(cv.id), cv);
  }
  await fs.writeFile(marker, new Date().toISOString());
}

const app = express();
app.use(express.json({ limit: '25mb' }));

app.get('/api/cvs', async (_req, res, next) => {
  try {
    const files = (await fs.readdir(DATA_DIR)).filter((f) => f.endsWith('.json'));
    const cvs = [];
    for (const f of files) {
      try {
        cvs.push(JSON.parse(await fs.readFile(path.join(DATA_DIR, f), 'utf8')));
      } catch (err) {
        console.warn(`Skipping unreadable CV file ${f}:`, err.message);
      }
    }
    cvs.sort((a, b) => String(b.updatedAt).localeCompare(String(a.updatedAt)));
    res.json(cvs);
  } catch (err) {
    next(err);
  }
});

app.get('/api/cvs/:id', async (req, res, next) => {
  const { id } = req.params;
  if (!ID_RE.test(id)) return res.status(400).json({ error: 'Invalid id' });
  try {
    res.json(await readCV(id));
  } catch (err) {
    if (err.code === 'ENOENT') return res.status(404).json({ error: 'Not found' });
    next(err);
  }
});

app.put('/api/cvs/:id', async (req, res, next) => {
  const { id } = req.params;
  if (!ID_RE.test(id)) return res.status(400).json({ error: 'Invalid id' });
  const cv = req.body;
  if (!cv || typeof cv !== 'object' || cv.id !== id) {
    return res.status(400).json({ error: 'Body must be a CV whose id matches the URL' });
  }
  try {
    cv.updatedAt = new Date().toISOString();
    cv.createdAt ??= cv.updatedAt;
    await writeJsonAtomic(fileFor(id), cv);
    res.json({ ok: true, updatedAt: cv.updatedAt });
  } catch (err) {
    next(err);
  }
});

app.delete('/api/cvs/:id', async (req, res, next) => {
  const { id } = req.params;
  if (!ID_RE.test(id)) return res.status(400).json({ error: 'Invalid id' });
  try {
    await fs.rm(fileFor(id), { force: true });
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

app.get('/api/example', async (_req, res, next) => {
  try {
    res.json(await buildExampleCV(randomUUID()));
  } catch (err) {
    next(err);
  }
});

// Renders the CV through the app's own /print route in headless Chrome, so the PDF
// uses exactly the same templates and fonts as the on-screen preview.
app.post('/api/pdf', async (req, res, next) => {
  const { cv, origin } = req.body ?? {};
  if (!cv || typeof cv !== 'object') return res.status(400).json({ error: 'Missing cv' });
  let appOrigin;
  try {
    appOrigin = new URL(origin).origin;
    const host = new URL(appOrigin).hostname;
    if (!['localhost', '127.0.0.1', '[::1]'].includes(host)) throw new Error('non-local origin');
  } catch {
    return res.status(400).json({ error: 'origin must be a local app URL' });
  }
  try {
    const pdf = await renderPdf(appOrigin, cv);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Length', pdf.length);
    res.end(pdf);
  } catch (err) {
    next(err);
  }
});

if (existsSync(DIST_DIR)) {
  app.use(express.static(DIST_DIR));
  app.get(/^(?!\/api\/).*/, (_req, res) => res.sendFile(path.join(DIST_DIR, 'index.html')));
}

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: err.message || 'Server error' });
});

await ensureSeeded();
const server = app.listen(PORT, () => {
  console.log(`CV Builder API listening on http://localhost:${PORT}`);
  if (existsSync(DIST_DIR)) console.log(`Serving built app at http://localhost:${PORT}`);
});

for (const sig of ['SIGINT', 'SIGTERM']) {
  process.on(sig, async () => {
    server.close();
    await closeBrowser();
    process.exit(0);
  });
}
