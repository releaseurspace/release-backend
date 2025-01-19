import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class ChatInputDto {
  @IsNotEmpty()
  @IsString()
  @ApiProperty({
    description: '유저 식별자 (우선 임의의 값 하드코딩해서 넣기)',
  })
  userId: string;

  @IsNotEmpty()
  @IsString()
  @ApiProperty({ description: '유저 메시지' })
  content: string;
}
