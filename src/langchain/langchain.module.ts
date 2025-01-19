import { Module } from '@nestjs/common';
import { LangchainService } from './langchain.service';
import { LangchainController } from './langchain.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PropertyEntity } from 'src/entities/property.entity';

@Module({
  imports: [TypeOrmModule.forFeature([PropertyEntity])],
  providers: [LangchainService],
  controllers: [LangchainController],
})
export class LangchainModule {}
