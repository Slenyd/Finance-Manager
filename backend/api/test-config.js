try {
  const config = require('../dist/config').config;
  module.exports = (req, res) => {
    res.status(200).json({
      success: true,
      env: process.env.NODE_ENV,
      configLoaded: true,
    });
  };
} catch (err) {
  module.exports = (req, res) => {
    res.status(500).json({
      success: false,
      error: err.message,
      stack: err.stack,
    });
  };
}
