import {
  Controller,
  Post,
  Body,
  Get,
  Delete,
  Param,
  InternalServerErrorException,
  Query,
  Patch,
} from '@nestjs/common';
import { CharacterService } from './character.service';
import { CreateCharacterDto } from '../dts/create-character.dto';
import { PaginationDto } from '../dts/pagination.dto';
import { UpdateCharacterDto } from 'src/dts/update-character.dto';

// Make sure you have: npm install sharp @vercel/blob
import { put } from '@vercel/blob';
import * as sharp from 'sharp';

@Controller('characters')
export class CharacterController {
  constructor(private readonly characterService: CharacterService) {}

  @Post()
  create(@Body() createCharacterDto: CreateCharacterDto) {
    return this.characterService.create(createCharacterDto);
  }

  @Get()
  findAll(@Query() paginationDto: PaginationDto) {
    return this.characterService.findAll(paginationDto);
  }

  @Get('names/:book')
  getNamesByBook(@Param('book') book: string) {
    return this.characterService.getNamesByBook(book);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.characterService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateCharacterDto: UpdateCharacterDto,
  ) {
    return this.characterService.update(id, updateCharacterDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.characterService.delete(id);
  }

  /**
   * Endpoint for uploading an image to Vercel Blob storage.
   * Expects a JSON body with { "image": "<base64 string>" }.
   */
  @Post('add-image')
  async addImage(@Body() body: { image: string }) {
    try {
      if (!body?.image) {
        throw new Error('Image data is missing');
      }

      // Convert base64 to Buffer
      const buffer = Buffer.from(body.image, 'base64');

      // Convert to WebP using sharp
      const webpImage = await sharp(buffer).webp().toBuffer();

      // Upload to Vercel Blob (ensure you have properly configured your project)
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
