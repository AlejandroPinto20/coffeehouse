function unavailable(status, cause) {
  return Object.assign(new Error('Fallo de Ollama', { cause }), { status, code: 'chatUnavailable' });
}

function words(text) {
  return text.toLowerCase().normalize('NFD').replace(/\p{M}/gu, '').match(/[a-z0-9]+/g) ?? [];
}

function spellingDistance(a, b) {
  let previous = Array.from({ length: b.length + 1 }, (_, index) => index);
  for (let i = 1; i <= a.length; i++) {
    const current = [i];
    for (let j = 1; j <= b.length; j++) {
      current[j] = Math.min(previous[j] + 1, current[j - 1] + 1,
        previous[j - 1] + Number(a[i - 1] !== b[j - 1]));
    }
    previous = current;
  }
  return previous[b.length];
}

function catalogPrices(site, history) {
  const question = words(history.at(-1).content);
  const priceQuestion = /\b(precio[s]?|cost[oa]|cuesta[n]?|vale[n]?|cuanto sale[n]?)\b/.test(question.join(' '));
  const ignored = new Set(['el', 'la', 'los', 'las', 'un', 'una', 'de', 'del', 'con']);
  const productWords = text => words(text).filter(word => !ignored.has(word));
  const requested = question.filter(word => !ignored.has(word));
  const matches = site.products.filter(product => {
    const name = productWords(product.name);
    return name.length > 0 && (priceQuestion || name.length === requested.length) &&
      name.every(word => requested.some(candidate => candidate === word ||
        (word.length >= 7 && candidate.length >= 6 && word.slice(0, 3) === candidate.slice(0, 3) &&
          spellingDistance(word, candidate) <= (word.length >= 9 ? 3 : 2))));
  });
  if (!matches.length && !priceQuestion) return null;

  const format = new Intl.NumberFormat('es-BO', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const currency = site.texts.currencySymbol?.trim() || site.texts.currency;
  const products = matches.length ? matches : site.products;
  return products.map(product => `${product.name} — ${currency} ${format.format(Number(product.price))}`).join('\n') || null;
}

export async function askOllama(site, history) {
  const prices = catalogPrices(site, history);
  if (prices) return prices;

  const { profile, texts, services, categories, products } = site;
  const { name, address, phone, hours, story, demo_notice } = profile;
  const catalog = {
    cafetería: { name, address, phone, hours, story, demo_notice },
    moneda: texts.currency,
    services: services.map(({ name, description }) => ({ name, description })),
    menu: products.map(({ name, description, price, category_id }) => ({
      name, description, price, category: categories.find(item => item.id === category_id)?.name
    }))
  };
  try {
    const response = await fetch(new URL('/api/chat', process.env.OLLAMA_URL || 'http://127.0.0.1:11434'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: AbortSignal.timeout(120_000),
      body: JSON.stringify({
        model: process.env.OLLAMA_MODEL || 'gemma3:1b',
        stream: false,
        options: { num_predict: 220, temperature: 0.2 },
        messages: [{ role: 'system', content: texts.chatPrompt + '\n' + JSON.stringify(catalog) }, ...history]
      })
    });
    if (!response.ok) throw new Error('Ollama HTTP ' + response.status);
    const body = await response.json();
    const answer = body.message?.content;
    if (typeof answer !== 'string' || !answer.trim()) throw new Error('Respuesta vacía');
    return answer.trim().slice(0, 2000);
  } catch (error) {
    throw unavailable(error.name === 'TimeoutError' ? 504 : 502, error);
  }
}
