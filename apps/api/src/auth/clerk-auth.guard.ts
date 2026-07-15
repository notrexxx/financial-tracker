import { CanActivate, ExecutionContext, Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { clerkClient } from '@clerk/clerk-sdk-node';

@Injectable()
export class ClerkAuthGuard implements CanActivate {
  private readonly logger = new Logger(ClerkAuthGuard.name);

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      this.logger.warn('Authentication blocked: Missing or malformed Bearer token.');
      throw new UnauthorizedException('Missing authentication token');
    }

    const token = authHeader.split(' ')[1];

    try {
      const decoded = await clerkClient.verifyToken(token, {
        secretKey: process.env.CLERK_SECRET_KEY,
      } as any);
      
      request.user = { id: decoded.sub };
      return true;
    } catch (error) {
      this.logger.error('Authentication blocked: Token verification failed.', error);
      throw new UnauthorizedException('Invalid or expired authentication token');
    }
  }
}