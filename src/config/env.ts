const isTest = process.env.NODE_ENV === 'test';

function required(name: string, testDefault: string): string {
  const value = process.env[name] ?? (isTest ? testDefault : undefined);
  if (!value) throw new Error(`Missing environment variable: ${name}`);
  return value;
}

export const env = {
  port: Number(process.env.PORT) || 3000,
  mongoUri: required('MONGO_URI', 'mongodb://unused-in-tests'),
  jwtSecret: required('JWT_SECRET', 'test-secret'),
  jwtExpiresIn: process.env.JWT_EXPIRES_IN ?? '1d',
};
