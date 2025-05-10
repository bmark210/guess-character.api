import { Body, Controller, Get, Post } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { HandBookBody } from 'src/dts/handbook';
import { HandbookService } from './handbook.service';
import {
  HandbookBook,
  HandbookCharacterType,
  HandbookDifficulty,
} from '@prisma/client';

@ApiTags('Handbook')
@Controller('handbook')
export class HandbookController {
  constructor(private readonly handbookService: HandbookService) {}

  @Post('books')
  @ApiOperation({ summary: 'Create a new book' })
  @ApiResponse({
    status: 201,
    description: 'The book has been successfully created.',
  })
  createBook(@Body() book: HandbookBook) {
    return this.handbookService.createBook(book);
  }

  @Post('character-types')
  @ApiOperation({ summary: 'Create a new character type' })
  @ApiResponse({
    status: 201,
    description: 'The character type has been successfully created.',
  })
  createCharacterType(@Body() characterType: HandbookCharacterType) {
    return this.handbookService.createCharacterType(characterType);
  }

  @Post('difficulties')
  @ApiOperation({ summary: 'Create a new difficulty' })
  @ApiResponse({
    status: 201,
    description: 'The difficulty has been successfully created.',
  })
  createDifficulty(@Body() difficulty: HandbookDifficulty) {
    return this.handbookService.createDifficulty(difficulty);
  }

  @Get('books')
  @ApiResponse({
    status: 200,
    description: 'Returns all books',
  })
  getBooks() {
    return this.handbookService.getBooks();
  }

  @Get('character-types')
  @ApiOperation({ summary: 'Get all character types' })
  @ApiResponse({
    status: 200,
    description: 'Returns all character types',
  })
  getCharacterTypes() {
    return this.handbookService.getCharacterTypes();
  }

  @Get('difficulties')
  @ApiOperation({ summary: 'Get all difficulties' })
  @ApiResponse({
    status: 200,
    description: 'Returns all difficulties',
  })
  getDifficulties() {
    return this.handbookService.getDifficulties();
  }

  @Post()
  @ApiOperation({ summary: 'Get all characters for the handbook' })
  @ApiResponse({
    status: 200,
    description: 'Returns all characters for the handbook',
  })
  getHandbookCharacters(@Body() handBookBody: HandBookBody) {
    return this.handbookService.getHandbookCharacters(handBookBody);
  }
}
