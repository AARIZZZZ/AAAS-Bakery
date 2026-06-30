// routes/gallery.js
const router      = require('express').Router();
const multer      = require('multer');
const sharp       = require('sharp');
const path        = require('path');
const fs          = require('fs');
const { v4: uuid } = require('uuid');
const db          = require('../db');
const requireAuth = require('../middleware/auth');

// ── Multer: store in memory, then sharp processes it ──────────
const upload = multer({
  storage: multer.memoryStorage(),
  limits:  { fileSize: (parseInt(process.env.MAX_FILE_SIZE_MB) || 10) * 1024 * 1024 },
  fileFilter: (_, file, cb) => {
    const ok = /^image\/(jpeg|png|webp|gif)$/.test(file.mimetype);
    cb(ok ? null : new Error('Only JPEG, PNG, WebP, GIF allowed'), ok);
  }
});

const UPLOAD_DIR = process.env.UPLOAD_DIR || './uploads';
fs.mkdirSync(UPLOAD_DIR, { recursive: true });

// ── GET /api/gallery  — public ────────────────────────────────
router.get('/', async (req, res) => {
  try {
    const { category, limit = 50, offset = 0, all } = req.query;
    let sql    = 'SELECT * FROM gallery';
    const vals = [];
    const conds = [];

    if (!all) conds.push('visible = 1');
    if (category && category !== 'all') {
      conds.push('category = ?');
      vals.push(category);
    }
    if (conds.length) sql += ' WHERE ' + conds.join(' AND ');
    sql += ' ORDER BY sort_order, id';
    sql += ' LIMIT ? OFFSET ?';
    vals.push(parseInt(limit), parseInt(offset));

    const [rows]  = await db.query(sql, vals);
    const [[{total}]] = await db.query(
      `SELECT COUNT(*) as total FROM gallery ${conds.length ? 'WHERE ' + conds.join(' AND ') : ''}`,
      vals.slice(0, -2)
    );
    res.json({ items: rows, total, limit: parseInt(limit), offset: parseInt(offset) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// ── POST /api/gallery  — admin, with optional file upload ─────
router.post('/', requireAuth, upload.single('image'), async (req, res) => {
  try {
    let filename = req.body.filename || '';   // direct URL or existing filename

    // If a file was uploaded, process + save it
    if (req.file) {
      const outName = uuid() + '.webp';
      const outPath = path.join(UPLOAD_DIR, outName);
      await sharp(req.file.buffer)
        .resize({ width: 1200, withoutEnlargement: true })
        .webp({ quality: 85 })
        .toFile(outPath);
      filename = outName;
    }

    if (!filename) return res.status(400).json({ error: 'Provide a file upload or filename/URL' });

    const {
      label      = 'Untitled',
      category   = 'birthday',
      span_class = 'g1',
      sort_order = 0,
      visible    = 1
    } = req.body;

    const [result] = await db.query(
      'INSERT INTO gallery (filename, label, category, span_class, sort_order, visible) VALUES (?, ?, ?, ?, ?, ?)',
      [filename, label, category, span_class, sort_order, visible ? 1 : 0]
    );
    const [rows] = await db.query('SELECT * FROM gallery WHERE id = ?', [result.insertId]);
    res.status(201).json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message || 'Server error' });
  }
});

// ── PATCH /api/gallery/:id  — admin ──────────────────────────
router.patch('/:id', requireAuth, upload.single('image'), async (req, res) => {
  try {
    const fields = [];
    const vals   = [];

    if (req.file) {
      const outName = uuid() + '.webp';
      await sharp(req.file.buffer)
        .resize({ width: 1200, withoutEnlargement: true })
        .webp({ quality: 85 })
        .toFile(path.join(UPLOAD_DIR, outName));
      fields.push('filename = ?'); vals.push(outName);
    } else if (req.body.filename !== undefined) {
      fields.push('filename = ?'); vals.push(req.body.filename);
    }

    const simple = ['label','category','span_class','sort_order','visible'];
    simple.forEach(k => {
      if (req.body[k] !== undefined) { fields.push(`${k} = ?`); vals.push(req.body[k]); }
    });

    if (!fields.length) return res.status(400).json({ error: 'Nothing to update' });
    vals.push(req.params.id);
    await db.query(`UPDATE gallery SET ${fields.join(', ')} WHERE id = ?`, vals);
    const [rows] = await db.query('SELECT * FROM gallery WHERE id = ?', [req.params.id]);
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// ── DELETE /api/gallery/:id  — admin ─────────────────────────
router.delete('/:id', requireAuth, async (req, res) => {
  try {
    const [rows] = await db.query('SELECT filename FROM gallery WHERE id = ?', [req.params.id]);
    if (!rows.length) return res.status(404).json({ error: 'Not found' });

    // Remove local file if it's not an external URL
    const { filename } = rows[0];
    if (filename && !filename.startsWith('http')) {
      const fp = path.join(UPLOAD_DIR, filename);
      if (fs.existsSync(fp)) fs.unlinkSync(fp);
    }

    await db.query('DELETE FROM gallery WHERE id = ?', [req.params.id]);
    res.json({ message: 'Deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// ── POST /api/gallery/reorder  — admin ───────────────────────
router.post('/reorder', requireAuth, async (req, res) => {
  try {
    const { items } = req.body;
    if (!Array.isArray(items)) return res.status(400).json({ error: 'items array required' });
    await Promise.all(items.map(i =>
      db.query('UPDATE gallery SET sort_order = ? WHERE id = ?', [i.sort_order, i.id])
    ));
    res.json({ message: 'Reordered' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
