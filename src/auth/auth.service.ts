import { ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';
import type { RegisterDto } from './dto/register.dto';
import type { LoginDto } from './dto/login.dto';
import type { Session } from './session.interface';

const SALT_ROUNDS = 10;

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  private toSession(user: { id: string; name: string; email: string }): Session {
    return { id: user.id, name: user.name, email: user.email };
  }

  signToken(session: Session): string {
    return this.jwtService.sign({
      sub: session.id,
      name: session.name,
      email: session.email,
    });
  }

  async register(dto: RegisterDto): Promise<{ session: Session; token: string }> {
    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (existing) {
      throw new ConflictException('An account with that email already exists.');
    }
    const hashed = await bcrypt.hash(dto.password, SALT_ROUNDS);
    const user = await this.prisma.user.create({
      data: { name: dto.name, email: dto.email, password: hashed },
    });
    const session = this.toSession(user);
    return { session, token: this.signToken(session) };
  }

  async login(dto: LoginDto): Promise<{ session: Session; token: string }> {
    const user = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (!user) {
      throw new UnauthorizedException('Incorrect email or password.');
    }
    const matches = await bcrypt.compare(dto.password, user.password);
    if (!matches) {
      throw new UnauthorizedException('Incorrect email or password.');
    }
    const session = this.toSession(user);
    return { session, token: this.signToken(session) };
  }
}
