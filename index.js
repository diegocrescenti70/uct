// index.js — Express server per SPA + env.js (robusto alle assenze di file)
const express = require('express');
const path = require('path');
const fs = require('fs');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;
const isProd = process.env.NODE_ENV === 'production';
const PUBLIC_DIR = path.join(__dirname, 'public');

// ---------- Statici (prima di tutto) ----------
app.use(express.static(PUBLIC_DIR, {
  etag: isProd,
  lastModified: isProd,
  setHeaders: (res, filePath) => {
    if (!isProd) {
      res.setHeader('Cache-Control', 'no-store');
    } else {
      if (/\.(css|js|mjs|svg|png|jpg|jpeg|gif|webp|ico|woff2?)$/i.test(filePath)) {
        res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
      } else {
        res.setHeader('Cache-Control', 'public, max-age=300');
      }
    }
  }
}));

// helper per inviare file solo se esistono
function sendIfExists(res, absPath, mime, notFoundMessage) {
  if (fs.existsSync(absPath)) {
    if (!isProd) res.set('Cache-Control', 'no-store');
    if (mime) res.type(mime);
    return res.sendFile(absPath);
  }
  // niente eccezioni: rispondi 404 pulito
  return res.status(404).type('text/plain').send(notFoundMessage);
}

// ---------- Rotte esplicite per CSS/JS (con guard) ----------
app.get('/styles.css', (req, res) => {
  // supporta sia styles.css che style.css (se per sbaglio l'hai chiamato così)
  const candidates = ['styles.css', 'style.css'];
  for (const name of candidates) {
    const p = path.join(PUBLIC_DIR, name);
    if (fs.existsSync(p)) {
      return sendIfExists(res, p, 'text/css', 'styles.css non trovato');
    }
  }
  return res.status(404).type('text/plain').send('styles.css non trovato (cerca /public/styles.css)');
});

app.get('/app.js', (req, res) => {
  const p = path.join(PUBLIC_DIR, 'app.js');
  return sendIfExists(res, p, 'application/javascript', 'app.js non trovato (cerca /public/app.js)');
});

// ---------- env.js mai in cache ----------
app.get('/env.js', (_req, res) => {
  const supabaseUrl = process.env.SUPABASE_URL || 'https://affxryyfxbpnmdanvlod.supabase.co';
  const anonKey = process.env.SUPABASE_KEY || '';
  if (!anonKey) console.warn('⚠️  SUPABASE_KEY non impostata nei Secrets/Replit');

  res.set('Cache-Control', 'no-store');
  res.type('application/javascript').send(`
    window.__ENV__ = {
      SUPABASE_URL: ${JSON.stringify(supabaseUrl)},
      SUPABASE_ANON_KEY: ${JSON.stringify(anonKey)}
    };
  `);
});

// ---------- Health ----------
app.get('/healthz', (_req, res) => res.send('ok'));

// ---------- Fallback SPA (solo URL senza estensione) ----------
app.get('*', (req, res, next) => {
  if (req.method !== 'GET') return next();
  if (path.extname(req.path)) return next(); // lascia gestire a static le risorse con estensione
  if (!isProd) res.set('Cache-Control', 'no-store');
  res.sendFile(path.join(PUBLIC_DIR, 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server avviato su http://0.0.0.0:${PORT} (${isProd ? 'prod' : 'dev'})`);
});
