import {
  START,
  END,
  MessagesAnnotation,
  StateGraph,
  MemorySaver,
  Annotation,
} from '@langchain/langgraph';
import { ChatOpenAI } from '@langchain/openai';
import { GenerateFilteringConditionPromptTemplate } from './prompts/generate-filtering-condition.prompt';
import { PineconeService } from './services/pinecone.service';
import { Json } from '@pinecone-database/pinecone/dist/pinecone-generated-ts-fetch/db_control';
import { recommendationResponsePromptTemplate } from './prompts/recommendation-response.prompt';
import { routerPromptTemplate } from './prompts/router.prompt';
import { generalResponsePromptTemplate } from './prompts/general-response.prompt';
import { generateLocationPromptTemplate } from './prompts/generate-location.prompt';

// 랭체인 메모리 상에서 기억할 정보들
export const GraphAnnotation = Annotation.Root({
  ...MessagesAnnotation.spec,
  index: Annotation<string>(),
  namespace: Annotation<string>(),
  filters: Annotation<Json>(),
  embeddingQuery: Annotation<string>(),
  vectors: Annotation<any[]>(),
  route: Annotation<string>(),
  currentResponse: Annotation<string>(),
});

/**
 * 테스트용 타이머 함수
 * TODO: 삭제
 */
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

// LangGraph 워크플로우 생성을 위한 팩토리
export const createLangGraphWorkflow = () => {
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

  const pineconeService = new PineconeService();

  // 사용자 메시지가 부동산 관련 질문인지, 무관한 질문인지 판단하는 로직
  const routeQuery = async (state: typeof GraphAnnotation.State) => {
    const currentMessage = state.messages.slice(-1);
    const prompt = await routerPromptTemplate.invoke({
      current: currentMessage,
    });
    const response = await llm.invoke(prompt);
    console.log(`라우트 완료 시간: ${formatTimestamp(Date.now())}`);
    return {
      ...state,
      route: String(response.content).trim(), // "GENERAL" or "SEARCH"
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
    console.log(`필터링 완료 시간: ${formatTimestamp(Date.now())}`);
    return {
      ...state,
      filters: jsonResponse.filter_conditions,
      embeddingQuery: jsonResponse.remaining_query,
    };
  };

  // 생성한 필터링 조건과 쿼리를 통해 적합한 데이터를 검색하는 로직
  const getSimilarVectors = async (state: typeof GraphAnnotation.State) => {
    if (!state.index || !state.filters) {
      return { ...state, vectors: [] };
    }
    const vectors = await pineconeService.getSimilarVectors(
      state.index,
      state.namespace ?? undefined,
      state.embeddingQuery,
      state.filters,
    );
    console.log(`검색 완료 시간: ${formatTimestamp(Date.now())}`);
    return {
      ...state,
      vectors,
    };
  };

  // 일반 대화 응답 로직
  const generateGeneralResponse = async (
    state: typeof GraphAnnotation.State,
  ) => {
    const currentMessage = state.messages.slice(-1);
    const history = state.messages.slice(-3, -1);
    const prompt = await generalResponsePromptTemplate.invoke({
      current: currentMessage,
      history,
    });
    const response = await finalLLM.invoke(prompt);
    return { messages: response, currentResponse: response.content };
  };

  // 매물 추천 대화 로직
  const generateRecommendationResponse = async (
    state: typeof GraphAnnotation.State,
  ) => {
    console.log(state);
    const prompt = await recommendationResponsePromptTemplate.invoke({
      count: state.vectors.length,
      messages: state.messages,
      vectors: state.vectors,
    });
    const response = await finalLLM.invoke(prompt);
    console.log(`추천 응답 완료 시간: ${formatTimestamp(Date.now())}`);
    return { messages: response, currentResponse: response.content };
  };

  const workflow = new StateGraph(GraphAnnotation)
    .addNode('router', routeQuery)
    .addNode('location', generateLocation)
    .addNode('general', generateGeneralResponse)
    .addNode('recommend', generateRecommendationResponse)
    .addNode('filter', generateFilteringCondition)
    .addNode('search', getSimilarVectors)

    .addEdge(START, 'router')
    .addConditionalEdges('router', (state) => state.route, {
      SEARCH: 'location',
      GENERAL: 'general',
    })
    .addEdge('location', 'filter')
    .addEdge('filter', 'search')
    .addEdge('search', 'recommend')
    .addEdge('recommend', END)
    .addEdge('general', END);

  const memory = new MemorySaver();
  return workflow.compile({ checkpointer: memory });
};

export type LangGraphWorkflow = ReturnType<typeof createLangGraphWorkflow>;
