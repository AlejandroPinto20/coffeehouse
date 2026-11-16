import { db } from '../db.js';

export async function getTexts() {
  const [rows] = await db.query('SELECT text_key, text_value FROM ui_texts');
  return Object.fromEntries(rows.map(({ text_key, text_value }) => [text_key, text_value]));
}

export async function getSite() {
  const [profile, texts, sections, services, categories, products, gallery] = await Promise.all([
    db.query('SELECT * FROM site_profile WHERE id = 1').then(([rows]) => rows[0]),
    getTexts(),
    db.query('SELECT * FROM sections ORDER BY sort_order, slug').then(([rows]) => rows),
    db.query('SELECT id, icon, name, description FROM services ORDER BY sort_order, id').then(([rows]) => rows),
    db.query('SELECT id, name FROM categories ORDER BY sort_order, id').then(([rows]) => rows),
    db.query('SELECT id, category_id, name, description, price, featured, photo_url, photo_alt FROM products ORDER BY sort_order, id').then(([rows]) => rows),
    db.query('SELECT id, photo_url, photo_alt FROM gallery ORDER BY sort_order, id').then(([rows]) => rows)
  ]);
  if (!profile || !texts.chatPrompt) throw new Error('Ejecuta npm run db:init.');
  return { profile, texts, sections, services, categories, products, gallery };
}
