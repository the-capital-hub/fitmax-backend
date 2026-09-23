const errorHandler = (
  error,
  req,
  res,
  next
) => {
  console.error(
    "Server Error:",
    error.message
  );

  const statusCode =
    res.statusCode !== 200
      ? res.statusCode
      : 500;

  return res.status(statusCode).json({
    success: false,
    message:
      error.message ||
      "Internal server error",
  });
};

module.exports = errorHandler;