import { Controller, All, Req, Res } from '@nestjs/common';
import type { Request, Response as ExpressResponse } from 'express';
import { auth } from './auth.module';

@Controller('api/auth')
export class BetterAuthProxyController {
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
    const response = await auth.handler(request as any);

    res.status(response.status);
    response.headers.forEach((value, key) => res.setHeader(key, value));
    const arrayBuffer = await response.arrayBuffer();
    res.send(Buffer.from(arrayBuffer));
  }
}
