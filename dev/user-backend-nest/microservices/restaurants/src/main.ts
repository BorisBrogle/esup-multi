import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { Transport, MicroserviceOptions } from '@nestjs/microservices';
import { RestaurantsModule } from './restaurants.module';

async function bootstrap() {
  const host = process.env.RESTAURANTS_SERVICE_HOST || '127.0.0.1';
  const port = parseInt(process.env.RESTAURANTS_SERVICE_PORT) || 3017;
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    RestaurantsModule,
    {
      transport: Transport.TCP,
      options: {
        host,
        port,
      },
      logger:
        process.env.EXTENDED_LOGS === 'true'
          ? ['error', 'warn', 'log', 'debug', 'verbose']
          : ['error', 'warn', 'log'],
    },
  );
  Logger.log(`Listening on host ${host}, port ${port}`);
  await app.listen();
}
bootstrap();
