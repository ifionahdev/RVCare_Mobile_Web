export const errorHandler = (error, req, res, next) => {
  if (res.headersSent) {
    return next(error);
  }

  console.error(
    `[http] ${req.requestId ?? "unknown"} ${req.method} ${req.originalUrl} failed:`,
    error
  );

  if (error.message === "CORS origin not allowed") {
    return res.status(403).json({
      message: "Origin not allowed.",
    });
  }

  if (error instanceof SyntaxError && "body" in error) {
    return res.status(400).json({
      message: "Invalid JSON request.",
    });
  }

  return res.status(500).json({
    message: "An unexpected server error occurred.",
  });
};
