import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { FamiliesService } from './families.service';
import { CreateFamilyDtoType } from '@teddy/shared';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { handleError, handleSuccess } from '../common/utils';

@Controller('families')
@UseGuards(JwtAuthGuard)
export class FamiliesController {
  constructor(private familiesService: FamiliesService) {}

  @Post()
  async createFamily(@Body() dto: CreateFamilyDtoType) {
    try {
      const family = await this.familiesService.createFamily(dto);
      return handleSuccess(family);
    } catch (error) {
      return handleError(error);
    }
  }

  @Get('search')
  async searchFamilies(@Query('q') query: string) {
    try {
      const families = await this.familiesService.searchFamilies(query);
      return handleSuccess(families);
    } catch (error) {
      return handleError(error);
    }
  }

  @Get(':id')
  async getFamily(@Param('id') id: string) {
    try {
      const family = await this.familiesService.findById(id);
      if (!family) {
        return handleError(new Error('Family not found'));
      }
      return handleSuccess(family);
    } catch (error) {
      return handleError(error);
    }
  }
}
