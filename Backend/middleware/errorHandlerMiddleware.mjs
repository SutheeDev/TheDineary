const errorHandlerMiddleware = (err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  const msg = err.message || "Something went wrong, please try again later";

  res.status(statusCode).json({ msg });
};

export default errorHandlerMiddleware;
