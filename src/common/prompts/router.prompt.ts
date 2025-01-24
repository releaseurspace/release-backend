import { ChatPromptTemplate } from '@langchain/core/prompts';

export const routerPromptTemplate = ChatPromptTemplate.fromMessages([
  {
    role: 'system',
    content: `You are a real estate assistant that helps route user queries.
    Only consider the user’s current message to determine the context. 
    If the user's current message is related to:
    - real estate listings
    - property recommendations
    - property searches
    - starting a restaurant, office, or any other business related to real estate rental or lease
    - property attributes such as size, budget, or location
    Then return "SEARCH".
    Otherwise, return "GENERAL".
    `,
  },
  {
    role: 'human',
    content: 'msg:{current}',
  },
]);
