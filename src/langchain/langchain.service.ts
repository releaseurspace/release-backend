import { Injectable } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { createLangGraphWorkflow } from 'src/common/langgraph.workflow';
import { ChatConfig } from 'src/common/types/chat-config.interface';
import { ChatInputDto } from './dtos/chat-input.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PropertyEntity } from 'src/entities/property.entity';
import { ChatResponseDto } from './dtos/char-response.dto';
import { GetPropertyDto } from './dtos/get-property.dto';

@Injectable()
export class LangchainService {
  private readonly langGraphApp;
  private readonly userSessions: Map<string, string>;

  constructor(
    @InjectRepository(PropertyEntity)
    private readonly propertyRepository: Repository<PropertyEntity>,
  ) {
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
    const llmReponse = await this.langGraphApp.invoke(input, config);
    if (llmReponse.vectors && llmReponse.route === 'SEARCH') {
      const propertyIds = llmReponse.vectors.map((vector) => {
        return vector.metadata.psql_id;
      });
      const properties = await this.getProperties(propertyIds);
      return new ChatResponseDto(llmReponse.currentResponse, properties);
    } else {
      return new ChatResponseDto(llmReponse.currentResponse, []);
    }
  }

  async getProperties(ids: number[]): Promise<GetPropertyDto[]> {
    if (ids.length === 0) return [];
    return await Promise.all(
      ids.map(async (id) => {
        const property = await this.propertyRepository.findOne({
          where: { id },
        });
        return new GetPropertyDto(property);
      }),
    );
  }
}
