// Middleware to protect routes - check if admin is logged in
const isAdmin = (req, res, next) => {
  if (req.session && req.session.adminId) {
    return next();
  }
  req.flash('error', 'Please login to access the admin panel');
  res.redirect('/admin/login');
};

// Middleware to redirect already logged-in users away from login page
const redirectIfLoggedIn = (req, res, next) => {
  if (req.session && req.session.adminId) {
    return res.redirect('/admin/dashboard');
  }
  next();
};

// Middleware to protect tailor routes - check if tailor is logged in
const isTailor = (req, res, next) => {
  if (req.session && req.session.tailorId) {
    return next();
  }
  req.flash('error', 'Please login to access tailor panel');
  res.redirect('/tailor/login');
};

// Middleware to redirect already logged-in tailors away from login page
const redirectTailorIfLoggedIn = (req, res, next) => {
  if (req.session && req.session.tailorId) {
    return res.redirect('/tailor/dashboard');
  }
  next();
};

// Middleware to protect cutting master routes - check if cutting master is logged in
const isCuttingMaster = (req, res, next) => {
  if (req.session && req.session.cuttingMasterId) {
    return next();
  }
  req.flash('error', 'Please login to access cutting master panel');
  res.redirect('/cutting-master/login');
};

// Middleware to redirect already logged-in cutting masters away from login page
const redirectCMIfLoggedIn = (req, res, next) => {
  if (req.session && req.session.cuttingMasterId) {
    return res.redirect('/cutting-master/dashboard');
  }
  next();
};

module.exports = { isAdmin, redirectIfLoggedIn, isTailor, redirectTailorIfLoggedIn, isCuttingMaster, redirectCMIfLoggedIn };
