import { OpenAIEmbeddings } from '@langchain/openai';
import { PineconeStore } from '@langchain/pinecone';
import { Pinecone as PineconeClient } from '@pinecone-database/pinecone';

export class PineconeService {
  private pinecone: PineconeClient;
  private embeddingsModel: OpenAIEmbeddings;
  private pinconeStore: PineconeStore;

  constructor() {
    this.pinecone = new PineconeClient({
      apiKey: process.env.PINECONE_API_KEY,
    });
    this.embeddingsModel = new OpenAIEmbeddings({
      apiKey: process.env.OPEN_API_KEY,
      model: 'text-embedding-ada-002',
    });
  }

  // 시, 구 정보를 받아 필터링
  private async init(index: string, namespace: string) {
    const pineconeIndex = this.pinecone.index(index);
    this.pinconeStore = await PineconeStore.fromExistingIndex(
      this.embeddingsModel,
      {
        pineconeIndex,
        namespace,
      },
    );
  }

  // 유사도 높은 벡터 5개 찾는 함수
  // TODO: 메타데이터 필터링 기능 추가하기
  async getSimilarVectors(
    index: string,
    namespace: string,
    query: string,
    filter: any,
  ) {
    await this.init(index, namespace);

    const hasValidFilter = filter && Object.keys(filter).length > 0;

    const similarVectors = await this.pinconeStore.similaritySearch(
      query,
      3,
      hasValidFilter ? filter : undefined,
    );
    return similarVectors;
  }
}
