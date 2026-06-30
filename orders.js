// routes/orders.js
const router      = require('express').Router();
const db          = require('../db');
const requireAuth = require('../middleware/auth');

// ── Generate order reference ──────────────────────────────────
async function generateOrderRef() {
  const d     = new Date();
  const ymd   = `${d.getFullYear()}${String(d.getMonth()+1).padStart(2,'0')}${String(d.getDate()).padStart(2,'0')}`;
  const [[{n}]] = await db.query(
    "SELECT COUNT(*) as n FROM orders WHERE DATE(created_at) = CURDATE()"
  );
  return `ORD-${ymd}-${String(n + 1).padStart(4, '0')}`;
}

// ── POST /api/orders  — public (customer submits order form) ──
router.post('/', async (req, res) => {
  try {
    const {
      customer_name, customer_phone, customer_email,
      flavour, weight_kg, shape, tier_count,
      delivery_date, delivery_time, delivery_type,
      delivery_address, message_on_cake, special_notes, photo_ref
    } = req.body;

    if (!customer_name || !customer_phone || !flavour || !delivery_date)
      return res.status(400).json({ error: 'name, phone, flavour, delivery_date are required' });

    const order_ref = await generateOrderRef();

    const [result] = await db.query(
      `INSERT INTO orders
        (order_ref, customer_name, customer_phone, customer_email,
         flavour, weight_kg, shape, tier_count,
         delivery_date, delivery_time, delivery_type,
         delivery_address, message_on_cake, special_notes, photo_ref)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      [
        order_ref, customer_name, customer_phone, customer_email || null,
        flavour, weight_kg || null, shape || null, tier_count || 1,
        delivery_date, delivery_time || null, delivery_type || 'pickup',
        delivery_address || null, message_on_cake || null, special_notes || null, photo_ref || null
      ]
    );

    res.status(201).json({
      message: 'Order received! We\'ll confirm on WhatsApp shortly. 🎂',
      order_ref,
      order_id: result.insertId
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// ── GET /api/orders  — admin: list with filters ───────────────
router.get('/', requireAuth, async (req, res) => {
  try {
    const { status, date, search, limit = 20, offset = 0 } = req.query;
    let sql  = 'SELECT * FROM orders';
    const vals = [], conds = [];

    if (status) { conds.push('status = ?'); vals.push(status); }
    if (date)   { conds.push('delivery_date = ?'); vals.push(date); }
    if (search) {
      conds.push('(customer_name LIKE ? OR customer_phone LIKE ? OR order_ref LIKE ?)');
      const s = `%${search}%`;
      vals.push(s, s, s);
    }
    if (conds.length) sql += ' WHERE ' + conds.join(' AND ');
    sql += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    vals.push(parseInt(limit), parseInt(offset));

    const [rows]      = await db.query(sql, vals);
    const countSql    = `SELECT COUNT(*) as total FROM orders${conds.length ? ' WHERE ' + conds.join(' AND ') : ''}`;
    const [[{total}]] = await db.query(countSql, vals.slice(0, -2));
    res.json({ orders: rows, total });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// ── GET /api/orders/:id  — admin ─────────────────────────────
router.get('/:id', requireAuth, async (req, res) => {
  try {
    const [orders]   = await db.query('SELECT * FROM orders WHERE id = ?', [req.params.id]);
    if (!orders.length) return res.status(404).json({ error: 'Not found' });
    const [payments] = await db.query('SELECT * FROM payments WHERE order_id = ?', [req.params.id]);
    res.json({ ...orders[0], payments });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// ── PATCH /api/orders/:id  — admin: update status/quote/notes ─
router.patch('/:id', requireAuth, async (req, res) => {
  try {
    const allowed = ['status','quoted_price','advance_paid','internal_notes',
                     'razorpay_payment_id','razorpay_order_id','payment_status'];
    const fields = [], vals = [];
    allowed.forEach(k => {
      if (req.body[k] !== undefined) { fields.push(`${k} = ?`); vals.push(req.body[k]); }
    });
    if (!fields.length) return res.status(400).json({ error: 'Nothing to update' });

    vals.push(req.params.id);
    await db.query(`UPDATE orders SET ${fields.join(', ')} WHERE id = ?`, vals);
    const [rows] = await db.query('SELECT * FROM orders WHERE id = ?', [req.params.id]);
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// ── DELETE /api/orders/:id  — admin (soft: sets status=cancelled) ─
router.delete('/:id', requireAuth, async (req, res) => {
  try {
    const [result] = await db.query(
      "UPDATE orders SET status = 'cancelled' WHERE id = ?", [req.params.id]
    );
    if (!result.affectedRows) return res.status(404).json({ error: 'Not found' });
    res.json({ message: 'Order cancelled' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// ── GET /api/orders/stats/summary  — admin dashboard stats ───
router.get('/stats/summary', requireAuth, async (req, res) => {
  try {
    const [[totals]] = await db.query(`
      SELECT
        COUNT(*)                                          AS total_orders,
        COUNT(CASE WHEN status='new'       THEN 1 END)   AS new_orders,
        COUNT(CASE WHEN status='baking'    THEN 1 END)   AS baking,
        COUNT(CASE WHEN status='delivered' THEN 1 END)   AS delivered,
        IFNULL(SUM(advance_paid), 0)                     AS total_revenue,
        IFNULL(SUM(CASE WHEN DATE(created_at)=CURDATE() THEN 1 END), 0) AS today
      FROM orders WHERE status != 'cancelled'
    `);
    res.json(totals);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
