import { Injectable } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import {
  createLangGraphWorkflow,
  formatTimestamp,
  LangGraphWorkflow,
} from 'src/common/langgraph.workflow';
import { ChatConfig } from 'src/common/types/chat-config.interface';
import { ChatInputDto } from './dtos/chat-input.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PropertyEntity } from 'src/entities/property.entity';
import { PropertyService } from 'src/property/property.service';
import { ChatResponseDto } from './dtos/chat-response.dto';
import { Observable } from 'rxjs';

@Injectable()
export class LangchainService {
  private readonly langGraphApp: LangGraphWorkflow;
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


  chatStreaming(body: ChatInputDto): Observable<string> {
    const { userId, content } = body;
    const threadId = this.getOrCreateThreadId(userId);

    const input = {
      messages: {
        role: 'user',
        content,
      },
    };

    return new Observable((subscriber) => {
      (async () => {
        const stream = this.langGraphApp.streamEvents(input, {
          version: 'v2',
          configurable: { thread_id: threadId },
        });
        for await (const { event, tags, data } of stream) {
          if (event === 'on_chat_model_stream' && tags.includes('final_node')) {
            if (data.chunk.content) {
              console.log(`토큰 보내기:` + data.chunk.content);
              subscriber.next(data.chunk.content);
            }
          }
        }
        const state = await this.langGraphApp.getState({
          configurable: { thread_id: threadId },
        });
        console.log(state);
        if (state.values.vectors || state.values.route == 'SEARCH') {
          const propertyIds = state.values.vectors.map((vector) => {
            return vector.metadata.psql_id;
          });
          const properties = await this.getProperties(propertyIds);
          subscriber.next('Property');
          subscriber.next(JSON.stringify({ properties: properties }));
        }
        subscriber.complete();
      })().catch((err) => {
        subscriber.error(err);
      });
    });
  }
}
