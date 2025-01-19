import { Body, Controller, Post } from '@nestjs/common';
import { LangchainService } from './langchain.service';
import { ChatInputDto } from './dtos/chat-input.dto';
import { ChatResponseDto } from './dtos/char-response.dto';

@Controller('langchain')
export class LangchainController {
  constructor(private readonly langchainService: LangchainService) {}

  @Post()
  async chat(@Body() body: ChatInputDto): Promise<ChatResponseDto> {
    return await this.langchainService.chat(body);
  }
}
