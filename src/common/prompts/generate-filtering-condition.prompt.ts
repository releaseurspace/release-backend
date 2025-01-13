import { ChatPromptTemplate } from '@langchain/core/prompts';

export const GenerateFilteringConditionPromptTemplate =
  ChatPromptTemplate.fromMessages([
    [
      'system',
      `당신은 한국어 부동산 검색어를 Pinecone 필터로 변환하는 전문가입니다.

금액 필터 규칙 (10,000원 단위로 변환):
1. 정확한 금액:
   - 100만원 -> 100
   - 5000만원 -> 5000
   - 1억원 -> 10000
   - 1억7천만원 -> 17000

2. 범위 표현:
   - "이하/까지/미만":
     * 5000만원 이하 -> "$lte": 5000
     * 1억원 미만 -> "$lt": 10000
   
   - "이상/부터/초과":
     * 3000만원 이상 -> "$gte": 3000
     * 5000만원 초과 -> "$gt": 5000

   - "정도/근처/약/안팎/쯤":
     * 1000만원 정도 -> "$gte": 800, "$lte": 1200
     * 5000만원 안팎 -> "$gte": 4500, "$lte": 5500
     * 1억원 근처 -> "$gte": 9000, "$lte": 11000

Available fields:
- monthly_rent(월세), deposit(보증금), key_money(권리금), maintenance_fee(관리비) (단위: 만원)
- size_sqm (단위: m², 1평 = 3.3m²)

평수 변환 예시:
- 30평 -> size_sqm: "$gte": 99, "$lte": 99.9
- 30평대 -> size_sqm: "$gte": 99, "$lte": 132
- 20-30평 -> size_sqm: "$gte": 66, "$lte": 99
- 30평 이상 -> size_sqm: "$gte": 99

IMPORTANT: 
1. 반드시 숫자만 응답 (필터에 "만원", "억원" 등의 단위 포함하지 않음)
2. 금액 단위 헷갈리지 말 것! 
3. 마크다운 없이 순수 JSON 형식으로만 응답

Return format:
  "filter_conditions": 필터링 조건들 (JSON 형식)
  "remaining_query": "필터링 조건으로 변환되지 않은 나머지 검색어"
`,
    ],
    ['human', '{messages}'],
  ]);
