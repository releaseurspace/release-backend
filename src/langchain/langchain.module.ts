import { Module } from '@nestjs/common';
import { LangchainService } from './langchain.service';
import { LangchainController } from './langchain.controller';
import { PropertyModule } from 'src/property/property.module';
import { PineconeService } from 'src/common/services/pinecone.service';
import { LangGraphApp } from './langgraph.app';

@Module({
  imports: [PropertyModule],
  providers: [LangchainService, LangGraphApp, PineconeService],
  controllers: [LangchainController],
})
export class LangchainModule {}
