// Middleware to attach flash messages to res.locals for all views
const flashMiddleware = (req, res, next) => {
  res.locals.success = req.flash('success');
  res.locals.error = req.flash('error');
  res.locals.user = req.session.user || null;
  res.locals.adminId = req.session.adminId || null;
  res.locals.tailorId = req.session.tailorId || null;
  res.locals.tailorName = req.session.tailorName || null;
  next();
};

module.exports = flashMiddleware;
