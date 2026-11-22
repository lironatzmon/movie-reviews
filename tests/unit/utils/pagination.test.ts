import { pageMeta, skipFor } from '../../../src/utils/pagination';

describe('pagination utils', () => {
  it('calculates how many documents to skip', () => {
    expect(skipFor({ page: 1, limit: 10 })).toBe(0);
    expect(skipFor({ page: 3, limit: 10 })).toBe(20);
  });

  it('builds the pagination meta object', () => {
    expect(pageMeta({ page: 2, limit: 5 }, 12)).toEqual({ page: 2, limit: 5, total: 12 });
  });
});
