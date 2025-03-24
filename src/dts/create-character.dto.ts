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

export class CreateCharacterDto {
  name: string;
  description: string;
  mention: string;
  type: CharacterType;
  level: Difficulty;
  image: string;

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
