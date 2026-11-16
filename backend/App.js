import express from 'express';
import { rateLimit } from 'express-rate-limit';
import { fileURLToPath } from 'node:url';
import { site, contact, chat } from './controllers/site.js';
import { validateContact, validateChat } from './middleware/validation.js';
import { handleError } from './middleware/errors.js';

const app = express();
app.disable('x-powered-by');
app.use(express.json({ limit: '32kb' }));
app.use('/media', express.static(fileURLToPath(new URL('./public/media/', import.meta.url))));
app.use('/api', (req, res, next) => {
  res.set('Cache-Control', 'no-store');
  next();
});

const limit = (max) => rateLimit({
  windowMs: 60_000, limit: max,
  standardHeaders: 'draft-8', legacyHeaders: false, message: { code: 'rateLimit' }
});

app.get('/api/site', site);
app.post('/api/contact', limit(8), validateContact, contact);
app.post('/api/chat', limit(12), validateChat, chat);
app.use('/api', (req, res) => res.sendStatus(404));

const client = fileURLToPath(new URL('../frontend/dist/coffeehouse/browser/', import.meta.url));
app.use(express.static(client));

app.use(handleError);
app.listen(Number(process.env.PORT || 3000), process.env.HOST || '127.0.0.1', () => {
  console.log('CoffeeHouse API lista.');
});

