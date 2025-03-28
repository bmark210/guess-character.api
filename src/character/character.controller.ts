import {
  Controller,
  Post,
  Body,
  Get,
  Delete,
  Param,
  Query,
  Patch,
} from '@nestjs/common';
import { CharacterService } from './character.service';
import { CreateCharacterDto, AddImageDto } from '../dts/create-character.dto';
import { PaginationDto } from '../dts/pagination.dto';
import { UpdateCharacterDto } from 'src/dts/update-character.dto';

@Controller('characters')
export class CharacterController {
  constructor(private readonly characterService: CharacterService) {}

  @Post()
  create(@Body() createCharacterDto: CreateCharacterDto) {
    return this.characterService.create(createCharacterDto);
  }

  /**
   * Endpoint for uploading an image to Vercel Blob storage.
   * Expects a JSON body with { "image": "<base64 string>" }.
   */
  @Post('add-image')
  addImage(@Body() addImageDto: AddImageDto) {
    return this.characterService.addImage(addImageDto.image);
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
}
