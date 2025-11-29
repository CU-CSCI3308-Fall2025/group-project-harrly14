// Middleware to check if user is authenticated. Comment this out if you want to test without login
function isAuthenticated(req, res, next) {
  console.log('Checking auth, session exists:', !!req.session, 'user:', req.session ? req.session.user : null);
  if (req.session && req.session.user) {
    next(); 
  } else {
    req.session.message = 'Please log in first.';
    req.session.error = true;
    res.redirect('/login');
  }
}

module.exports = isAuthenticated;