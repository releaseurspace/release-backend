import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { LangchainModule } from './langchain/langchain.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import * as path from 'path';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get('DB_HOST'),
        port: configService.get('DB_PORT'),
        database: configService.get('DB_DATABASE'),
        username: configService.get('DB_USERNAME'),
        password: configService.get('DB_PASSWORD'),
        entities: [path.join(__dirname, '/entities/**/*.entity.{js, ts}')],
        synchronize: true,
        logging: true,
        timezone: 'Asia/Seoul',
      }),
    }),
    LangchainModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
