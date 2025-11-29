const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const db = require('../config/database');
const isAuthenticated = require('../middleware/auth');

router.get('/update', isAuthenticated, (req, res) => {
  const error = req.flash ? req.flash('error') : null;
  res.render('pages/update', { user: req.session.user, error });
});

router.post('/update', isAuthenticated, async (req, res) => {
  try {
    const { currentPassword } = req.body;
    const sessionUser = req.session.user;
    if (!sessionUser || !sessionUser.id) {
      req.flash && req.flash('error', 'Not authenticated');
      return res.redirect('/login');
    }

    const dbUser = await db.oneOrNone(
      'SELECT user_id, password, username, email FROM users WHERE user_id = $1',
      [sessionUser.id]
    );

    if (!dbUser) {
      req.flash && req.flash('error', 'User not found');
      return res.redirect('/login');
    }

    const valid = await bcrypt.compare(currentPassword, dbUser.password);
    if (!valid) {
      req.flash && req.flash('error', 'Incorrect password.');
      return res.redirect('/update');
    }

    const userForForm = { id: dbUser.user_id, username: dbUser.username, email: dbUser.email };
    return res.render('pages/update_account_form', { user: userForForm });
  } catch (err) {
    console.error('Error in /update:', err);
    req.flash && req.flash('error', 'An error occurred. Try again.');
    return res.redirect('/update');
  }
});

router.post('/update_account_form', isAuthenticated, async (req, res) => {
  try {
    const userId = req.session.user && req.session.user.id;
    if (!userId) {
      req.flash && req.flash('error', 'Not authenticated');
      return res.redirect('/login');
    }

    const { username, email, password } = req.body;

    const setParts = [];
    const params = [];
    let idx = 1;

    if (typeof username === 'string' && username.trim().length > 0) {
      setParts.push(`username = $${idx++}`);
      params.push(username.trim());
    }
    if (typeof email === 'string' && email.trim().length > 0) {
      setParts.push(`email = $${idx++}`);
      params.push(email.trim());
    }
    if (password && password.trim().length > 0) {
      const hashed = await bcrypt.hash(password, 10);
      setParts.push(`password = $${idx++}`);
      params.push(hashed);
    }

    if (setParts.length === 0) {
      req.flash && req.flash('error', 'No fields to update');
      return res.redirect('/account');
    }

    const whereIndex = idx;
    const sql = `UPDATE users SET ${setParts.join(', ')} WHERE user_id = $${whereIndex}`;
    params.push(userId);

    await db.none(sql, params);

    req.session.user.username = username || req.session.user.username;
    req.session.user.email = email || req.session.user.email;

    req.flash && req.flash('success', 'Account updated successfully!');
    return res.redirect('/account');
  } catch (err) {
    console.error('Error updating account:', err);
    req.flash && req.flash('error', 'Could not update account. Try again.');
    return res.redirect('/account');
  }
});

router.get('/register', (req, res) => {
  const message = req.session.message;
  const error = req.session.error;
  delete req.session.message;
  delete req.session.error;
  res.render('pages/register', { message, error, user: req.session.user});
});

router.get('/login', (req, res) => {
  const message = req.query.message || req.session.message;
  const error = (req.query.error !== undefined)
    ? (req.query.error === 'true' || req.query.error === '1')
    : req.session.error;
  delete req.session.message;
  delete req.session.error;
  res.render('pages/login', { message, error, user: req.session.user});
});

router.post('/register', async (req, res) => {
  try {
    const hashRounds = process.env.RUN_TESTS ==='true' ? 2 : 10;
    const hashedPassword = await bcrypt.hash(req.body.password, hashRounds); 
    await db.none('INSERT INTO users (username, email, password) VALUES ($1, $2, $3)', [req.body.username, req.body.email, hashedPassword]);
    req.session.message = 'Registration successful! Please log in.';
    req.session.error = false;
    return res.redirect('/login');
  } catch (err) {
    console.error(err);
    if (err.code === '23505') {
      req.session.message = 'Username or email already exists.';
      req.session.error = true;
      return res.redirect('/register');
    } else {
      req.session.message = 'Error registering user.';
      req.session.error = true;
      return res.redirect('/register');
    }
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
    const findUserQuery = `SELECT user_id AS id, username, email, password FROM users WHERE username = $1`;
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

    req.session.user = { id: user.id, username: user.username, email: user.email };
    console.log('Setting session user:', req.session.user);
    req.session.save((err) => {
      console.log('Session save callback, err:', err);
      if (err) {
        console.error('Session save error:', err);
      }
      return res.redirect('/home');
    });
  } catch (err) {
    console.log('Login error:', err);
    req.session.message = 'An error occurred during login. Please try again.';
    req.session.error = true;
    return res.redirect('/login');
  }
});

// Protected home route. Comment this out if you want to test without login
 router.get('/home', isAuthenticated, (req, res) => {
  res.render('pages/home', { 
    username: req.session.user ? req.session.user.username : null,
    googleApiKey: process.env.API_KEY,
    user: req.session.user
   });
}); 

router.get('/logout', (req, res) => {
  const msg = 'Logged out successfully';
  req.session.destroy((err) => {
    if (err) {
      console.error('Session destroy error:', err);
      res.clearCookie('connect.sid');
      return res.redirect('/home');
    }
    res.clearCookie('connect.sid');
    return res.redirect(`/login?message=${encodeURIComponent(msg)}&error=false`);
  });
});

module.exports = router;
