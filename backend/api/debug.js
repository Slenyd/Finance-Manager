module.exports = (req, res) => {
  const safeEnv = {
    NODE_ENV: process.env.NODE_ENV,
    hasDatabaseUrl: !!process.env.DATABASE_URL,
    hasJwtAccess: !!process.env.JWT_ACCESS_SECRET,
    hasJwtRefresh: !!process.env.JWT_REFRESH_SECRET,
    hasCookieSecret: !!process.env.COOKIE_SECRET,
    hasCorsOrigin: !!process.env.CORS_ORIGIN,
    allKeys: Object.keys(process.env).filter(k => !k.toLowerCase().includes('secret') && !k.toLowerCase().includes('key') && !k.toLowerCase().includes('pass') && !k.toLowerCase().includes('token')),
  };
  res.status(200).json(safeEnv);
};
