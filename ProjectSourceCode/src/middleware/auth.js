// Middleware to check if user is authenticated. Comment this out if you want to test without login
function isAuthenticated(req, res, next) {
  if (req.session && req.session.user) {
    next(); 
  } else {
    req.session.message = 'Please log in first.';
    req.session.error = true;
    res.redirect('/login');
  }
}

module.exports = isAuthenticated;