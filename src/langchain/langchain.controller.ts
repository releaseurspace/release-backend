import { Body, Controller, Post, Req, Res } from '@nestjs/common';
import { LangchainService } from './langchain.service';
import { ChatInputDto } from './dtos/chat-input.dto';
import { ChatResponseDto } from './dtos/char-response.dto';
import {
  ApiBody,
  ApiOperation,
  ApiProduces,
  ApiResponse,
} from '@nestjs/swagger';
import { Request, Response } from 'express';
import { GetPropertyDto } from './dtos/get-property.dto';

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
    description: '스트리밍 응답',
    content: {
      'text/event-stream': {
        schema: {
          type: 'object',
          properties: {
            token: { type: 'string', description: '대화 토큰' },
            properties: { type: 'string', description: '매물 데이터' },
            state: {
              type: 'string',
              enum: ['property', 'error', 'end'],
              description: '스트림 상태',
            },
          },
        },
        examples: {
          token: {
            value: { token: '안녕하세요' },
            description: '대화 토큰 스트리밍',
          },
          properties: {
            value: {
              properties: `${[
                {
                  id: 61206,
                  latitude: '37.5610074',
                  longitude: '127.0481247',
                  purpose: '한식점',
                  deposit: 2000,
                  monthly_rent: 120,
                  key_money: 5000,
                  maintenance_fee: 0,
                  size: 11,
                  description: '사근동 전수양도 가능한 음식점',
                  floor: '지상 1층',
                  nearest_station: '용답역',
                  distance_to_station: '도보 4분',
                },
                {
                  id: 61159,
                  latitude: '37.5637652',
                  longitude: '127.0327073',
                  purpose: '기타창업모음',
                  deposit: 2000,
                  monthly_rent: 120,
                  key_money: 0,
                  maintenance_fee: 10,
                  size: 21,
                  description: '성동구 도선동 즉시 입주 가능한 지층 상가',
                  floor: '지하 1층',
                  nearest_station: '상왕십리역',
                  distance_to_station: '도보 5분',
                },
              ]}`,
            },
            description: '매물 데이터 배열',
          },
          state: {
            value: { state: 'property' },
            description: '부동산 매물 응답 상태',
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

    console.log(body);
    let mode = 0;
    const stream$ = this.langchainService.chatStreaming(body);
    const subscription = stream$.subscribe({
      next: (content) => {
        if (content === 'Property') {
          mode = 1;
          res.write(`${JSON.stringify({ state: 'property' })}\n`);
        } else if (mode === 0) {
          res.write(`${JSON.stringify({ token: content })}\n`);
        } else {
          res.write(`${content}\n`);
        }
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
}
