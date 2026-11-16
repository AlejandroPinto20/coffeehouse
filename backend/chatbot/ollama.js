function unavailable(status, cause) {
  return Object.assign(new Error('Fallo de Ollama', { cause }), { status, code: 'chatUnavailable' });
}

export async function askOllama(site, history) {
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
