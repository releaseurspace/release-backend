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

// LangGraph 워크플로우 생성을 위한 팩토리
export const createLangGraphWorkflow = () => {
  const llm = new ChatOpenAI({
    apiKey: process.env.OPEN_API_KEY,
    model: 'gpt-4o-mini',
    temperature: 0.7,
  });

  const pineconeService = new PineconeService();

  // 사용자 메시지가 부동산 관련 질문인지, 무관한 질문인지 판단하는 로직
  const routeQuery = async (state: typeof GraphAnnotation.State) => {
    const currentMessage = state.messages.slice(-1);
    const messageHistory = state.messages.slice(-3, -1);
    const prompt = await routerPromptTemplate.invoke({
      current: currentMessage,
      history: messageHistory,
    });
    const response = await llm.invoke(prompt);
    return {
      ...state,
      route: String(response.content).trim(), // "GENERAL" or "SEARCH"
    };
  };

  const generateLocation = async (state: typeof GraphAnnotation.State) => {
    const prompt = await generateLocationPromptTemplate.invoke({
      index: state.index,
      namespace: state.namespace,
      message: state.messages.slice(-1),
    });
    const response = await llm.invoke(prompt);
    const jsonResponse = JSON.parse(String(response.content));
    console.log(response);
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
    return {
      ...state,
      vectors,
    };
  };

  // 일반 대화 응답 로직
  const generateGeneralResponse = async (
    state: typeof GraphAnnotation.State,
  ) => {
    console.log(state);
    const currentMessage = state.messages.slice(-1);
    const history = state.messages.slice(-3, -1);
    const prompt = await generalResponsePromptTemplate.invoke({
      current: currentMessage,
      history,
    });
    const response = await llm.invoke(prompt);
    return { messages: response, currentResponse: response.content };
  };

  // 매물 추천 대화 로직
  const generateRecommendationResponse = async (
    state: typeof GraphAnnotation.State,
  ) => {
    console.log(state);
    const prompt = await recommendationResponsePromptTemplate.invoke({
      messages: state.messages,
      vectors: state.vectors,
    });
    const response = await llm.invoke(prompt);
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
