const express = require("express");
const cors = require("cors");
require("dotenv").config();

const connectDB = require("./config/db");

// =========================================================
// ROUTES
// =========================================================

const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const assessmentRoutes = require("./routes/assessmentRoutes");
const rehabPlanRoutes = require("./routes/rehabPlanRoutes");
const exerciseRoutes = require("./routes/exerciseRoutes");
const progressRoutes = require("./routes/progressRoutes");
const consultationRoutes = require("./routes/consultationRoutes");
const dashboardRoutes = require("./routes/dashboardRoutes");
const paymentRoutes = require("./routes/paymentRoutes");
const notificationRoutes = require("./routes/notificationRoutes");

// =========================================================
// ERROR HANDLER
// =========================================================

const errorHandler = require("./middleware/errorMiddleware");

const app = express();

const PORT = process.env.PORT || 5000;

// =========================================================
// DATABASE
// =========================================================

connectDB();

// =========================================================
// CORS
// =========================================================

app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "https://fitmax.snappytales.in",
    ],
    credentials: true,
  }),
);

// =========================================================
// BODY PARSER
// =========================================================

app.use(express.json());

// =========================================================
// AUTH ROUTES
// =========================================================

app.use(
  "/api/auth",
  authRoutes,
);

// =========================================================
// USER ROUTES
// =========================================================

app.use(
  "/api/users",
  userRoutes,
);

// =========================================================
// ASSESSMENT ROUTES
// =========================================================

app.use(
  "/api/assessments",
  assessmentRoutes,
);

// =========================================================
// REHAB PLAN ROUTES
// =========================================================

app.use(
  "/api/rehab-plans",
  rehabPlanRoutes,
);

// =========================================================
// EXERCISE ROUTES
// =========================================================

app.use(
  "/api/exercises",
  exerciseRoutes,
);

// =========================================================
// PROGRESS ROUTES
// =========================================================

app.use(
  "/api/progress",
  progressRoutes,
);

// =========================================================
// CONSULTATION ROUTES
// =========================================================

app.use(
  "/api/consultations",
  consultationRoutes,
);

// =========================================================
// DASHBOARD ROUTES
// =========================================================

app.use(
  "/api/dashboard",
  dashboardRoutes,
);

// =========================================================
// PAYMENT ROUTES
// =========================================================

app.use(
  "/api/payments",
  paymentRoutes,
);

// =========================================================
// NOTIFICATION ROUTES
// =========================================================

app.use(
  "/api/notifications",
  notificationRoutes,
);

// =========================================================
// ERROR HANDLER
// =========================================================

app.use(errorHandler);

// =========================================================
// HEALTH CHECK
// =========================================================

app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "FitMax API is running",
  });
});

// =========================================================
// START SERVER
// =========================================================

app.listen(PORT, () => {
  console.log(
    `FitMax backend server running on port ${PORT}`,
  );
});