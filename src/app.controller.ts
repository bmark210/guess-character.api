import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

@ApiTags('App')
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  @ApiOperation({ summary: 'Get hello message' })
  @ApiResponse({ status: 200, description: 'Returns a hello message' })
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('test')
  @ApiOperation({ summary: 'Get test message' })
  @ApiResponse({ status: 200, description: 'Returns a test message' })
  getTest(): string {
    return 'This is a test endpoint!';
  }
}
