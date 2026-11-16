function text(value) {
  return typeof value === 'string' ? value.trim() : '';
}

export function validateContact(req, res, next) {
  const name = text(req.body?.name);
  const email = text(req.body?.email);
  const message = text(req.body?.message);
  if (name.length < 2 || name.length > 100 || email.length > 254 ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || message.length < 10 || message.length > 2000) {
    return res.status(400).json({ code: 'contactInvalid' });
  }
  res.locals.contact = { name, email, message };
  next();
}

export function validateChat(req, res, next) {
  const { messages } = req.body ?? {};
  if (!Array.isArray(messages) || !messages.length || messages.length > 9 ||
      messages.length % 2 === 0 || messages.some((message, index) =>
        message?.role !== (index % 2 ? 'assistant' : 'user') ||
        !text(message?.content) || text(message.content).length > (index % 2 ? 2000 : 500))) {
    return res.status(400).json({ code: 'chatInvalid' });
  }
  res.locals.messages = messages.map(({ role, content }) => ({ role, content: content.trim() }));
  next();
}
