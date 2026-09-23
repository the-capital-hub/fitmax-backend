const express = require("express");

const protect = require(
  "../middleware/authMiddleware"
);

const User = require(
  "../models/User"
);

const router = express.Router();

router.get(
  "/profile",
  protect,
  async (req, res) => {
    try {
      const user = await User.findById(
        req.user.userId
      ).select("-password");

      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User not found",
        });
      }

      return res.status(200).json({
        success: true,
        user: {
          id: user._id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          profession: user.profession,
          role: user.role,
          isActive: user.isActive,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
        },
      });
    } catch (error) {
      console.error(
        "Profile error:",
        error.message
      );

      return res.status(500).json({
        success: false,
        message:
          "Server error while fetching profile",
      });
    }
  }
);

module.exports = router;