try {
  const app = require('../dist/app').default;
  module.exports = (req, res) => {
    res.status(200).json({
      success: true,
      appLoaded: true,
      appType: typeof app,
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
