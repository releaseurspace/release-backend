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

  async init(index: string, namespace: string) {
    const pineconeIndex = this.pinecone.index(index);
    this.pinconeStore = await PineconeStore.fromExistingIndex(
      this.embeddingsModel,
      {
        pineconeIndex,
        namespace,
      },
    );
  }

  async getSimilarVectors(index: string, namespace: string, query: string) {
    await this.init(index, namespace);
    const similarVectors = await this.pinconeStore.similaritySearch(query, 5);
    return similarVectors;
  }
}
