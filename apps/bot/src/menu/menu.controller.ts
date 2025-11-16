import { Controller, Get, Post, Put, Delete, Query, Param, Body, UseGuards } from '@nestjs/common';
import { MenuService } from './menu.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import type { Language } from '@teddy/shared';
import { handleError, handleSuccess } from '../common/utils';

@Controller('menu')
export class MenuController {
  constructor(private menuService: MenuService) { }

  @Get()
  async getMenu(@Query('lang') lang?: Language) {
    try {
      const menu = await this.menuService.getMenu(lang || 'EN');
      return handleSuccess(menu);
    } catch (error) {
      return handleError(error);
    }
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  async createMenuItem(@Body() data: any) {
    try {
      const menuItem = await this.menuService.createMenuItem(data);
      return handleSuccess(menuItem);
    } catch (error) {
      return handleError(error);
    }
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard)
  async updateMenuItem(@Param('id') id: string, @Body() data: any) {
    try {
      const menuItem = await this.menuService.updateMenuItem(id, data);
      return handleSuccess(menuItem);
    } catch (error) {
      return handleError(error);
    }
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  async deleteMenuItem(@Param('id') id: string) {
    try {
      await this.menuService.deleteMenuItem(id);
      return handleSuccess({ message: 'Menu item deleted successfully' });
    } catch (error) {
      return handleError(error);
    }
  }
}
