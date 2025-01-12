import { Module } from '@nestjs/common';
import { LangchainService } from './langchain.service';
import { LangchainController } from './langchain.controller';
import { PineconeService } from 'src/common/services/pinecone.service';

@Module({
  providers: [LangchainService, PineconeService],
  controllers: [LangchainController],
})
export class LangchainModule {}
