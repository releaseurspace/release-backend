import { ApiProperty } from '@nestjs/swagger';
import { GetPropertyDto } from 'src/property/dtos/get-property.dto';

export class GetRecommendedPropertiesResDto {
  @ApiProperty({
    type: [GetPropertyDto],
    description: 'AI 추천 매물 데이터 (최대 3개)',
  })
  mainProperties: GetPropertyDto[];

  @ApiProperty({
    type: [GetPropertyDto],
    description: '그 외 매물 데이터 (최대 50개)',
  })
  subProperties: GetPropertyDto[];

  constructor(
    mainProperties: GetPropertyDto[],
    subProperties: GetPropertyDto[],
  ) {
    this.mainProperties = mainProperties;
    this.subProperties = subProperties;
  }
}
