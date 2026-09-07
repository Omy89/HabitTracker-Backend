import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import type { Request } from 'express';
import type { JwtPayload, Session } from './session.interface';

export interface AuthenticatedRequest extends Request {
  user: Session;
}

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private readonly jwtService: JwtService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const token: string | undefined = request.cookies?.token;
    if (!token) {
      throw new UnauthorizedException('No active session.');
    }
    try {
      const payload = this.jwtService.verify<JwtPayload>(token);
      request.user = { id: payload.sub, name: payload.name, email: payload.email };
      return true;
    } catch {
      throw new UnauthorizedException('Session expired or invalid.');
    }
  }
}
