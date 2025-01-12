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

export const GraphAnnotation = Annotation.Root({
  ...MessagesAnnotation.spec,
  vectors: Annotation<any[]>(),
});

// LangGraph 워크플로우 생성을 위한 팩토리
export const createLangGraphWorkflow = () => {
  const llm = new ChatOpenAI({
    apiKey: process.env.OPEN_API_KEY,
    model: 'gpt-4',
    temperature: 0.7,
  });

  const callModel = async (state: typeof GraphAnnotation.State) => {
    console.log(state);
    const prompt = await chatPromptTemplate.invoke({
      messages: state.messages,
      vectors: state.vectors,
    });
    const response = await llm.invoke(prompt);
    return { messages: response };
  };

  const workflow = new StateGraph(GraphAnnotation)
    .addNode('model', callModel)
    .addEdge(START, 'model')
    .addEdge('model', END);

  const memory = new MemorySaver();
  return workflow.compile({ checkpointer: memory });
};
