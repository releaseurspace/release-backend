import { Injectable } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { createLangGraphWorkflow } from 'src/common/langgraph.workflow';
import { ChatConfig } from 'src/common/types/chat-config.interface';
import { ChatInputDto } from './dtos/chat-input.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PropertyEntity } from 'src/entities/property.entity';
import { PropertyService } from 'src/property/property.service';
import { ChatResponseDto } from './dtos/chat-response.dto';

@Injectable()
export class LangchainService {
  private readonly langGraphApp;
  private readonly userSessions: Map<string, string>;

  constructor(private readonly propertyService: PropertyService) {
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

  async chat(body: ChatInputDto): Promise<ChatResponseDto> {
    const { userId, content } = body;
    const threadId = this.getOrCreateThreadId(userId);
    const config: ChatConfig = {
      configurable: {
        thread_id: threadId,
      },
    };
    const input = {
      messages: {
        role: 'user',
        content,
      },
    };
    try {
      const llmReponse = await this.langGraphApp.invoke(input, config);
      if (llmReponse.vectors && llmReponse.route === 'SEARCH') {
        const propertyIds = llmReponse.vectors.map((vector) => {
          return vector.metadata.psql_id;
        });
        const properties =
          await this.propertyService.getProperties(propertyIds);
        return new ChatResponseDto(llmReponse.currentResponse, properties);
      } else {
        return new ChatResponseDto(llmReponse.currentResponse, []);
      }
    } catch (error) {
      return new ChatResponseDto(
        '죄송해요. 일시적인 오류로 응답을 생성하는데에 실패했어요.😢',
        [],
      );
    }
  }
}
