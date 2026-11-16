export function handleError(error, req, res, next) {
  if (res.headersSent) return next(error);
  if (error.status === 400 || error.status === 413) {
    return res.status(error.status).json({ code: 'retry' });
  }
  console.error(error.message, error.cause?.message ?? '');
  res.status(error.status || 500).json({ code: error.code === 'chatUnavailable' ? error.code : 'retry' });
}
