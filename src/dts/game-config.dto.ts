import { IsArray, IsNotEmpty } from 'class-validator';
import { IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Book, CharacterType } from '@prisma/client';
import { Difficulty } from '@prisma/client';

export class GameConfig {
  @ApiProperty({
    description: 'Difficulty level',
    example: 'EASY',
  })
  @IsEnum(Difficulty)
  @IsNotEmpty()
  difficulty: Difficulty;

  @ApiProperty({
    description: 'Character types',
    example: [CharacterType.PERSON],
  })
  @IsArray()
  @IsEnum(CharacterType, { each: true })
  @IsNotEmpty()
  characterTypes: CharacterType[];

  @ApiProperty({
    description: 'Books',
    example: [Book.GENESIS],
  })
  @IsArray()
  @IsEnum(Book, { each: true })
  @IsNotEmpty()
  books: Book[];
}
