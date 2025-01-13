import {
  START,
  END,
  MessagesAnnotation,
  StateGraph,
  MemorySaver,
  Annotation,
} from '@langchain/langgraph';
import { ChatOpenAI } from '@langchain/openai';
import { chatPromptTemplate } from './prompts/chat-prompt';
import { GenerateFilteringConditionPromptTemplate } from './prompts/generate-filtering-condition.prompt';
import { PineconeService } from './services/pinecone.service';
import { Json } from '@pinecone-database/pinecone/dist/pinecone-generated-ts-fetch/db_control';

export const GraphAnnotation = Annotation.Root({
  ...MessagesAnnotation.spec,
  vectors: Annotation<any[]>(),
  filters: Annotation<Json>(),
  query: Annotation<string[]>(),
});

// LangGraph 워크플로우 생성을 위한 팩토리
export const createLangGraphWorkflow = () => {
  const llm = new ChatOpenAI({
    apiKey: process.env.OPEN_API_KEY,
    model: 'gpt-4o-mini',
    temperature: 0.7,
  });

  const pineconeService = new PineconeService();

  const generateFilteringCondition = async (
    state: typeof GraphAnnotation.State,
  ) => {
    const prompt = await GenerateFilteringConditionPromptTemplate.invoke({
      messages: state.messages,
    });
    const response = await llm.invoke(prompt);
    const jsonResponse = JSON.parse(String(response.content));
    const currentQuery = state.query || [];
    const updatedQuery = [...currentQuery, jsonResponse.remaining_query];
    return {
      ...state,
      filters: jsonResponse.filter_conditions,
      query: updatedQuery,
    };
  };

  const getSimilarVectors = async (state: typeof GraphAnnotation.State) => {
    const queryHistory = state.query.join(' ');
    console.log(state.filters);
    const vectors = await pineconeService.getSimilarVectors(
      'seoul',
      'jungnang',
      queryHistory,
      state.filters,
    );
    return {
      ...state,
      vectors,
    };
  };

  const callModel = async (state: typeof GraphAnnotation.State) => {
    const prompt = await chatPromptTemplate.invoke({
      messages: state.messages,
      vectors: state.vectors,
    });
    const response = await llm.invoke(prompt);
    return { messages: response };
  };

  const workflow = new StateGraph(GraphAnnotation)
    .addNode('model', callModel)
    .addNode('filter', generateFilteringCondition)
    .addNode('search', getSimilarVectors)
    .addEdge(START, 'filter')
    .addEdge('filter', 'search')
    .addEdge('search', 'model')
    .addEdge('model', END);

  const memory = new MemorySaver();
  return workflow.compile({ checkpointer: memory });
};
