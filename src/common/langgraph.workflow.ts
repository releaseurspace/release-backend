import {
  START,
  END,
  MessagesAnnotation,
  StateGraph,
  MemorySaver,
} from '@langchain/langgraph';
import { ChatOpenAI } from '@langchain/openai';
import { promptTemplate } from './prompts/chat-prompt';

// LangGraph 워크플로우 생성을 위한 팩토리
export const createLangGraphWorkflow = (apiKey: string) => {
  const llm = new ChatOpenAI({
    apiKey,
    model: 'gpt-4',
    temperature: 0.7,
  });

  const callModel = async (state: typeof MessagesAnnotation.State) => {
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
