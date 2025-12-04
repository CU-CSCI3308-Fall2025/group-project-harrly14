const express = require('express');
const router = express.Router();
const db = require('../config/database');
const isAuthenticated = require('../middleware/auth');

router.post('/start', isAuthenticated, async (req, res) => {
  try {
    const { lotId } = req.body;
    const userId = req.session.user.id;

    // Move everything into a single transaction with row locking
    await db.tx(async t => {
      const lot = await t.oneOrNone(
        'SELECT capacity, current_occupancy FROM parking_lots WHERE lot_id = $1 FOR UPDATE',
        [lotId]
      );

      if (!lot) {
        throw { status: 404, error: 'Parking lot not found' };
      }

      if (lot.current_occupancy >= lot.capacity) {
        throw { status: 400, error: 'Parking lot is full' };
      }

      const user = await t.one('SELECT current_session FROM users WHERE user_id = $1 FOR UPDATE', [userId]);
      if (user.current_session) {
        throw { status: 400, error: 'You already have an active parking session' };
      }

      await t.none(
        'UPDATE parking_lots SET current_occupancy = current_occupancy + 1 WHERE lot_id = $1',
        [lotId]
      );

      await t.none(
        'UPDATE users SET current_session = TRUE, current_lot = $1 WHERE user_id = $2',
        [lotId, userId]
      );
    });

    res.json({ success: true, message: 'Parking session started!' });
  } catch (err) {
    if (err.status) {
      return res.status(err.status).json({ error: err.error });
    }
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/end', isAuthenticated, async (req, res) => {
  try {
    const userId = req.session.user.id;

    const user = await db.oneOrNone(
      'SELECT current_session, current_lot FROM users WHERE user_id=$1',[userId]
    );

    if (!user || !user.current_session) {
      return res.status(400).json({ error: 'No active session' });
    }

    const newLotId = user.current_lot;

    await db.tx(async t => {
      await t.none(
        'UPDATE parking_lots SET current_occupancy = GREATEST(current_occupancy - 1, 0) WHERE lot_id=$1',
        [newLotId]
      );

      await t.none(
        'UPDATE users SET current_session = FALSE, current_lot = NULL WHERE user_id=$1',
        [userId]
      );
    });

    res.json({ message: 'Parking session ended!' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});


module.exports = router;
