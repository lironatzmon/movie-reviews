import 'dotenv/config';
import app from './app';
import { env } from './config/env';
import { connectDB } from './config/db';

async function start(): Promise<void> {
  await connectDB(env.mongoUri);
  app.listen(env.port, () => {
    console.log(`Server running on http://localhost:${env.port}`);
    console.log(`Swagger docs on http://localhost:${env.port}/api-docs`);
  });
}

start().catch((error) => {
  console.error('Failed to start server', error);
  process.exit(1);
});
