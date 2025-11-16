import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateFamilyDtoType } from '@teddy/shared';
import { CLIENT_CODE_PREFIX } from '@teddy/shared';

@Injectable()
export class FamiliesService {
  constructor(private prisma: PrismaService) {}

  async generateClientCode(): Promise<string> {
    const count = await this.prisma.family.count();
    const number = (count + 1).toString().padStart(6, '0');
    return `${CLIENT_CODE_PREFIX}-${number}`;
  }

  async create(dto: CreateFamilyDtoType) {
    return this.createFamily(dto);
  }

  async createFamily(dto: CreateFamilyDtoType) {
    const clientCode = await this.generateClientCode();

    const family = await this.prisma.family.create({
      data: {
        ...dto,
        clientCode,
      },
    });

    // Create loyalty counter
    await this.prisma.loyaltyCounter.create({
      data: {
        familyId: family.id,
        currentCycleCount: 0,
        totalVisits: 0,
      },
    });

    return family;
  }

  async findByClientCode(clientCode: string) {
    return this.prisma.family.findUnique({
      where: { clientCode },
      include: {
        loyaltyCounter: true,
        visits: {
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
        vouchers: {
          where: { status: 'ACTIVE' },
          orderBy: { issuedAt: 'desc' },
        },
      },
    });
  }

  async findByWaId(waId: string) {
    return this.prisma.family.findUnique({
      where: { waId },
      include: {
        loyaltyCounter: true,
      },
    });
  }

  async findByPhone(phone: string) {
    return this.prisma.family.findUnique({
      where: { phone },
      include: {
        loyaltyCounter: true,
      },
    });
  }

  async findById(id: string) {
    return this.prisma.family.findUnique({
      where: { id },
      include: {
        loyaltyCounter: true,
        visits: {
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
        vouchers: {
          where: { status: 'ACTIVE' },
          orderBy: { issuedAt: 'desc' },
        },
      },
    });
  }

  async updateFamily(id: string, data: Partial<CreateFamilyDtoType>) {
    return this.prisma.family.update({
      where: { id },
      data,
    });
  }

  async searchFamilies(query: string) {
    return this.prisma.family.findMany({
      where: {
        OR: [
          { clientCode: { contains: query, mode: 'insensitive' } },
          { phone: { contains: query } },
          { waId: { contains: query } },
        ],
      },
      include: {
        loyaltyCounter: true,
      },
      take: 20,
      orderBy: { createdAt: 'desc' },
    });
  }
}
