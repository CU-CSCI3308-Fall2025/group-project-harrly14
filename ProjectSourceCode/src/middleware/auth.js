module.exports = (req, res, next) => {
  // only allow users to post if they are logged in. the below is a template from lab 7
  // if (!req.session.user) {
  //   req.session.message = 'You must login before viewing the discover page.';
  //   req.session.error = true;
  //   return req.session.save(() => res.redirect('/login'));
  // }
  next();
};