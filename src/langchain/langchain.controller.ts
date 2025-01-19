import { Body, Controller, Post } from '@nestjs/common';
import { LangchainService } from './langchain.service';
import { ChatInputDto } from './dtos/chat-input.dto';
import { ChatResponseDto } from './dtos/char-response.dto';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';

@Controller('langchain')
export class LangchainController {
  constructor(private readonly langchainService: LangchainService) {}

  @Post()
  @ApiOperation({
    summary: '챗봇과 대화',
    description: 'LLM 기반 챗봇과 대화하여 매물 정보를 받아옵니다.',
  })
  @ApiResponse({
    status: 201,
    description: 'LLM 호출 성공',
    type: ChatResponseDto,
  })
  async chat(@Body() body: ChatInputDto): Promise<ChatResponseDto> {
    return await this.langchainService.chat(body);
  }
}
