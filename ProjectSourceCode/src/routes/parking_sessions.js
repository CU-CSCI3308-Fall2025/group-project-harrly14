const express = require('express');
const router = express.Router();
const db = require('../config/database');
const isAuthenticated = require('../middleware/auth');

router.post('/start', isAuthenticated, async (req, res) => {
  try {
    const { lotId } = req.body;
    const userId = req.session.user.id;

    // Get the lot details
    const lot = await db.oneOrNone(
      'SELECT capacity, current_occupancy FROM parking_lots WHERE lot_id = $1',
      [lotId]
    );

    if (!lot) {
      return res.status(404).json({ error: 'Parking lot not found' });
    }

    if (lot.current_occupancy >= lot.capacity) {
      return res.status(400).json({ error: 'Parking lot is full' });
    }

    // Check if user already has a session
    const user = await db.one('SELECT current_session FROM users WHERE user_id = $1', [userId]);
    if (user.current_session) {
      return res.status(400).json({ error: 'You already have an active parking session' });
    }

    // Start the session: increment occupancy and set user's session to true
    await db.tx(async t => {
      await t.none(
        'UPDATE parking_lots SET current_occupancy = current_occupancy + 1 WHERE lot_id = $1',
        [lotId]
      );

      await t.none('UPDATE users SET current_session = TRUE WHERE user_id = $1', [userId]);
    });

    res.json({ success: true, message: 'Parking session started!' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to start parking session' });
  }
});

module.exports = router;
