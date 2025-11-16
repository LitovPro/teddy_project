import { Body, Controller, Post } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDtoType } from '@teddy/shared';
import { handleError, handleSuccess } from '../common/utils';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('login')
  async login(@Body() dto: LoginDtoType) {
    try {
      const result = await this.authService.login(dto);
      return handleSuccess(result);
    } catch (error) {
      return handleError(error);
    }
  }
}
