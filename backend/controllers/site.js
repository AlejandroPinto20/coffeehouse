import { getSite } from '../models/site.js';
import { saveContact } from '../models/contacts.js';
import { askOllama } from '../chatbot/ollama.js';

export async function site(req, res) {
  const data = await getSite();
  const { chatPrompt, ...publicTexts } = data.texts;
  res.json({ ...data, texts: publicTexts });
}

export async function contact(req, res) {
  await saveContact(res.locals.contact);
  res.status(201).json({ code: 'contactSuccess' });
}

export async function chat(req, res) {
  const reply = await askOllama(await getSite(), res.locals.messages);
  res.json({ reply });
}
