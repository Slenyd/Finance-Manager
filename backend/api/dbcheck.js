module.exports = (req, res) => {
  const safe = (s) => s ? s.substring(0, 25) + '...' : undefined;
  res.json({
    POSTGRES_PRISMA_URL: safe(process.env.POSTGRES_PRISMA_URL),
    DATABASE_URL: safe(process.env.DATABASE_URL),
    POSTGRES_URL: safe(process.env.POSTGRES_URL),
  });
};
