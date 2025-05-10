import { Book, CharacterType, Difficulty } from '@prisma/client';

export interface HandBookBody {
  book: Book[];
  type: CharacterType[];
  level: Difficulty[];
  page: number;
  pageSize: number;
}
