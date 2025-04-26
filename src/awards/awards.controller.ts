import { Controller, Post, Body, Get } from '@nestjs/common';
import { AwardsService } from './awards.service';
import { ApiTags } from '@nestjs/swagger';
import { Award } from '@prisma/client';

@ApiTags('Awards')
@Controller('awards')
export class AwardsController {
  constructor(private readonly awardsService: AwardsService) {}

  @Post()
  create(@Body() award: Award) {
    return this.awardsService.create(award);
  }

  @Get()
  findAll() {
    return this.awardsService.findAll();
  }
}
