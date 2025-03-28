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
  IsBase64,
  IsOptional,
} from 'class-validator';
import { Type } from 'class-transformer';

export class PersonDto {
  @IsArray()
  @IsString({ each: true })
  @IsNotEmpty()
  traits: string[];

  @IsEnum(SocialStatus)
  @IsNotEmpty()
  status: SocialStatus;
}

export class EntityDto {
  @IsEnum(EntityType)
  @IsNotEmpty()
  entityType: EntityType;
}

export class FoodItemDto {
  @IsEnum(FoodType)
  @IsNotEmpty()
  foodType: FoodType;
}

export class ObjectItemDto {
  @IsEnum(Material)
  @IsNotEmpty()
  material: Material;

  @IsEnum(ObjectUsage)
  @IsNotEmpty()
  usage: ObjectUsage;
}

export class PlaceDto {
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

  @IsOptional()
  @ValidateNested()
  @Type(() => PersonDto)
  person?: PersonDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => EntityDto)
  entity?: EntityDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => FoodItemDto)
  foodItem?: FoodItemDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => ObjectItemDto)
  objectItem?: ObjectItemDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => PlaceDto)
  place?: PlaceDto;
}

export class AddImageDto {
  @IsString()
  @IsNotEmpty()
  @IsBase64()
  image: string;
}
