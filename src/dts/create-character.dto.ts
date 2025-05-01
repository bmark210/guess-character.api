import {
  CharacterType,
  Difficulty,
  SocialStatus,
  EntityType,
  FoodType,
  Material,
  ObjectUsage,
  PlaceType,
  Book,
  Size,
} from '@prisma/client';
import {
  IsInt,
  Min,
  IsString,
  IsEnum,
  IsArray,
  ValidateNested,
  IsNotEmpty,
  IsBase64,
  IsOptional,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import {
  ApiCharacterTypeProperty,
  ApiDifficultyProperty,
  ApiSocialStatusProperty,
  ApiEntityTypeProperty,
  ApiFoodTypeProperty,
  ApiMaterialProperty,
  ApiObjectUsageProperty,
  ApiPlaceTypeProperty,
  ApiSizeProperty,
} from './swagger.decorators';

export class PersonDto {
  @ApiProperty({
    type: [String],
    description: 'Character traits',
    example: ['brave', 'intelligent'],
  })
  @IsArray()
  @IsString({ each: true })
  @IsNotEmpty()
  traits: string[];

  @ApiSocialStatusProperty()
  @IsEnum(SocialStatus)
  @IsNotEmpty()
  status: SocialStatus;
}

export class EntityDto {
  @ApiEntityTypeProperty()
  @IsEnum(EntityType)
  @IsNotEmpty()
  entityType: EntityType;
}

export class FoodItemDto {
  @ApiFoodTypeProperty()
  @IsEnum(FoodType)
  @IsNotEmpty()
  foodType: FoodType;
}

export class ObjectItemDto {
  @ApiMaterialProperty()
  @IsEnum(Material)
  @IsOptional()
  material?: Material;

  @ApiObjectUsageProperty()
  @IsEnum(ObjectUsage)
  @IsOptional()
  usage?: ObjectUsage;

  @ApiSizeProperty()
  @IsEnum(Size)
  @IsOptional()
  size?: Size;
}

export class PlaceDto {
  @ApiPlaceTypeProperty()
  @IsEnum(PlaceType)
  @IsNotEmpty()
  placeType: PlaceType;
}

export class CreateCharacterDto {
  @ApiProperty({
    description: 'Name of the character',
    example: 'John Doe',
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    description: 'English name of the character',
    example: 'John Doe',
  })
  @IsString()
  @IsNotEmpty()
  nameEn: string;

  @ApiProperty({
    description: 'Related character ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  relatedCharacterId: string;

  @ApiProperty({
    description: 'Description of the character',
    example: 'A brave warrior from the north',
  })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiProperty({
    description: 'Mention text for the character',
    example: '@johndoe',
  })
  @IsEnum(Book)
  @IsNotEmpty()
  book: Book;

  @ApiCharacterTypeProperty()
  @IsEnum(CharacterType)
  @IsNotEmpty()
  type: CharacterType;

  @ApiDifficultyProperty()
  @IsEnum(Difficulty)
  @IsNotEmpty()
  level: Difficulty;

  @ApiProperty({
    description: 'Base64 encoded image of the character',
    example: 'data:image/jpeg;base64,/9j/4AAQSkZJRg...',
  })
  image: string;
  @ApiProperty({
    description: 'Chapter number where the character appears',
    example: 1,
    minimum: 1,
  })
  @IsInt()
  @Min(1)
  @Type(() => Number)
  @IsNotEmpty()
  chapter: number;

  @ApiProperty({
    description: 'Verse number where the character appears',
    example: 1,
    minimum: 1,
  })
  @IsInt()
  @Min(1)
  @Type(() => Number)
  @IsNotEmpty()
  verse: number;

  @ApiProperty({
    description: 'Person-specific properties',
    required: false,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => PersonDto)
  person?: PersonDto;

  @ApiProperty({
    description: 'Entity-specific properties',
    required: false,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => EntityDto)
  entity?: EntityDto;

  @ApiProperty({
    description: 'Food item-specific properties',
    required: false,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => FoodItemDto)
  foodItem?: FoodItemDto;

  @ApiProperty({
    description: 'Object item-specific properties',
    required: false,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => ObjectItemDto)
  objectItem?: ObjectItemDto;

  @ApiProperty({
    description: 'Place-specific properties',
    required: false,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => PlaceDto)
  place?: PlaceDto;
}

export class AddImageDto {
  @ApiProperty({
    description: 'Base64 encoded image',
    example: 'data:image/jpeg;base64,/9j/4AAQSkZJRg...',
  })
  @IsString()
  @IsNotEmpty()
  @IsBase64()
  image: string;
}
