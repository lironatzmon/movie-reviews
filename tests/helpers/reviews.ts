export function reviewInput(overrides: Record<string, unknown> = {}) {
  return { rating: 8, text: 'Great movie', ...overrides };
}
