import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import type { Language } from '@teddy/shared';

@Injectable()
export class MenuService {
  constructor(private prisma: PrismaService) { }

  async getMenu(lang: Language = 'EN') {
    const items = await this.prisma.menuItem.findMany({
      where: { isActive: true },
      orderBy: [
        { category: 'asc' },
        { priceCents: 'asc' },
      ],
    });

    const groupedByCategory = items.reduce((acc, item) => {
      if (!acc[item.category]) {
        acc[item.category] = [];
      }

      acc[item.category].push({
        id: item.id,
        sku: item.sku,
        name: lang === 'PT' ? item.namePt : item.nameEn,
        description: lang === 'PT' ? item.descPt : item.descEn,
        price: item.priceCents / 100, // Convert cents to euros
        category: item.category,
      });

      return acc;
    }, {});

    return {
      categories: Object.entries(groupedByCategory).map(([category, items]) => ({
        key: category.toLowerCase(),
        name: category,
        items,
      })),
      language: lang,
    };
  }

  async getMenuItem(id: string) {
    return this.prisma.menuItem.findUnique({
      where: { id },
    });
  }

  async createMenuItem(data: {
    sku: string;
    nameEn: string;
    namePt: string;
    descEn?: string;
    descPt?: string;
    priceCents: number;
    category: 'FOOD' | 'DRINKS';
  }) {
    return this.prisma.menuItem.create({
      data,
    });
  }

  async updateMenuItem(id: string, data: Partial<{
    nameEn: string;
    namePt: string;
    descEn: string;
    descPt: string;
    priceCents: number;
    category: 'FOOD' | 'DRINKS';
    isActive: boolean;
  }>) {
    return this.prisma.menuItem.update({
      where: { id },
      data,
    });
  }

  async deleteMenuItem(id: string) {
    return this.prisma.menuItem.delete({
      where: { id },
    });
  }
}
