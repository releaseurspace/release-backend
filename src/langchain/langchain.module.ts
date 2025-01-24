import { Module } from '@nestjs/common';
import { LangchainService } from './langchain.service';
import { LangchainController } from './langchain.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PropertyEntity } from 'src/entities/property.entity';
import { PropertyModule } from 'src/property/property.module';

@Module({
  imports: [PropertyModule],
  providers: [LangchainService],
  controllers: [LangchainController],
})
export class LangchainModule {}
