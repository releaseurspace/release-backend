import {
  START,
  END,
  MessagesAnnotation,
  StateGraph,
  MemorySaver,
} from '@langchain/langgraph';
import { ChatOpenAI, OpenAIEmbeddings } from '@langchain/openai';
import { promptTemplate } from './prompts/chat-prompt';
import { Pinecone } from '@pinecone-database/pinecone';

// LangGraph 워크플로우 생성을 위한 팩토리
export const createLangGraphWorkflow = () => {
  const llm = new ChatOpenAI({
    apiKey: process.env.OPEN_API_KEY,
    model: 'gpt-4',
    temperature: 0.7,
  });

  const embeddingsModel = new OpenAIEmbeddings({
    apiKey: process.env.OPEN_API_KEY,
    model: 'text-embedding-ada-002',
  });

  const pinecone = new Pinecone({
    apiKey: process.env.PINECONE_API_KEY,
  });

  const pineconeIndex = pinecone.index('seoul');

  const getSimilarVectors = async (query: string) => {
    const queryEmbedding = await embeddingsModel.embedQuery(query);
    const similarVecotrs = await pineconeIndex.namespace('jungnang').query({
      vector: queryEmbedding,
      topK: 3,
      includeMetadata: true,
      includeValues: false,
    });

    console.log('respose : ', similarVecotrs);

    if (!similarVecotrs.matches || similarVecotrs.matches.length === 0) {
      return [
        {
          주소: '정보 없음',
          gpt응답: '죄송합니다, 관련 정보를 찾을 수 없습니다.',
        },
      ];
    }

    const similarMetadata = similarVecotrs.matches.map(
      (match) => match.metadata,
    );

    console.log('Similar metadata : ', similarMetadata);
  };

  const callModel = async (state: typeof MessagesAnnotation.State) => {
    await getSimilarVectors(
      '서울시 중랑구에서 카페를 창업하려고 하는데, 월세는 500만원보다 작고, 보증금은 5000만원보다 작으면 좋겠어. 엘리베이터는 0개보다 많아야해',
    );
    const prompt = await promptTemplate.invoke(state);
    const response = await llm.invoke(prompt);
    return { messages: response };
  };

  const workflow = new StateGraph(MessagesAnnotation)
    .addNode('model', callModel)
    .addEdge(START, 'model')
    .addEdge('model', END);

  const memory = new MemorySaver();
  return workflow.compile({ checkpointer: memory });
};
