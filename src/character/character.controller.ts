// src/character/character.controller.ts
import {
  Controller,
  Post,
  Body,
  Get,
  Delete,
  Param,
  Put,
  InternalServerErrorException,
} from '@nestjs/common';
import { CharacterService } from './character.service';
import { CreateCharacterDto } from '../dts/create-character.dto';
import { put } from '@vercel/blob';
import * as sharp from 'sharp';

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

  @Post('add-image')
  async addImage(@Body() body: { image: string }) {
    try {
      if (!body.image) {
        throw new Error('Image data is missing');
      }

      const buffer = Buffer.from(body.image, 'base64');

      const webpImage = await sharp(buffer).webp().toBuffer();

      const { url } = await put(`characters/${Date.now()}.webp`, webpImage, {
        access: 'public',
      });

      return { url };
    } catch (error) {
      console.error('❌ Error in add-image:', error);
      throw new InternalServerErrorException('Image processing failed');
    }
  }
}
