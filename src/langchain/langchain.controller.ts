import { Body, Controller, Post } from '@nestjs/common';
import { LangchainService } from './langchain.service';
import { AIMessageChunk } from '@langchain/core/messages';
import { ChatInputDto } from './dtos/chat-input.dto';

@Controller('langchain')
export class LangchainController {
  constructor(private readonly langchainService: LangchainService) {}

  @Post()
  async test(@Body() body: ChatInputDto): Promise<AIMessageChunk> {
    return await this.langchainService.test(body);
  }
}
