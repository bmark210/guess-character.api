import {
  CharacterType,
  Difficulty,
  MentionType,
  PersonalityTraits,
  SocialStatus,
} from '@prisma/client';

export class CreateCharacterDto {
  name: string;
  description: string;
  img: string;
  type: CharacterType;
  mention: MentionType;
  level: Difficulty;
  traits?: PersonalityTraits;
  status?: SocialStatus;
}
