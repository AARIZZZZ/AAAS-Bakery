// routes/flavours.js
const router      = require('express').Router();
const db          = require('../db');
const requireAuth = require('../middleware/auth');

// GET /api/flavours  — public (website uses this)
router.get('/', async (req, res) => {
  try {
    const showAll = req.query.all === '1'; // admin passes ?all=1
    const sql = showAll
      ? 'SELECT * FROM flavours ORDER BY sort_order, id'
      : 'SELECT id, name, emoji, sort_order FROM flavours WHERE available = 1 ORDER BY sort_order, id';
    const [rows] = await db.query(sql);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/flavours  — admin only
router.post('/', requireAuth, async (req, res) => {
  try {
    const { name, emoji = '🎂', available = 1, sort_order = 0 } = req.body;
    if (!name) return res.status(400).json({ error: 'name is required' });

    const [result] = await db.query(
      'INSERT INTO flavours (name, emoji, available, sort_order) VALUES (?, ?, ?, ?)',
      [name.trim(), emoji, available ? 1 : 0, sort_order]
    );
    const [rows] = await db.query('SELECT * FROM flavours WHERE id = ?', [result.insertId]);
    res.status(201).json(rows[0]);
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY')
      return res.status(409).json({ error: 'Flavour already exists' });
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// PATCH /api/flavours/:id  — admin only
router.patch('/:id', requireAuth, async (req, res) => {
  try {
    const { name, emoji, available, sort_order } = req.body;
    const fields = [];
    const vals   = [];
    if (name       !== undefined) { fields.push('name = ?');       vals.push(name.trim()); }
    if (emoji      !== undefined) { fields.push('emoji = ?');      vals.push(emoji); }
    if (available  !== undefined) { fields.push('available = ?');  vals.push(available ? 1 : 0); }
    if (sort_order !== undefined) { fields.push('sort_order = ?'); vals.push(sort_order); }
    if (!fields.length) return res.status(400).json({ error: 'Nothing to update' });

    vals.push(req.params.id);
    await db.query(`UPDATE flavours SET ${fields.join(', ')} WHERE id = ?`, vals);
    const [rows] = await db.query('SELECT * FROM flavours WHERE id = ?', [req.params.id]);
    if (!rows.length) return res.status(404).json({ error: 'Not found' });
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// DELETE /api/flavours/:id  — admin only
router.delete('/:id', requireAuth, async (req, res) => {
  try {
    const [result] = await db.query('DELETE FROM flavours WHERE id = ?', [req.params.id]);
    if (!result.affectedRows) return res.status(404).json({ error: 'Not found' });
    res.json({ message: 'Deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/flavours/reorder  — admin: send [{id, sort_order}, ...]
router.post('/reorder', requireAuth, async (req, res) => {
  try {
    const { items } = req.body;
    if (!Array.isArray(items)) return res.status(400).json({ error: 'items array required' });
    await Promise.all(items.map(i =>
      db.query('UPDATE flavours SET sort_order = ? WHERE id = ?', [i.sort_order, i.id])
    ));
    res.json({ message: 'Reordered' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
