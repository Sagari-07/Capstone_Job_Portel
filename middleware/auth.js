const wantsHTML = (req) => {
  return req.headers.accept && req.headers.accept.includes('text/html');
};

function requireAuth(req, res, next) {
  if (!req.session?.user) {
    if (wantsHTML(req)) {
      return res.redirect('/login.html');
    }
    return res.status(401).json({ message: 'Authentication required' });
  }
  return next();
}

function requireAdmin(req, res, next) {
  if (!req.session?.user) {
    if (wantsHTML(req)) {
      return res.redirect('/login.html');
    }
    return res.status(401).json({ message: 'Authentication required' });
  }

  if (req.session.user.role !== 'admin') {
    if (wantsHTML(req)) {
      return res.redirect('/index.html');
    }
    return res.status(403).json({ message: 'Admin access required' });
  }

  return next();
}

module.exports = {
  requireAuth,
  requireAdmin
};

