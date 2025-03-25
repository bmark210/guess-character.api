import { Injectable } from '@nestjs/common';
import { PrismaService } from '../core/prisma.service';
import { CreateCharacterDto } from '../dts/create-character.dto';
import { PaginationDto } from '../dts/pagination.dto';
import { Prisma, CharacterType } from '@prisma/client';

@Injectable()
export class CharacterService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Parses biblical reference like "Genesis" or "Быт." into chapter and verse numbers
   */
  private parseBiblicalReference(mention: string): {
    chapter: number;
    verse: number;
  } {
    try {
      // For new format, we'll return defaults since chapter and verse are stored separately
      if (mention === 'Genesis' || mention === 'Быт.') {
        return { chapter: 1, verse: 1 };
      }

      // For legacy format, try to parse
      let match = mention.match(/Genesis\s*(\d+):(\d+)/);
      if (!match) {
        match = mention.match(/Быт\.\s*(\d+):(\d+)/);
      }

      if (!match) {
        return { chapter: 1, verse: 1 }; // default values if parsing fails
      }

      return {
        chapter: parseInt(match[1], 10),
        verse: parseInt(match[2], 10),
      };
    } catch (error) {
      console.error('Failed to parse biblical reference:', error);
      return { chapter: 1, verse: 1 }; // default values if parsing fails
    }
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
          OR: [{ name: data.name }],
        },
      });

      if (existing) {
        throw new Error(
          `❌ Character with the same name already exists (name: "${data.name}")`,
        );
      }

      // 1) Create the base entity with the shared fields
      const base = await tx.baseEntity.create({
        data: {
          name: data.name,
          description: data.description,
          mention: 'Genesis',
          chapter: data.chapter,
          verse: data.verse,
          image: data.image,
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
    // Validate and normalize pagination parameters
    const page = Math.max(1, Number(paginationDto.page) || 1);
    const limit = Math.max(1, Number(paginationDto.limit) || 10);

    const skip = (page - 1) * limit;

    // Get total count and paginated data in parallel
    const [total, data] = await Promise.all([
      this.prisma.baseEntity.count(),
      this.prisma.baseEntity.findMany({
        skip,
        take: limit,
        orderBy: [{ chapter: 'asc' }, { verse: 'asc' }],
        include: {
          person: true,
          foodItem: true,
          objectItem: true,
          place: true,
          entity: true,
        },
      }),
    ]);

    const totalPages = Math.ceil(total / limit);

    // Validate page number
    if (page > totalPages && total > 0) {
      throw new Error(
        `Page ${page} does not exist. Total pages: ${totalPages}`,
      );
    }

    // Transform the data to include formatted mention
    const transformedData = data.map((item) => ({
      ...item,
      formattedMention: `Genesis ${item.chapter}:${item.verse}`,
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
      },
    };
  }

  /**
   * Returns a single BaseEntity by ID, including child references.
   */
  findOne(id: string) {
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
        if (item) {
          return {
            ...item,
            formattedMention: `Genesis ${item.chapter}:${item.verse}`,
          };
        }
        return null;
      });
  }

  /**
   * Updates a Character record (BaseEntity + child).
   */
  async update(id: string, data: CreateCharacterDto) {
    return this.prisma.$transaction(async (tx) => {
      // 1) Update BaseEntity shared fields
      await tx.baseEntity.update({
        where: { id },
        data: {
          name: data.name,
          description: data.description,
          mention: 'Genesis',
          chapter: data.chapter,
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
    });
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
    data: CreateCharacterDto,
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
    data: CreateCharacterDto,
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
}
