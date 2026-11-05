import { app } from './app';
import { config } from './config';
import { initializeDatabase, pool } from './db';

const start = async () => {
  await initializeDatabase();
  const server = app.listen(config.PORT, () => {
    console.log(`ExpenseMate backend listening on http://localhost:${config.PORT}`);
  });

  const shutdown = async () => {
    server.close();
    await pool.end();
    process.exit(0);
  };
  process.once('SIGINT', shutdown);
  process.once('SIGTERM', shutdown);
};

start().catch(async (error) => {
  console.error('Failed to start backend:', error);
  await pool.end();
  process.exit(1);
});
