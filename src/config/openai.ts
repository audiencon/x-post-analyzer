export const DEFAULT_MODEL = 'gpt-4o-mini';
export const DEFAULT_API_KEY = process.env.OPENAI_API_KEY || '';

export const AVAILABLE_MODELS = [
  { id: 'gpt-4o', name: 'GPT-4o' },
  { id: 'gpt-4', name: 'GPT-4' },
  { id: 'gpt-4o-mini', name: 'GPT-4o Mini' },
  { id: 'gpt-4-turbo-2024-04-09', name: 'GPT-4 Turbo' },
  { id: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo' },
  { id: 'gpt-3.5-turbo-16k', name: 'GPT-3.5 Turbo 16K' },
  { id: 'gpt-3.5-turbo-0125', name: 'GPT-3.5 Turbo 0125' },
];
