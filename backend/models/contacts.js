import { db } from '../db.js';

export async function saveContact({ name, email, message }) {
  await db.execute('INSERT INTO contact_messages (name, email, message) VALUES (?, ?, ?)', [name, email, message]);
}
