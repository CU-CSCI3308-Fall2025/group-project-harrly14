const express = require('express');
const router = express.Router();
const db = require('../config/database');
const isAuthenticated = require('../middleware/auth');

router.get('/current-session', isAuthenticated, async (req, res) => {
  try {
    // include current_lot explicitly
    const user = await db.one('SELECT current_session, current_lot FROM users WHERE user_id=$1', [req.session.user.id]);
    res.json({ current_session: user.current_session, current_lot: user.current_lot });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to get current session' });
  }
});

module.exports = router;
