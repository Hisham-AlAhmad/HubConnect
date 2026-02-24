import 'dotenv/config';

const config = {
    port: process.env.PORT || 5000,
    databaseUrl: process.env.DATABASE_URL,
    nodeEnv: process.env.NODE_ENV || 'development',
    corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:5173',
};

export default config;
