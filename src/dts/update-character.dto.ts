import {
  IsEnum,
  IsOptional,
  IsString,
  ValidateNested,
  IsInt,
  IsUrl,
  IsNotEmpty,
  IsArray,
} from 'class-validator';
import { Type } from 'class-transformer';
import {
  CharacterType,
  Difficulty,
  ObjectUsage,
  PlaceType,
  SocialStatus,
  EntityType,
  FoodType,
  Material,
} from '@prisma/client';
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
} from './swagger.decorators';

class PersonDto {
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

class EntityDto {
  @ApiEntityTypeProperty()
  @IsEnum(EntityType)
  @IsNotEmpty()
  entityType: EntityType;
}

class FoodItemDto {
  @ApiFoodTypeProperty()
  @IsEnum(FoodType)
  @IsNotEmpty()
  foodType: FoodType;
}

class ObjectItemDto {
  @ApiMaterialProperty()
  @IsEnum(Material)
  @IsNotEmpty()
  material: Material;

  @ApiObjectUsageProperty()
  @IsEnum(ObjectUsage)
  @IsNotEmpty()
  usage: ObjectUsage;
}

class PlaceDto {
  @ApiPlaceTypeProperty()
  @IsEnum(PlaceType)
  @IsNotEmpty()
  placeType: PlaceType;
}

export class UpdateCharacterDto {
  @ApiProperty({
    description: 'Name of the character',
    example: 'John Doe',
  })
  @IsString()
  name: string;

  @ApiProperty({
    description: 'Description of the character',
    example: 'A brave warrior from the north',
  })
  @IsString()
  description: string;

  @ApiProperty({
    description: 'Mention text for the character',
    example: '@johndoe',
  })
  @IsString()
  mention: string;

  @ApiProperty({
    description: 'Chapter number where the character appears',
    example: 1,
    minimum: 1,
  })
  @IsInt()
  chapter: number;

  @ApiProperty({
    description: 'Verse number where the character appears',
    example: 1,
    minimum: 1,
  })
  @IsInt()
  verse: number;

  @ApiCharacterTypeProperty()
  @IsEnum(CharacterType)
  type: CharacterType;

  @ApiDifficultyProperty()
  @IsEnum(Difficulty)
  level: Difficulty;

  @ApiProperty({
    description: 'URL of the character image',
    example: 'https://example.com/character.jpg',
  })
  @IsUrl()
  image: string;

  @ApiProperty({
    description: 'Person-specific properties',
    required: false,
  })
  @ValidateNested()
  @IsOptional()
  @Type(() => PersonDto)
  person?: PersonDto;

  @ApiProperty({
    description: 'Entity-specific properties',
    required: false,
  })
  @ValidateNested()
  @IsOptional()
  @Type(() => EntityDto)
  entity?: EntityDto;

  @ApiProperty({
    description: 'Food item-specific properties',
    required: false,
  })
  @ValidateNested()
  @IsOptional()
  @Type(() => FoodItemDto)
  foodItem?: FoodItemDto;

  @ApiProperty({
    description: 'Object item-specific properties',
    required: false,
  })
  @ValidateNested()
  @IsOptional()
  @Type(() => ObjectItemDto)
  objectItem?: ObjectItemDto;

  @ApiProperty({
    description: 'Place-specific properties',
    required: false,
  })
  @ValidateNested()
  @IsOptional()
  @Type(() => PlaceDto)
  place?: PlaceDto;
}
