export function movieInput(overrides: Record<string, unknown> = {}) {
  return {
    title: 'Inception',
    releaseYear: 2010,
    genres: ['Sci-Fi'],
    director: 'Christopher Nolan',
    actors: ['Leonardo DiCaprio'],
    description: 'Dreams within dreams',
    ...overrides,
  };
}
