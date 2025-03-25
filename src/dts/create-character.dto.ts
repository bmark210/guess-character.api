import {
  CharacterType,
  Difficulty,
  SocialStatus,
  EntityType,
  FoodType,
  Material,
  ObjectUsage,
  PlaceType,
} from '@prisma/client';
import {
  IsInt,
  Min,
  IsString,
  IsEnum,
  IsArray,
  ValidateNested,
  IsNotEmpty,
} from 'class-validator';
import { Type } from 'class-transformer';

class PersonDto {
  @IsArray()
  @IsString({ each: true })
  @IsNotEmpty()
  traits: string[];

  @IsEnum(SocialStatus)
  @IsNotEmpty()
  status: SocialStatus;
}

class EntityDto {
  @IsEnum(EntityType)
  @IsNotEmpty()
  entityType: EntityType;
}

class FoodItemDto {
  @IsEnum(FoodType)
  @IsNotEmpty()
  foodType: FoodType;
}

class ObjectItemDto {
  @IsEnum(Material)
  @IsNotEmpty()
  material: Material;

  @IsEnum(ObjectUsage)
  @IsNotEmpty()
  usage: ObjectUsage;
}

class PlaceDto {
  @IsEnum(PlaceType)
  @IsNotEmpty()
  placeType: PlaceType;
}

export class CreateCharacterDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  description: string;

  @IsString()
  @IsNotEmpty()
  mention: string;

  @IsEnum(CharacterType)
  @IsNotEmpty()
  type: CharacterType;

  @IsEnum(Difficulty)
  @IsNotEmpty()
  level: Difficulty;

  @IsString()
  @IsNotEmpty()
  image: string;

  @IsInt()
  @Min(1)
  @Type(() => Number)
  @IsNotEmpty()
  chapter: number;

  @IsInt()
  @Min(1)
  @Type(() => Number)
  @IsNotEmpty()
  verse: number;

  @ValidateNested()
  @Type(() => PersonDto)
  person?: PersonDto;

  @ValidateNested()
  @Type(() => EntityDto)
  entity?: EntityDto;

  @ValidateNested()
  @Type(() => FoodItemDto)
  foodItem?: FoodItemDto;

  @ValidateNested()
  @Type(() => ObjectItemDto)
  objectItem?: ObjectItemDto;

  @ValidateNested()
  @Type(() => PlaceDto)
  place?: PlaceDto;
}
