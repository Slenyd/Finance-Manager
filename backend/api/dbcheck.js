module.exports = (req, res) => {
  const dbVars = {
    DATABASE_URL: process.env.DATABASE_URL ? process.env.DATABASE_URL.substring(0, 30) + '...' : undefined,
    POSTGRES_PRISMA_URL: process.env.POSTGRES_PRISMA_URL ? process.env.POSTGRES_PRISMA_URL.substring(0, 30) + '...' : undefined,
    POSTGRES_URL: process.env.POSTGRES_URL ? process.env.POSTGRES_URL.substring(0, 30) + '...' : undefined,
    POSTGRES_URL_NON_POOLING: process.env.POSTGRES_URL_NON_POOLING ? process.env.POSTGRES_URL_NON_POOLING.substring(0, 30) + '...' : undefined,
  };
  res.status(200).json(dbVars);
};
