const express = require('express');
const router = express.Router();

router.get('/', (req, res) => res.redirect('/home'));

router.get('/home', (req, res) => {
  const message = req.session.message;
  const error = req.session.error;
  delete req.session.message;
  delete req.session.error;
  res.render('pages/home', { 
    googleApiKey: process.env.API_KEY,
    message,
    error,
    user: req.session.user
  });
});

router.get('/account', (req, res) => {
  res.render('pages/account', { user: req.session.user });
});

module.exports = router;