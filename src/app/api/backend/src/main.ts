// import { NestFactory } from '@nestjs/core';
// import { AppModule } from './app.module';

// async function bootstrap() {
//   const app = await NestFactory.create(AppModule);
//   app.enableCors({
//     origin: 'http://localhost:3000', // Allow requests from this origin
//     methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
//     credentials: true, // Allow credentials such as cookies, authorization headers, etc.
//   });
//   const port = process.env.PORT || 3002;
//   await app.listen(port);
//   console.log(`Application is running on: ${await app.getUrl()}`);
// }
// bootstrap();


import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
// import cluster from 'node:cluster';
import * as os from 'os';

const numCPUs = os.cpus().length;
const cluster = require('cluster');

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors({
    origin: 'http://localhost:3000', // Allow requests from this origin
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true, // Allow credentials such as cookies, authorization headers, etc.
  });
  const port = process.env.PORT || 3002;
  await app.listen(port);
  console.log(`Application is running on: ${await app.getUrl()}`);
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
}
