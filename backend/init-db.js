import mysql from 'mysql2/promise';
import { readFile } from 'node:fs/promises';
import { dbConfig } from './db.js';

const connection = await mysql.createConnection({ ...dbConfig, multipleStatements: true });
try {
  for (const file of ['schema.sql', 'seed.sql']) {
    const sql = await readFile(new URL('../database/' + file, import.meta.url), 'utf8');
    await connection.query(sql);
  }
  console.log('Esquema y datos iniciales listos.');
} finally {
  await connection.end();
}
