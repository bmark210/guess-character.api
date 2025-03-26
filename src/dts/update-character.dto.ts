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

export class UpdateCharacterDto {
  @IsString()
  name: string;

  @IsString()
  description: string;

  @IsString()
  mention: string;

  @IsInt()
  chapter: number;

  @IsInt()
  verse: number;

  @IsEnum(CharacterType)
  type: CharacterType;

  @IsEnum(Difficulty)
  level: Difficulty;

  @IsUrl()
  image: string;

  @ValidateNested()
  @IsOptional()
  @Type(() => PersonDto)
  person?: PersonDto;

  @ValidateNested()
  @IsOptional()
  @Type(() => EntityDto)
  entity?: EntityDto;

  @ValidateNested()
  @IsOptional()
  @Type(() => FoodItemDto)
  foodItem?: FoodItemDto;

  @ValidateNested()
  @IsOptional()
  @Type(() => ObjectItemDto)
  objectItem?: ObjectItemDto;

  @ValidateNested()
  @IsOptional()
  @Type(() => PlaceDto)
  place?: PlaceDto;
}
