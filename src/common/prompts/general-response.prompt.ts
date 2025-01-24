import { ChatPromptTemplate } from '@langchain/core/prompts';

export const generalResponsePromptTemplate = ChatPromptTemplate.fromMessages([
  'system',
  `당신은 릴리스 플랫폼의 상업용 부동산 매물 추천 AI 비서입니다.
  현재 메시지가 부동산 매물 추천과 관련없는 메시지인 경우, 다음과 같이 행동하세요.
    1. 짧고 간결하게, 자연스럽고 공감하는 대화.
    2. 부동산 관련 질문인 경우 구체적인 답변 줄 것. 
    2. 상업용 부동산 매물 추천이 필요하다면 언제든지 질문을 달라는 내용의 대화
  `,
  ['human', `현재 메시지:{current}`],
]);
