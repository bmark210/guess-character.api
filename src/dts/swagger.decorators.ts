import { ApiProperty } from '@nestjs/swagger';
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

export const ApiEnumProperty = (enumType: any, description?: string) =>
  ApiProperty({
    enum: enumType,
    description,
    example: Object.values(enumType)[0],
  });

export const ApiCharacterTypeProperty = () =>
  ApiEnumProperty(CharacterType, 'Type of the character');

export const ApiDifficultyProperty = () =>
  ApiEnumProperty(Difficulty, 'Difficulty level of the character');

export const ApiSocialStatusProperty = () =>
  ApiEnumProperty(SocialStatus, 'Social status of the character');

export const ApiEntityTypeProperty = () =>
  ApiEnumProperty(EntityType, 'Type of the entity');

export const ApiFoodTypeProperty = () =>
  ApiEnumProperty(FoodType, 'Type of food item');

export const ApiMaterialProperty = () =>
  ApiEnumProperty(Material, 'Material of the object');

export const ApiObjectUsageProperty = () =>
  ApiEnumProperty(ObjectUsage, 'Usage of the object');

export const ApiPlaceTypeProperty = () =>
  ApiEnumProperty(PlaceType, 'Type of place');
