const errorHandler = (err, req, res, next) => {
  console.error('Global error handler caught:', err);

  // Check if the response has already been sent
  if (res.headersSent) {
    return next(err);
  }

  // Check if the request is expecting JSON
  if (req.xhr || req.path.startsWith('/api/')) {
    return res.status(500).json({
      error: 'Server error',
      message: err.message || 'An unexpected error occurred'
    });
  }

  // For regular requests, send an HTML error page
  res.status(500).send(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>Error</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 20px; }
          .error { color: red; }
          pre { background: #f5f5f5; padding: 10px; border-radius: 5px; }
        </style>
      </head>
      <body>
        <h1>Error</h1>
        <p class="error">${err.message || 'An unexpected error occurred'}</p>
        <pre>${err.stack || ''}</pre>
        <p><a href="/">Return to Home</a></p>
      </body>
    </html>
  `);
};

const userToLocals = (req, res, next) => {
  res.locals.user = req.session.user || null;
  next();
};

module.exports = {
  errorHandler,
  userToLocals
};