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
import { ApiTags, ApiOperation, ApiResponse, ApiBody, ApiParam, ApiQuery } from '@nestjs/swagger';

@ApiTags('Characters')
@Controller('characters')
export class CharacterController {
  constructor(private readonly characterService: CharacterService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new character' })
  @ApiBody({ type: CreateCharacterDto })
  @ApiResponse({ status: 201, description: 'Character created successfully' })
  create(@Body() createCharacterDto: CreateCharacterDto) {
    return this.characterService.create(createCharacterDto);
  }

  /**
   * Endpoint for uploading an image to Vercel Blob storage.
   * Expects a JSON body with { "image": "<base64 string>" }.
   */
  @Post('add-image')
  @ApiOperation({ summary: 'Upload an image for a character' })
  @ApiBody({ type: AddImageDto })
  @ApiResponse({ status: 201, description: 'Image uploaded successfully' })
  addImage(@Body() addImageDto: AddImageDto) {
    return this.characterService.addImage(addImageDto.image);
  }

  @Get()
  @ApiOperation({ summary: 'Get all characters with pagination' })
  @ApiQuery({ type: PaginationDto })
  @ApiResponse({ status: 200, description: 'Returns paginated characters' })
  findAll(@Query() paginationDto: PaginationDto) {
    return this.characterService.findAll(paginationDto);
  }

  @Get('names/:book')
  @ApiOperation({ summary: 'Get character names by book' })
  @ApiParam({ name: 'book', description: 'Book name' })
  @ApiResponse({ status: 200, description: 'Returns character names for the specified book' })
  getNamesByBook(@Param('book') book: string) {
    return this.characterService.getNamesByBook(book);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a character by ID' })
  @ApiParam({ name: 'id', description: 'Character ID' })
  @ApiResponse({ status: 200, description: 'Returns the character' })
  findOne(@Param('id') id: string) {
    return this.characterService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a character' })
  @ApiParam({ name: 'id', description: 'Character ID' })
  @ApiBody({ type: UpdateCharacterDto })
  @ApiResponse({ status: 200, description: 'Character updated successfully' })
  update(
    @Param('id') id: string,
    @Body() updateCharacterDto: UpdateCharacterDto,
  ) {
    return this.characterService.update(id, updateCharacterDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a character' })
  @ApiParam({ name: 'id', description: 'Character ID' })
  @ApiResponse({ status: 200, description: 'Character deleted successfully' })
  remove(@Param('id') id: string) {
    return this.characterService.delete(id);
  }
}
