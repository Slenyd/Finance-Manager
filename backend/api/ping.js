module.exports = (req, res) => {
  res.json({ pong: true, path: req.url });
};
