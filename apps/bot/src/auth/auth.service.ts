import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as argon2 from 'argon2';

import { PrismaService } from '../prisma/prisma.service';
import { LoginDtoType } from '@teddy/shared';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) { }

  async login(dto: LoginDtoType) {
    const staff = await this.prisma.staff.findUnique({
      where: { email: dto.email },
    });

    if (!staff) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Verify password using argon2
    const isPasswordValid = await argon2.verify(staff.passwordHash, dto.password);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const payload = {
      sub: staff.id,
      email: staff.email,
      role: staff.role,
    };

    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: staff.id,
        email: staff.email,
        name: staff.name,
        role: staff.role,
      },
    };
  }

  async validateUser(userId: string) {
    return this.prisma.staff.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
      },
    });
  }
}
