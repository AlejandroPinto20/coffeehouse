import mysql from 'mysql2/promise';

export const dbConfig = {
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  charset: 'utf8mb4'
};

export const db = mysql.createPool({ ...dbConfig, connectionLimit: 8, queueLimit: 32 });
