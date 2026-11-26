# personal-website

getadev.xyz: Andrew Polovets, Product Engineer. Static Next.js site with three sections: `/`, `/experience`, `/products` (+ `/products/[slug]`).

## Content

All copy lives in typed files under `src/data/`; pages only render it.

- `experience.ts`: roles (newest first). Drives `/experience`, the "Worked at" marquee and Home metrics. A highlight with `verified: false` is never rendered.
- `profile.ts`: hero, About, contact, and Home metrics (`experienceId` + `highlightIndex` refs into `experience.ts`).
- `products.ts`: products by tier (`featured`, `secondary`, `compact`). An empty `links` array renders no link block.

## Env

- `NEXT_PUBLIC_PERSONAL_WEBSITE_CONTACT_EMAIL`: email for the contact block (row hidden when empty).
- `NEXT_PUBLIC_SITE_URL`: canonical origin, default `https://getadev.xyz`.

## Dev

```bash
pnpm dev:personal-website
```

Old URLs `/home`, `/projects`, `/projects/[slug]` redirect (301) to `/`, `/products`, `/products/[slug]`.
