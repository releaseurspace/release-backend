import { PineconeService } from './../common/services/pinecone.service';
import { AIMessageChunk } from '@langchain/core/messages';
import { Injectable } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { createLangGraphWorkflow } from 'src/common/langgraph.workflow';
import { ChatConfig } from 'src/common/types/chat-config.interface';
import { ChatInputDto } from './dtos/chat-input.dto';

@Injectable()
export class LangchainService {
  private readonly langGraphApp;
  private readonly userSessions: Map<string, string>;

  constructor(private readonly pineconeService: PineconeService) {
    this.langGraphApp = createLangGraphWorkflow();
    this.userSessions = new Map();
  }

  private getOrCreateThreadId(userId: string): string {
    let threadId = this.userSessions.get(userId);
    if (!threadId) {
      threadId = uuidv4();
      this.userSessions.set(userId, threadId);
    }
    return threadId;
  }

  async test(body: ChatInputDto): Promise<AIMessageChunk> {
    const { userId, ...input } = body;
    const threadId = this.getOrCreateThreadId(userId);
    const vectors = await this.pineconeService.getSimilarVectors(
      'seoul',
      'jongno',
      input.content,
    );
    const config: ChatConfig = {
      configurable: {
        thread_id: threadId,
      },
    };
    const input2 = {
      messages: input,
      vectors,
    };
    return await this.langGraphApp.invoke(input2, config);
  }
}
