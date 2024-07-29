import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as cookieParser from 'cookie-parser';
import * as os from 'os';
const numCPUs = os.cpus().length;
const cluster = require('cluster');

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { abortOnError: false });
  app.enableCors({
    origin: true,
    methods: ["GET", "POST", "DELETE"],
    credentials: true,
  });
  app.use(cookieParser());
  await app.listen(5001);
}
if (cluster.isPrimary) {
  console.log(`Primary server started on PID ${process.pid}`);
  // Fork workers
  for (let i = 0; i < numCPUs; i++) {
    cluster.fork();
  }

  cluster.on('exit', (worker, code, signal) => {
    console.warn(`Worker ${worker.process.pid} died with code: ${code}, signal: ${signal}`);
    console.log('Starting a new worker');
    cluster.fork();
  });
} else {
  bootstrap();
};