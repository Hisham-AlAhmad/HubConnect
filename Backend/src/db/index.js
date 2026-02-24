import postgres from 'postgres';
import config from '../config/index.js';

const sql = postgres(config.databaseUrl);

export default sql;
