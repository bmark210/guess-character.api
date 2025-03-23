import { Injectable } from '@nestjs/common';
import { PrismaService } from '../core/prisma.service';
import { CreateCharacterDto } from '../dts/create-character.dto';
import { Prisma } from '@prisma/client';

// The following enums should match your Prisma schema
// or be imported from a shared file:
import { CharacterType } from '@prisma/client'; // example path

@Injectable()
export class CharacterService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Creates a new "character" using a Table-Per-Type (TPT) pattern:
   * 1) Creates a BaseEntity record
   * 2) Conditionally creates a child record (Person, FoodItem, etc.)
   */
  async create(data: CreateCharacterDto) {
    const forbiddenPatterns = ['le', 'km'];

    const lowerName = data.name.toLowerCase();
    if (forbiddenPatterns.some((pattern) => lowerName.includes(pattern))) {
      throw new Error(
        `Name cannot contain the following patterns: ${forbiddenPatterns.join(', ')}`,
      );
    }

    return this.prisma.$transaction(async (tx) => {
      // 1) Create the base entity with the shared fields
      const base = await tx.baseEntity.create({
        data: {
          name: data.name,
          description: data.description,
          mention: data.mention,
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
   */
  findAll() {
    return this.prisma.baseEntity.findMany({
      include: {
        person: true,
        foodItem: true,
        objectItem: true,
        place: true,
        entity: true,
      },
    });
  }

  /**
   * Returns a single BaseEntity by ID, including child references.
   */
  findOne(id: string) {
    return this.prisma.baseEntity.findUnique({
      where: { id },
      include: {
        person: true,
        foodItem: true,
        objectItem: true,
        place: true,
        entity: true,
      },
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
          mention: data.mention,
          type: data.type,
          level: data.level,
        },
      });

      // 2) Update or create the child record.
      //    We'll remove any existing child if needed (e.g., switching from PERSON to FOOD).
      await this.updateChildRecord(tx, id, data);

      // 3) Return the updated record with includes
      return tx.baseEntity.findUnique({
        where: { id },
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
            traits: data.traits ?? [],
            status: data.status,
          },
        });

      case CharacterType.ENTITY:
        return tx.entity.create({
          data: {
            baseId,
            entityType: data.entityType,
          },
        });

      case CharacterType.FOOD:
        return tx.foodItem.create({
          data: {
            baseId,
            foodType: data.foodType,
          },
        });

      case CharacterType.OBJECT:
        return tx.objectItem.create({
          data: {
            baseId,
            material: data.material,
            usage: data.usage,
          },
        });

      case CharacterType.PLACE:
        return tx.place.create({
          data: {
            baseId,
            placeType: data.placeType,
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
              traits: data.traits ?? [],
              status: data.status,
            },
          });

        case CharacterType.ENTITY:
          return tx.entity.update({
            where: { baseId },
            data: {
              entityType: data.entityType,
            },
          });

        case CharacterType.FOOD:
          return tx.foodItem.update({
            where: { baseId },
            data: {
              foodType: data.foodType,
            },
          });

        case CharacterType.OBJECT:
          return tx.objectItem.update({
            where: { baseId },
            data: {
              material: data.material,
              usage: data.usage,
            },
          });

        case CharacterType.PLACE:
          return tx.place.update({
            where: { baseId },
            data: {
              placeType: data.placeType,
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
