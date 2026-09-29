const authorizeRoles = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user || !req.user.role) {
      return res.status(401).json({
        success: false,
        message: "User authentication data not found",
      });
    }

    const userRole = req.user.role;

    // Existing "member" users are treated as patients
    const normalizedRole =
      userRole === "member"
        ? "patient"
        : userRole;

    if (!allowedRoles.includes(normalizedRole)) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to access this resource",
      });
    }

    // Keep the normalized role available to controllers
    req.user.role = normalizedRole;

    next();
  };
};

module.exports = authorizeRoles;