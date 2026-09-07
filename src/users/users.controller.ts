import { Body, Controller, Patch, Res, UseGuards } from '@nestjs/common';
import type { Response } from 'express';
import { UsersService } from './users.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { AuthService } from '../auth/auth.service';
import { setSessionCookie } from '../auth/cookie.util';
import type { Session } from '../auth/session.interface';

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly authService: AuthService,
  ) {}

  @Patch('me')
  async updateProfile(
    @CurrentUser() user: Session,
    @Body() dto: UpdateProfileDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<Session> {
    const session = await this.usersService.updateProfile(user.id, dto);
    setSessionCookie(res, this.authService.signToken(session));
    return session;
  }

  @Patch('me/password')
  async changePassword(
    @CurrentUser() user: Session,
    @Body() dto: ChangePasswordDto,
  ): Promise<{ ok: boolean }> {
    const ok = await this.usersService.changePassword(user.id, dto);
    return { ok };
  }
}
