import { Controller, All, Req, Res, Inject } from '@nestjs/common';
import type { Request, Response as ExpressResponse } from 'express';

import { BETTER_AUTH } from './auth.constants';

@Controller('api/auth')
export class BetterAuthProxyController {
  constructor(@Inject(BETTER_AUTH) private readonly auth: any) {}

  @All('*')
  async proxy(@Req() req: Request, @Res() res: ExpressResponse) {
    const protocol =
      (req.headers['x-forwarded-proto'] as string) || req.protocol;
    const host = req.get('host');
    const url = `${protocol}://${host}${req.originalUrl}`;

    const headers = new Headers();
    Object.entries(req.headers).forEach(([key, value]) => {
      if (typeof value === 'undefined') return;
      if (Array.isArray(value)) headers.set(key, value.join(','));
      else headers.set(key, String(value));
    });

    const method = req.method.toUpperCase();
    const hasBody = method !== 'GET' && method !== 'HEAD';

    const body = await (async () => {
      if (!hasBody) return undefined;
      const chunks: Buffer[] = [];
      await new Promise<void>((resolve, reject) => {
        req.on('data', (chunk) =>
          chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)),
        );
        req.on('end', () => resolve());
        req.on('error', reject);
      });
      return Buffer.concat(chunks);
    })();

    const request = new Request(url, { method, headers, body });
    const response = await this.auth.handler(request as any);

    // Check if this is a successful OAuth callback and redirect to web app
    if (
      req.originalUrl.includes('/callback/github') &&
      response.status === 302
    ) {
      const location = response.headers.get('location');
      if (
        location &&
        (location === 'http://localhost:8090' ||
          location === 'http://localhost:8090/')
      ) {
        // Redirect to web app instead of API server
        return res.redirect('http://localhost:3001');
      }
    }

    res.status(response.status);
    response.headers.forEach((value, key) => res.setHeader(key, value));
    const arrayBuffer = await response.arrayBuffer();
    res.send(Buffer.from(arrayBuffer));
  }
}
