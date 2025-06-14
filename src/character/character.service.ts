import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCharacterDto } from '../dts/create-character.dto';
import { PaginationDto } from '../dts/pagination.dto';
import { Prisma, CharacterType, Book } from '@prisma/client';
import { UpdateCharacterDto } from 'src/dts/update-character.dto';

@Injectable()
export class CharacterService {
  constructor(private readonly prisma: PrismaService) {}

  async getNamesByBook(book: Book) {
    return this.prisma.baseEntity
      .findMany({
        select: {
          name: true,
        },
        where: {
          book: book,
        },
      })
      .then((items) => items.map((item) => item.name));
  }
  /**
   * Creates a new "character" using a Table-Per-Type (TPT) pattern:
   * 1) Creates a BaseEntity record
   * 2) Conditionally creates a child record (Person, FoodItem, etc.)
   */
  async create(data: CreateCharacterDto) {
    return this.prisma.$transaction(async (tx) => {
      // Check for duplicate name
      const existing = await tx.baseEntity.findFirst({
        where: {
          OR: [{ nameEn: data.nameEn }],
        },
      });

      if (existing) {
        throw new Error(
          `❌ Character with the same name already exists (name: "${data.nameEn}")`,
        );
      }

      // 1) Create the base entity with the shared fields
      const base = await tx.baseEntity.create({
        data: {
          name: data.name,
          description: data.description,
          book: data.book,
          chapter: data.chapter,
          relatedCharacterId: data.relatedCharacterId,
          nameEn: data.nameEn,
          image: data.image,
          verse: data.verse,
          type: data.type,
          level: data.level,
        },
      });

      // 2) Depending on `type`, create a child record
      await this.createChildRecord(tx, base.id, data);

      // 3) Return the newly created BaseEntity with includes
      return tx.baseEntity.findUnique({
        where: { id: base.id },
        include: {
          person: true,
          foodItem: true,
          objectItem: true,
          place: true,
          entity: true,
        },
      });
    });
  }

  /**
   * Returns all BaseEntity records, including child references.
   * @param paginationDto - Pagination parameters
   */
  async findAll(paginationDto: PaginationDto) {
    const page = Math.max(1, Number(paginationDto.page) || 1);
    const limit = Math.max(1, Number(paginationDto.limit) || 10);
    const skip = (page - 1) * limit;

    const whereClause: any = {};

    // Фильтрация по упоминанию книги
    if (paginationDto.book) {
      whereClause.book = paginationDto.book;
    }

    // Фильтрация по типу (если указан)
    if (paginationDto.type) {
      whereClause.type = paginationDto.type;
    }

    const [total, data] = await Promise.all([
      this.prisma.baseEntity.count({
        where: whereClause,
      }),
      this.prisma.baseEntity.findMany({
        where: whereClause,
        skip,
        take: limit,
        orderBy: [{ chapter: 'asc' }, { verse: 'asc' }],
        include: {
          person: paginationDto.type === 'PERSON' || !paginationDto.type,
          foodItem: paginationDto.type === 'FOOD' || !paginationDto.type,
          objectItem: paginationDto.type === 'OBJECT' || !paginationDto.type,
          place: paginationDto.type === 'PLACE' || !paginationDto.type,
          entity: paginationDto.type === 'ENTITY' || !paginationDto.type,
        },
      }),
    ]);

    const totalPages = Math.ceil(total / limit);

    if (page > totalPages && total > 0) {
      throw new Error(
        `Page ${page} does not exist. Total pages: ${totalPages}`,
      );
    }

    const transformedData = data.map((item) => ({
      ...item,
      formattedMention: `${item.book} ${item.chapter}:${item.verse}`,
    }));

    return {
      data: transformedData,
      meta: {
        totalItems: total,
        itemCount: data.length,
        itemsPerPage: limit,
        totalPages,
        currentPage: page,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
        type: whereClause.type,
        book: whereClause.mention,
      },
    };
  }

  /**
   * Returns a single BaseEntity by ID, including child references.
   */
  async findOne(id: string) {
    return this.prisma.baseEntity
      .findUnique({
        where: { id },
        include: {
          person: true,
          foodItem: true,
          objectItem: true,
          place: true,
          entity: true,
        },
      })
      .then((item) => {
        return item;
      });
  }

  /**
   * Updates a Character record (BaseEntity + child).
   */
  async update(id: string, data: UpdateCharacterDto) {
    console.log(data);
    return this.prisma.$transaction(
      async (tx) => {
        // 1) Update BaseEntity shared fields
        await tx.baseEntity.update({
          where: { id },
          data: {
            name: data.name,
            description: data.description,
            book: data.book,
            chapter: data.chapter,
            relatedCharacterId: data.relatedCharacterId,
            nameEn: data.nameEn,
            verse: data.verse,
            type: data.type,
            level: data.level,
          },
        });

        // 2) Update or create the child record.
        //    We'll remove any existing child if needed (e.g., switching from PERSON to FOOD).
        await this.updateChildRecord(tx, id, data);

        // 3) Return the updated record with includes
        const updated = await tx.baseEntity.findUnique({
          where: { id },
          include: {
            person: true,
            foodItem: true,
            objectItem: true,
            place: true,
            entity: true,
          },
        });

        return {
          ...updated,
          formattedMention: `Genesis ${updated.chapter}:${updated.verse}`,
        };
      },
      {
        timeout: 10000, // Increase timeout to 10 seconds
      },
    );
  }

  /**
   * Deletes a Character by its ID. Also cascades to child if any.
   */
  async delete(id: string) {
    return this.prisma.$transaction(async (tx) => {
      // 1) Delete child record(s) if needed (to satisfy referential integrity)
      await tx.person.delete({ where: { baseId: id } }).catch(() => null);
      await tx.foodItem.delete({ where: { baseId: id } }).catch(() => null);
      await tx.objectItem.delete({ where: { baseId: id } }).catch(() => null);
      await tx.place.delete({ where: { baseId: id } }).catch(() => null);
      await tx.entity.delete({ where: { baseId: id } }).catch(() => null);

      // 2) Delete BaseEntity
      return tx.baseEntity.delete({
        where: { id },
      });
    });
  }

  // ============================================================
  // ================ Helper Methods (Private) ==================
  // ============================================================

  /**
   * Creates the child record based on `type`.
   */
  private async createChildRecord(
    tx: Prisma.TransactionClient,
    baseId: string,
    data: UpdateCharacterDto,
  ) {
    switch (data.type) {
      case CharacterType.PERSON:
        return tx.person.create({
          data: {
            baseId,
            traits: data.person?.traits ?? [],
            status: data.person?.status,
          },
        });

      case CharacterType.ENTITY:
        return tx.entity.create({
          data: {
            baseId,
            entityType: data.entity?.entityType,
          },
        });

      case CharacterType.FOOD:
        return tx.foodItem.create({
          data: {
            baseId,
            foodType: data.foodItem?.foodType,
          },
        });

      case CharacterType.OBJECT:
        return tx.objectItem.create({
          data: {
            baseId,
            material: data.objectItem?.material,
            usage: data.objectItem?.usage,
          },
        });

      case CharacterType.PLACE:
        return tx.place.create({
          data: {
            baseId,
            placeType: data.place?.placeType,
          },
        });

      default:
        // If the type is not recognized, we do nothing or throw an error
        return null;
    }
  }

  /**
   * Updates the child record if type is the same,
   * or deletes the old child and creates a new child if type changed.
   */
  private async updateChildRecord(
    tx: Prisma.TransactionClient,
    baseId: string,
    data: UpdateCharacterDto,
  ) {
    // 1) Identify which type is already stored (if any).
    const existing = await tx.baseEntity.findUnique({
      where: { id: baseId },
      select: {
        type: true,
      },
    });
    const oldType = existing?.type;

    // 2) If the type is unchanged, we can just update the existing child.
    if (oldType === data.type) {
      switch (data.type) {
        case CharacterType.PERSON:
          return tx.person.update({
            where: { baseId },
            data: {
              traits: data.person?.traits ?? [],
              status: data.person?.status,
            },
          });

        case CharacterType.ENTITY:
          return tx.entity.update({
            where: { baseId },
            data: {
              entityType: data.entity?.entityType,
            },
          });

        case CharacterType.FOOD:
          return tx.foodItem.update({
            where: { baseId },
            data: {
              foodType: data.foodItem?.foodType,
            },
          });

        case CharacterType.OBJECT:
          return tx.objectItem.update({
            where: { baseId },
            data: {
              material: data.objectItem?.material,
              usage: data.objectItem?.usage,
            },
          });

        case CharacterType.PLACE:
          return tx.place.update({
            where: { baseId },
            data: {
              placeType: data.place?.placeType,
            },
          });

        default:
          return null;
      }
    } else {
      // If the type changed, remove the old child if it exists
      // Then create a new child matching the new type
      await this.deleteChild(tx, baseId, oldType);
      return this.createChildRecord(tx, baseId, data);
    }
  }

  /**
   * Delete a child record of a given type from the baseId.
   */
  private async deleteChild(
    tx: Prisma.TransactionClient,
    baseId: string,
    type?: CharacterType,
  ) {
    if (!type) return;
    switch (type) {
      case CharacterType.PERSON:
        return tx.person.delete({ where: { baseId } }).catch(() => null);
      case CharacterType.ENTITY:
        return tx.entity.delete({ where: { baseId } }).catch(() => null);
      case CharacterType.FOOD:
        return tx.foodItem.delete({ where: { baseId } }).catch(() => null);
      case CharacterType.OBJECT:
        return tx.objectItem.delete({ where: { baseId } }).catch(() => null);
      case CharacterType.PLACE:
        return tx.place.delete({ where: { baseId } }).catch(() => null);
      default:
        return null;
    }
  }

  // async addImage(image: string) {
  //   try {
  //     if (!image) {
  //       throw new Error('Image data is missing');
  //     }

  //     // Convert base64 to Buffer
  //     const buffer = Buffer.from(image, 'base64');

  //     // Convert to WebP using sharp
  //     const webpImage = await sharp(buffer).webp().toBuffer();

  //     // Upload to Vercel Blob (ensure you have properly configured your project)
  //     const { url } = await put(`characters/${Date.now()}.webp`, webpImage, {
  //       access: 'public',
  //     });

  //     return { url };
  //   } catch (error) {
  //     console.error('❌ Error in add-image:', error);
  //     throw new InternalServerErrorException('Image processing failed');
  //   }
  // }
}
