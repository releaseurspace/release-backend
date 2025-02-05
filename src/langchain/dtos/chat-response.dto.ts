import { ApiProperty } from '@nestjs/swagger';
import { GetPropertyDto } from 'src/property/dtos/get-property.dto';

export class ChatResponseDto {
  @ApiProperty({ description: 'llm 응답' })
  chatResponse: string;

  @ApiProperty({ type: [GetPropertyDto], description: 'AI 추천 매물 데이터 (최대 3개)' })
  mainProperties: GetPropertyDto[];

  @ApiProperty({type: [GetPropertyDto], description: '그 외 매물 데이터 (최대 50개)'})
  subProperties: GetPropertyDto[];

  constructor(chatReponse: string, mainProperties: GetPropertyDto[], subProperties: GetPropertyDto[]) {
    this.chatResponse = chatReponse;
    this.mainProperties = mainProperties;
    this.subProperties = subProperties;
  }
}
