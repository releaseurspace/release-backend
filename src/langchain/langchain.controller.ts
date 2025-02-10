import { Body, Controller, Get, Post, Query, Req, Res } from '@nestjs/common';
import { LangchainService } from './langchain.service';
import { ChatInputDto } from './dtos/chat-input.dto';
import { ChatResponseDto } from './dtos/chat-response.dto';
import {
  ApiBody,
  ApiOperation,
  ApiProduces,
  ApiQuery,
  ApiResponse,
} from '@nestjs/swagger';
import { Request, Response } from 'express';
import { GetRecommendedPropertiesResDto } from './dtos/get-recommended-properties-res.dto';

@Controller('langchain')
export class LangchainController {
  constructor(private readonly langchainService: LangchainService) {}

  @Post()
  @ApiOperation({
    summary: '챗봇과 대화',
    description: 'LLM 기반 챗봇과 대화하여 매물 정보를 받아옵니다.',
  })
  @ApiBody({ type: ChatInputDto })
  @ApiResponse({
    status: 201,
    description: 'LLM 호출 성공',
    type: ChatResponseDto,
  })
  async chat(@Body() body: ChatInputDto): Promise<ChatResponseDto> {
    console.log(body);
    return await this.langchainService.chat(body);
  }

  @Post('stream')
  @ApiOperation({
    summary: '챗봇과 대화 - 스트리밍 ver',
    description:
      'LLM 기반 챗봇과 대화하여 응답 메시지 및 매물 정보를 스트리밍 방식으로 받아옵니다. JSON.parse를 통해 json 형태로 사용할 수 있습니다.',
  })
  @ApiBody({ type: ChatInputDto })
  @ApiProduces('text/event-stream')
  @ApiResponse({
    status: 200,
    description:
      '스트리밍 응답. 이 API는 SSE(Server-Sent Events)를 활용하여 실시간으로 대화 토큰, 매물 데이터 배열, 스트림 상태 정보를 전송합니다.',
    content: {
      'text/event-stream': {
        schema: {
          type: 'object',
          properties: {
            token: {
              type: 'string',
              description: 'LLM 응답 토큰',
            },
          },
        },
      },
    },
  })
  async streamChat(
    @Body() body: ChatInputDto,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    const stream$ = this.langchainService.chatStreaming(body);
    const subscription = stream$.subscribe({
      next: (content) => {
        res.write(`${JSON.stringify({ token: content })}\n`);
      },
      error: (err) => {
        res.write(`${JSON.stringify({ state: 'error' })}\n`);
        res.end();
      },
      complete: () => {
        res.write(`${JSON.stringify({ state: 'end' })}`);
      },
    });
    req.on('close', () => {
      subscription.unsubscribe();
      res.end();
    });
  }

  @Get('properties')
  @ApiOperation({
    summary: '추천 매물 가져오기',
    description: '챗봇 추천 매물리스트를 가져옵니다.',
  })
  @ApiQuery({ name: 'userId', description: 'user 식별자 (임시)' })
  @ApiResponse({
    status: 201,
    description: 'LLM 호출 성공',
    type: GetRecommendedPropertiesResDto,
  })
  async getRecommendedProperties(
    @Query('userId') userId: string,
  ): Promise<GetRecommendedPropertiesResDto> {
    return await this.langchainService.getRecommendedProperties(userId);
  }
}
