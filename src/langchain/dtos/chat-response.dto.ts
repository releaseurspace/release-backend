import { ApiProperty } from '@nestjs/swagger';
import { GetPropertyDto } from 'src/property/dtos/get-property.dto';

export class ChatResponseDto {
  @ApiProperty({ description: 'llm 응답' })
  chatResponse: string;

  @ApiProperty({ type: [GetPropertyDto], description: '추천할 매물 데이터' })
  properties: GetPropertyDto[];

  constructor(chatReponse: string, properties: GetPropertyDto[]) {
    this.chatResponse = chatReponse;
    this.properties = properties;
  }
}
