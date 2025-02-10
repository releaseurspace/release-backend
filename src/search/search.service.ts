import { Injectable } from '@nestjs/common';
import { ElasticsearchService } from '@nestjs/elasticsearch';

@Injectable()
export class SearchService {
  constructor(private readonly elasticsearchService: ElasticsearchService) {}

  // 특정 조건으로 검색하는 메서드
  async searchData(index: string, query: any) {
    const searchReponse = await this.elasticsearchService.search({
      index,
      body: {
        query: {
          match: {
            'address_parsed.neighborhood': '창성동',
          },
        },
      },
    });

    return searchReponse.hits.hits.map((hit) => hit._source); // 검색 결과 반환
  }
}
