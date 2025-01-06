import { AIMessageChunk } from '@langchain/core/messages';
import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { createLangGraphWorkflow } from 'src/common/langgraph.workflow';
import { ChatConfig } from 'src/common/types/chat-config.interface';
import { ChatInputDto } from './dtos/chat-input.dto';

@Injectable()
export class LangchainService {
  private readonly langGraphApp;
  private readonly userSessions: Map<string, string>;

  constructor() {
    const apiKey = process.env.OPEN_API_KEY;
    if (!apiKey) {
      throw new InternalServerErrorException('OPENAI_API_KEY is not defined');
    }
    this.langGraphApp = createLangGraphWorkflow(apiKey);
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
    const config: ChatConfig = {
      configurable: {
        thread_id: threadId,
      },
    };

    return await this.langGraphApp.invoke({ messages: input }, config);
  }
}
