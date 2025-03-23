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
  image?: string;
  traits?: string[];
  status?: SocialStatus;
  entityType?: EntityType;
  foodType?: FoodType;
  material?: Material;
  usage?: ObjectUsage;
  placeType?: PlaceType;
}
