const express = require('express');
const router = express.Router();
const isAuthenticated = require('../middleware/auth'); 
const db = require('../config/database');  

router.get('/', (req, res) => res.redirect('/home'));

router.get('/home', async (req, res) => {
  const message = req.session.message;
  const error = req.session.error;
  delete req.session.message;
  delete req.session.error;

  // Fetch parking lots for the dropdown
  let parkingLots = [];
  try {
    // Query for lot_id only (sorted for better UX)
    parkingLots = await db.any('SELECT lot_id FROM parking_lots ORDER BY lot_id');
  } catch (err) {
    console.error('Failed to fetch parking lots for dropdown:', err);
    // Optionally set an error message if fetch fails, but continue rendering
  }

  res.render('pages/home', { 
    googleApiKey: process.env.API_KEY,
    message,
    error,
    user: req.session.user,
    parkingLots
  });
});

router.get('/account', isAuthenticated, (req, res) => {  // this is protected
  // surface session-based messages to the account view
  const message = req.session.message;
  const error = req.session.error;
  delete req.session.message;
  delete req.session.error;

  res.render('pages/account', { user: req.session.user, message, error });
});

module.exports = router;