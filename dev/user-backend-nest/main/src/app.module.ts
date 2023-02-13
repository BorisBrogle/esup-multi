import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ClientsModule } from '@nestjs/microservices';
import { PassportModule } from '@nestjs/passport';
import { AppController } from './app.controller';
import configuration from './config/configuration';
import microserviceAuthConfig from './config/microservice-auth.config';
import microserviceCardsConfig from './config/microservice-cards.config';
import microserviceMapConfig from './config/microservice-map.config';
import microserviceNotificationsConfig from './config/microservice-notifications.config';
import microserviceRssConfig from './config/microservice-rss.config';
import microserviceScheduleConfig from './config/microservice-schedule.config';
import microserviceInfoConfig from './config/microservice-tiles.config';
import { AuthJwtStrategy } from './security/auth-jwt.strategy';

@Module({
  imports: [
    ConfigModule.forRoot({
      load: [configuration],
    }),
    ClientsModule.registerAsync([
      {
        name: 'TILES_SERVICE',
        imports: [ConfigModule.forFeature(microserviceInfoConfig)],
        useFactory: (config: ConfigService) => config.get('microservice-tiles'),
        inject: [ConfigService],
      },
      {
        name: 'AUTH_SERVICE',
        imports: [ConfigModule.forFeature(microserviceAuthConfig)],
        useFactory: (config: ConfigService) => config.get('microservice-auth'),
        inject: [ConfigService],
      },
      {
        name: 'MAP_SERVICE',
        imports: [ConfigModule.forFeature(microserviceMapConfig)],
        useFactory: (config: ConfigService) => config.get('microservice-map'),
        inject: [ConfigService],
      },
      {
        name: 'RSS_SERVICE',
        imports: [ConfigModule.forFeature(microserviceRssConfig)],
        useFactory: (config: ConfigService) => config.get('microservice-rss'),
        inject: [ConfigService],
      },
      {
        name: 'CARDS_SERVICE',
        imports: [ConfigModule.forFeature(microserviceCardsConfig)],
        useFactory: (config: ConfigService) => config.get('microservice-cards'),
        inject: [ConfigService],
      },
      {
        name: 'SCHEDULE_SERVICE',
        imports: [ConfigModule.forFeature(microserviceScheduleConfig)],
        useFactory: (config: ConfigService) =>
          config.get('microservice-schedule'),
        inject: [ConfigService],
      },
      {
        name: 'NOTIFICATIONS_SERVICE',
        imports: [ConfigModule.forFeature(microserviceNotificationsConfig)],
        useFactory: (config: ConfigService) =>
          config.get('microservice-notifications'),
        inject: [ConfigService],
      },
    ]),
    PassportModule,
  ],
  controllers: [AppController],
  providers: [AuthJwtStrategy],
})
export class AppModule {}
