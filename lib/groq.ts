import Groq from 'groq-sdk';

let _groqClient: Groq | null = null;

export function getGroqClient(): Groq {
  if (!_groqClient) {
    const apiKey = process.env.GROQ_API_KEY || '';
    _groqClient = new Groq({ apiKey });
  }
  return _groqClient;
}

export const groq = new Proxy({} as Groq, {
  get(_target, prop) {
    const client = getGroqClient();
    const value = (client as unknown as Record<string | symbol, unknown>)[prop];
    if (typeof value === 'function') {
      return value.bind(client);
    }
    return value;
  },
});

