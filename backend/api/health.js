module.exports = (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Health check OK',
    env: process.env.NODE_ENV || 'not set',
    hasDbUrl: !!process.env.DATABASE_URL,
  });
};
