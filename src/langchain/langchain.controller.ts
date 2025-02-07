import { Body, Controller, Post, Req, Res } from '@nestjs/common';
import { LangchainService } from './langchain.service';
import { ChatInputDto } from './dtos/chat-input.dto';
import { ChatResponseDto } from './dtos/chat-response.dto';
import {
  ApiBody,
  ApiOperation,
  ApiProduces,
  ApiResponse,
} from '@nestjs/swagger';
import { Request, Response } from 'express';

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
            mainProperties: {
              type: 'array',
              description: 'AI 추천 매물 데이터 배열',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'number', description: '매물 ID' },
                  latitude: { type: 'string', description: '위도' },
                  longitude: { type: 'string', description: '경도' },
                  purpose: { type: 'string', description: '업종' },
                  deposit: {
                    type: 'number',
                    description: '보증금 (만원 단위)',
                  },
                  monthly_rent: {
                    type: 'number',
                    description: '월세 (만원 단위)',
                  },
                  key_money: {
                    type: 'number',
                    description: '권리금 (만원 단위)',
                  },
                  maintenance_fee: {
                    type: 'number',
                    description: '관리비 (만원 단위)',
                  },
                  size: {
                    type: 'number',
                    description: '평수',
                  },
                  description: { type: 'string', description: '매물 설명' },
                  floor: { type: 'string', description: '층수' },
                  nearest_station: {
                    type: 'string',
                    description: '가장 가까운 지하철 역',
                  },
                  distance_to_station: {
                    type: 'string',
                    description: '지하철 역까지의 도보 시간',
                  },
                },
              },
            },
            subProperties: {
              type: 'array',
              description: '그 외 추천 매물 데이터 배열',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'number', description: '매물 ID' },
                  latitude: { type: 'string', description: '위도' },
                  longitude: { type: 'string', description: '경도' },
                  purpose: { type: 'string', description: '업종' },
                  deposit: {
                    type: 'number',
                    description: '보증금 (만원 단위)',
                  },
                  monthly_rent: {
                    type: 'number',
                    description: '월세 (만원 단위)',
                  },
                  key_money: {
                    type: 'number',
                    description: '키머니 (만원 단위)',
                  },
                  maintenance_fee: {
                    type: 'number',
                    description: '관리비 (만원 단위)',
                  },
                  size: {
                    type: 'number',
                    description: '면적 (평 또는 제곱미터)',
                  },
                  description: { type: 'string', description: '매물 설명' },
                  floor: { type: 'string', description: '층수' },
                  nearest_station: {
                    type: 'string',
                    description: '가장 가까운 지하철 역',
                  },
                  distance_to_station: {
                    type: 'string',
                    description: '지하철 역까지의 도보 시간',
                  },
                },
              },
            },
            state: {
              type: 'string',
              enum: ['token', 'error', 'end'],
              description: '스트림 상태',
            },
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

    let mode = 0;
    const stream$ = this.langchainService.chatStreaming(body);
    const subscription = stream$.subscribe({
      next: (content) => {
        if (content === 'Token') {
          mode = 1;
          res.write(`${JSON.stringify({ state: 'token' })}\n`);
        } else if (mode === 1) {
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
