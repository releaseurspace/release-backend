import {
  START,
  END,
  MessagesAnnotation,
  StateGraph,
  MemorySaver,
  Annotation,
} from '@langchain/langgraph';
import { ChatOpenAI } from '@langchain/openai';

import { Json } from '@pinecone-database/pinecone/dist/pinecone-generated-ts-fetch/db_control';

import { Injectable } from '@nestjs/common';
import { PineconeService } from 'src/common/services/pinecone.service';
import { routerPromptTemplate } from 'src/common/prompts/router.prompt';
import { generateLocationPromptTemplate } from 'src/common/prompts/generate-location.prompt';
import { GenerateFilteringConditionPromptTemplate } from 'src/common/prompts/generate-filtering-condition.prompt';
import { generalResponsePromptTemplate } from 'src/common/prompts/general-response.prompt';
import { recommendationResponsePromptTemplate } from 'src/common/prompts/recommendation-response.prompt';
import { propertyDetailResponsePromptTemplate } from 'src/common/prompts/property-detail-response.prompt';
import { feedbackResponsePromptTemplate } from 'src/common/prompts/feedback-response.prompt';

// 랭체인 메모리 상에서 기억할 정보들
export const GraphAnnotation = Annotation.Root({
  ...MessagesAnnotation.spec,
  index: Annotation<string>(),
  namespace: Annotation<string>(),
  filters: Annotation<Json>(),
  embeddingQuery: Annotation<string>(),
  mainVectors: Annotation<any[]>(),
  subVectors: Annotation<any[]>(),
  route: Annotation<string>(),
  currentResponse: Annotation<string>(),
});

export const formatTimestamp = (timestamp: number) => {
  return new Intl.DateTimeFormat('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).format(timestamp);
};

@Injectable()
export class LangGraphApp {
  workflow: ReturnType<typeof this.createWorkflow>;

  constructor(private readonly pineconeService: PineconeService) {
    this.workflow = this.createWorkflow();
  }

  private createWorkflow() {
    const llm = new ChatOpenAI({
      apiKey: process.env.OPEN_API_KEY,
      model: 'gpt-4o-mini',
      temperature: 0.7,
    });

    const finalLLM = new ChatOpenAI({
      apiKey: process.env.OPEN_API_KEY,
      model: 'gpt-4o-mini',
      temperature: 0.7,
      tags: ['final_node'],
    });

    // 사용자 메시지 라우팅 -> "GENERAL" or "SEARCH" or "DETAILS"
    const routeQuery = async (state: typeof GraphAnnotation.State) => {
      const current = state.messages.slice(-1);
      const history = state.messages.slice(0, -1);
      const prompt = await routerPromptTemplate.invoke({
        history,
        current,
      });
      const response = await llm.invoke(prompt);
      const route = response.content
        ? String(response.content).trim()
        : 'GENERAL';
      console.log(`라우트 완료 시간: ${formatTimestamp(Date.now())}`);
      return {
        ...state,
        route,
      };
    };

    // 사용자 메시지에서 주소 정보 뽑아내는 로직
    const generateLocation = async (state: typeof GraphAnnotation.State) => {
      const prompt = await generateLocationPromptTemplate.invoke({
        index: state.index,
        namespace: state.namespace,
        message: state.messages.slice(-1),
      });
      const response = await llm.invoke(prompt);
      const jsonResponse = JSON.parse(String(response.content));
      console.log(`로케이션 완료 시간: ${formatTimestamp(Date.now())}`);

      return {
        ...state,
        index: jsonResponse.index,
        namespace: jsonResponse.namespace,
      };
    };

    // Pinecone 필터링 조건 및 쿼리 생성 로직
    const generateFilteringCondition = async (
      state: typeof GraphAnnotation.State,
    ) => {
      const currentMessage = state.messages.slice(-1);
      const prompt = await GenerateFilteringConditionPromptTemplate.invoke({
        message: currentMessage,
        currentFilters: state.filters,
        currentQuery: state.embeddingQuery,
      });
      const response = await llm.invoke(prompt);
      const jsonResponse = JSON.parse(String(response.content));
      console.log(`필터링 조건 생성 완료 시간: ${formatTimestamp(Date.now())}`);

      return {
        ...state,
        filters: jsonResponse.filter_conditions,
        embeddingQuery: jsonResponse.remaining_query,
      };
    };

    // 생성한 필터링 조건과 쿼리를 통해 적합한 데이터를 검색하는 로직
    const getSimilarVectors = async (state: typeof GraphAnnotation.State) => {
      if (!state.index || !state.namespace || !state.filters) {
        return { ...state, vectors: [] };
      }

      const mainVectors = await this.pineconeService.getSimilarVectors(
        state.index,
        state.namespace ?? undefined,
        state.embeddingQuery,
        3,
        state.filters,
      );

      const subVectors = await this.pineconeService.getSimilarVectors(
        state.index,
        state.namespace ?? undefined,
        state.embeddingQuery,
        50,
        undefined,
      );
      console.log(`벡터 검색 완료 시간: ${formatTimestamp(Date.now())}`);
      return {
        ...state,
        mainVectors,
        subVectors,
      };
    };

    // 일반 대화 응답 로직
    const generateGeneralResponse = async (
      state: typeof GraphAnnotation.State,
    ) => {
      const current = state.messages.slice(-1);
      const history = state.messages.slice(0, -1);
      const isFirst = state.messages.length === 1 ? 'True' : 'False';
      const prompt = await generalResponsePromptTemplate.invoke({
        isFirst,
        current,
        history,
      });
      const response = await finalLLM.invoke(prompt);
      console.log(`일반 응답 완료 시간: ${formatTimestamp(Date.now())}`);
      return { messages: response, currentResponse: response.content };
    };

    // 매물 검색 및 추천 대화 로직
    const generateRecommendationResponse = async (
      state: typeof GraphAnnotation.State,
    ) => {
      const isFirst = state.messages.length === 1 ? 'True' : 'False';
      const count = state.mainVectors ? state.mainVectors.length : 0;
      const prompt = await recommendationResponsePromptTemplate.invoke({
        isFirst,
        count,
        messages: state.messages,
        vectors: state.mainVectors,
      });
      const response = await finalLLM.invoke(prompt);
      console.log(`추천 응답 시간: ${formatTimestamp(Date.now())}`);
      return { messages: response, currentResponse: response.content };
    };

    // 매물 상세 설명 대화 로직
    const generatePropertyDetailResponse = async (
      state: typeof GraphAnnotation.State,
    ) => {
      const current = state.messages.slice(-1);
      const history = state.messages.slice(0, -1);
      const prompt = await propertyDetailResponsePromptTemplate.invoke({
        current,
        history,
        vectors: state.mainVectors,
      });
      const response = await finalLLM.invoke(prompt);
      console.log(`후속 질문 응답 완료 시간: ${formatTimestamp(Date.now())}`);
      return { messages: response, currentResponse: response.content };
    };

    const generateFeedbackResponse = async (
      state: typeof GraphAnnotation.State,
    ) => {
      const current = state.messages.slice(-1);
      const prompt = await feedbackResponsePromptTemplate.invoke({
        namespace: state.namespace,
        filters: state.filters,
        embeddingQuery: state.embeddingQuery,
        current,
      });
      const response = await finalLLM.invoke(prompt);
      console.log(`피드백 응답 완료 시간: ${formatTimestamp(Date.now())}`);
      return { messages: response, currentResponse: response.content };
    };

    const workflow = new StateGraph(GraphAnnotation)
      .addNode('router', routeQuery)
      .addNode('location', generateLocation)
      .addNode('general', generateGeneralResponse)
      .addNode('recommend', generateRecommendationResponse)
      .addNode('filter', generateFilteringCondition)
      .addNode('search', getSimilarVectors)
      .addNode('detail', generatePropertyDetailResponse)
      .addNode('feedback', generateFeedbackResponse)

      .addEdge(START, 'router')
      .addConditionalEdges('router', (state) => state.route, {
        SEARCH: 'location',
        GENERAL: 'general',
        DETAILS: 'detail',
        FEEDBACK: 'feedback',
      })
      .addEdge('location', 'filter')
      .addEdge('filter', 'search')
      .addEdge('search', 'recommend')
      .addEdge('recommend', END)
      .addEdge('general', END)
      .addEdge('detail', END)
      .addEdge('feedback', END);

    const memory = new MemorySaver();
    return workflow.compile({ checkpointer: memory });
  }
}
