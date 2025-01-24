import { Controller, Get, Param } from '@nestjs/common';
import { PropertyService } from './property.service';
import { ApiOperation, ApiParam, ApiResponse } from '@nestjs/swagger';
import { GetPropertyDetailDto } from './dtos/get-property-detail.dto';

@Controller('property')
export class PropertyController {
  constructor(private readonly propertyService: PropertyService) {}

  @Get('/:propertyId')
  @ApiOperation({
    summary: '매물 상세 데이터 가져오기',
    description: '매물 id를 받아 상세 페이지를 위한 데이터를 가져옵니다.',
  })
  @ApiParam({
    name: 'propertyId',
    description: 'property table의 id',
  })
  @ApiResponse({
    status: 200,
    type: GetPropertyDetailDto,
  })
  async GetPropertyDetail(
    @Param('propertyId') propertyId: number,
  ): Promise<GetPropertyDetailDto> {
    return await this.propertyService.getPropertyDetail(propertyId);
  }
}
