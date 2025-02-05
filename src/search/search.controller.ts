import { Controller, Get, Query } from '@nestjs/common';
import { SearchService } from './search.service';

@Controller('search')
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  @Get()
  async search(@Query('q') keyword: string) {
    return await this.searchService.searchData('release.properties', {
      field_name: keyword,
    });
  }
}
