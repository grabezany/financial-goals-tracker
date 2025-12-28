// Lightweight auth adapter for sessions or passport-style req.user
module.exports = function requireAuth(req, res, next) {
  // Passport-style
  if (req.user && (req.user._id || req.user.id)) {
    req.userId = req.user._id || req.user.id;
    return next();
  }

  // express-session style: req.session.userId or req.session.user._id
  if (req.session) {
    if (req.session.userId) {
      req.userId = req.session.userId;
      return next();
    }
    if (req.session.user && (req.session.user._id || req.session.user.id)) {
      req.userId = req.session.user._id || req.session.user.id;
      return next();
    }
  }

  // Not authenticated
  return res.status(401).json({ error: 'Authentication required' });
};
