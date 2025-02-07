import { Injectable } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';

import { ChatConfig } from 'src/common/types/chat-config.interface';
import { ChatInputDto } from './dtos/chat-input.dto';
import { PropertyService } from 'src/property/property.service';
import { ChatResponseDto } from './dtos/chat-response.dto';
import { Observable } from 'rxjs';
import { LangGraphApp } from './langgraph.app';

@Injectable()
export class LangchainService {
  private readonly userSessions: Map<string, string>;

  constructor(
    private readonly propertyService: PropertyService,
    private readonly langGraphApp: LangGraphApp,
  ) {
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
      const llmResponse = await this.langGraphApp.workflow.invoke(
        input,
        config,
      );

      console.log('라우트 : ', llmResponse.route);
      console.log('namespace : ', llmResponse.namespace);
      console.log('필터 정보 : ', llmResponse.filters);
      console.log('쿼리 정보 : ', llmResponse.embeddingQuery);
      console.log('찾은 매물 개수 : ', llmResponse.mainVectors.length);

      if (!llmResponse.mainVectors || llmResponse.route === 'GENERAL') {
        return new ChatResponseDto(llmResponse.currentResponse, [], []);
      }

      const mainPropertyIds = llmResponse.mainVectors.map((vector) => {
        return vector.metadata.psql_id;
      });

      const subPropertyIds = llmResponse.subVectors
        .map((vector) => vector.metadata.psql_id)
        .filter((id) => !mainPropertyIds.includes(id));

      const [mainProperties, subProperties] = await Promise.all([
        this.propertyService.getProperties(mainPropertyIds),
        this.propertyService.getProperties(subPropertyIds),
      ]);

      return new ChatResponseDto(
        llmResponse.currentResponse,
        mainProperties,
        subProperties,
      );
    } catch (error) {
      console.log(error);
      return new ChatResponseDto(
        '죄송해요. 일시적인 오류로 응답을 생성하는데에 실패했어요.😢',
        [],
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
        const stream = this.langGraphApp.workflow.streamEvents(input, {
          version: 'v2',
          configurable: { thread_id: threadId },
        });

        let isStart: boolean = false;

        for await (const { event, tags, data } of stream) {
          if (event === 'on_chat_model_stream' && tags.includes('final_node')) {
            if (data.chunk.content) {
              if (!isStart) {
                const state = await this.langGraphApp.workflow.getState({
                  configurable: { thread_id: threadId },
                });
                console.log(state);

                if (state.values.vectors || state.values.route !== 'GENERAL') {
                  const mainPropertyIds = state.values.mainVectors.map(
                    (vector) => {
                      return vector.metadata.psql_id;
                    },
                  );

                  const subPropertyIds = state.values.subVectors.map(
                    (vector) => {
                      return vector.metadata.psql_id;
                    },
                  );

                  const [mainProperties, subProperties] = await Promise.all([
                    this.propertyService.getProperties(mainPropertyIds),
                    this.propertyService.getProperties(subPropertyIds),
                  ]);
                  subscriber.next(
                    JSON.stringify({ mainProperties: mainProperties }),
                  );
                  subscriber.next(
                    JSON.stringify({ subProperties: subProperties }),
                  );
                }
                isStart = true;
                subscriber.next('Token');
              }
              console.log('토큰 전송');
              subscriber.next(data.chunk.content);
            }
          }
        }
        const state = await this.langGraphApp.workflow.getState({
          configurable: { thread_id: threadId },
        });
        console.log(state);
        if (state.values.vectors || state.values.route == 'SEARCH') {
          const propertyIds = state.values.vectors.map((vector) => {
            return vector.metadata.psql_id;
          });
          const properties =
            await this.propertyService.getProperties(propertyIds);
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
