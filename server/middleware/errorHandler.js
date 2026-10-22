function notFound(_request, _response, next) {
  const error = new Error('Route not found');
  error.statusCode = 404;
  next(error);
}

function errorHandler(error, _request, response, _next) {
  const statusCode = error.statusCode || error.status || 500;

  if (statusCode >= 500) {
    console.error(error);
  }

  const message =
    statusCode >= 500 && process.env.NODE_ENV === 'production'
      ? 'Internal server error'
      : error.message;

  response.status(statusCode).json({
    status: 'error',
    message,
  });
}

module.exports = { errorHandler, notFound };
