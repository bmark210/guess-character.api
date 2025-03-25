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
import { IsInt, IsOptional, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateCharacterDto {
  name: string;
  description: string;
  mention: string;
  type: CharacterType;
  level: Difficulty;
  image: string;

  @IsInt()
  @Min(1)
  @Type(() => Number)
  chapter: number;

  @IsInt()
  @Min(1)
  @Type(() => Number)
  verse: number;

  person?: {
    traits?: string[];
    status?: SocialStatus;
  };

  entity?: {
    entityType?: EntityType;
  };

  foodItem?: {
    foodType?: FoodType;
  };

  objectItem?: {
    material?: Material;
    usage?: ObjectUsage;
  };

  place?: {
    placeType?: PlaceType;
  };
}
