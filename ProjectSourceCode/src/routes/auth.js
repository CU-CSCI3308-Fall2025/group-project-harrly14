const express = require('express');
const bcrypt = require('bcryptjs');
const db = require('../config/database');
const router = express.Router();

router.get('/', (req, res) => res.redirect('/home'));

router.get('/home', (req, res) => {
  const message = req.session.message;
  const error = req.session.error;
  delete req.session.message;
  delete req.session.error;
  res.render('pages/home', { message, error });
});

router.get('/register', (req, res) => {
  const message = req.session.message;
  const error = req.session.error;
  delete req.session.message;
  delete req.session.error;
  res.render('pages/register', { message, error });
});

router.get('/login', (req, res) => {
  const message = req.query.message || req.session.message;
  const error = (req.query.error !== undefined)
    ? (req.query.error === 'true' || req.query.error === '1')
    : req.session.error;
  delete req.session.message;
  delete req.session.error;
  res.render('pages/login', { message, error });
});

router.post('/register', async (req, res) => {
  try {
    if (!req.body.username || !req.body.password) {
      req.session.message = 'Provide a username and password.';
      req.session.error = true;
      return res.redirect('/register');
    }

    const hash = await bcrypt.hash(req.body.password, 10);
    const username = req.body.username;

    const existsQuery = `SELECT 1 FROM users WHERE username = $1 LIMIT 1`;
    const isExistingUser = await db.oneOrNone(existsQuery, [username]);
    if (isExistingUser) {
      req.session.message = 'Username taken. Try again.';
      req.session.error = true;
      return res.redirect('/register');
    }

    const query = `INSERT INTO users (username, password) VALUES ($1, $2)`;
    await db.none(query, [username, hash]);
    return res.redirect('/login');
  } catch (err) {
    console.error('Register error: ', err);
    return res.redirect('/register');
  }
});

router.post('/login', async (req, res) => {
  try {
    if (!req.body.username || !req.body.password) {
      req.session.message = 'Please provide a username and password';
      req.session.error = true;
      return res.redirect('/login');
    }

    const username = req.body.username;
    const findUserQuery = `SELECT username,password FROM users WHERE username = $1`;
    let user = await db.oneOrNone(findUserQuery, [username]);

    if (!user) {
      req.session.message = 'No username found. Please register first.';
      req.session.error = true;
      return res.redirect('/register');
    }

    const match = await bcrypt.compare(req.body.password, user.password);
    if (!match) {
      req.session.message = 'Incorrect username or password.';
      req.session.error = true;
      return res.redirect('/login');
    }

    req.session.user = user.username;
    req.session.save(() => res.redirect('/home'));
  } catch (err) {
    console.log('Login error:', err)
    req.session.message = 'An error occurred during login. Please try again.';
    req.session.error = true;
    return res.redirect('/login');
  }
});

router.get('/logout', (req, res) => {
  const msg = 'Logged out successfully';
  req.session.destroy(() => {
    return res.redirect(`/login?message=${encodeURIComponent(msg)}&error=false`);
  });
});

module.exports = router;