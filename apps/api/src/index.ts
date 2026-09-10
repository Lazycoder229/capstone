import app from '@/app';
import { AppDataSource } from '@/config/data-source';
import { env } from '@/config/env';

AppDataSource.initialize()
  .then(async () => {
    console.log('✅ Database connected');
    await AppDataSource.runMigrations();
    console.log('✅ Migrations applied');

    app.listen(env.PORT, () => {
      console.log(`🚀 API running on port ${env.PORT} [${env.NODE_ENV}]`);
    });
  })
  .catch((err) => {
    console.error('❌ DB connection/migration error:', err);
    process.exit(1);
  });