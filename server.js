const express = require("express");
const cors = require("cors");
require("dotenv").config();

const connectDB = require("./config/db");

const authRoutes = require("./routes/authRoutes");
const userRoutes = require(
  "./routes/userRoutes"
);
const errorHandler = require(
  "./middleware/errorMiddleware"
);
const app = express();

const PORT = process.env.PORT || 5000;

connectDB();

app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  })
);

app.use(express.json());

app.use("/api/auth", authRoutes);
app.use(
  "/api/users",
  userRoutes
);
app.use(errorHandler);
app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "FitMax API is running",
  });
});

app.listen(PORT, () => {
  console.log(
    `FitMax backend server running on port ${PORT}`
  );
});