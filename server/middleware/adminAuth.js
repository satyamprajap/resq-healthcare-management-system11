// Admin Authentication Middleware

module.exports = function adminAuth(req, res, next) {
  // Check if user is logged in
  if (!req.session || !req.session.user) {
    return res.redirect("/admin/login");
  }

  // Check if logged-in user is admin
  if (req.session.user.role !== "admin") {
    return res.status(403).send("Access Denied: Admin Only");
  }

  // Allow admin to access the route
  next();
};
