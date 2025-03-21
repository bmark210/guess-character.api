// src/character/character.controller.ts
import {
  Controller,
  Post,
  Body,
  Get,
  Delete,
  Param,
  Put,
} from '@nestjs/common';
import { CharacterService } from './character.service';
import { CreateCharacterDto } from '../dts/create-character.dto';

@Controller('characters')
export class CharacterController {
  constructor(private readonly characterService: CharacterService) {}

  @Post()
  create(@Body() dto: CreateCharacterDto) {
    return this.characterService.create(dto);
  }

  @Get()
  findAll() {
    return this.characterService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.characterService.findOne(id);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() dto: CreateCharacterDto) {
    return this.characterService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.characterService.delete(id);
  }
}
