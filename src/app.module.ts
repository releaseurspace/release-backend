import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
import { LangchainModule } from './langchain/langchain.module';

@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true }), LangchainModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
