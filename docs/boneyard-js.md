# boneyard-js

Boneyard JS is now wired into the VedaAI frontend so the app can use real DOM-derived skeleton loading states instead of hand-tuned gray boxes.

## How it fits this repo

1. `frontend/app/boneyard-provider.tsx` imports the generated registry once at app startup.
2. `frontend/app/page.tsx` uses a named skeleton for the dashboard stats and recent assignment cards.
3. `frontend/app/assignments/page.tsx` uses a named skeleton for the assignment grid.
4. The UI continues to use Lucide icons everywhere else, so the loading experience stays consistent with the rest of the app chrome.

## Install

```bash
cd frontend
npm install boneyard-js
```

## Quick start

```tsx
// frontend/app/boneyard-provider.tsx
'use client';

import './bones/registry';

export function BoneyardProvider() {
  return null;
}
```

```tsx
import { Skeleton } from 'boneyard-js/react';

<Skeleton
  name="blog-card"
  loading={isLoading}
  fixture={<BlogCard data={MOCK_DATA} />}
  fallback={<BlogCardSkeleton />}
>
  {data && <BlogCard data={data} />}
</Skeleton>
```

## Generate the bones

With the frontend dev server running:

```bash
npx boneyard-js build
```

The CLI scans the app, finds every named `Skeleton`, captures responsive bones, and writes the registry output for runtime.

## Fixture prop

Use `fixture` when real data is unavailable during capture. It only runs during the build-time snapshot phase and never ships to production.

```tsx
<Skeleton
  name="dashboard"
  loading={isLoading}
  fixture={<Dashboard data={{ title: 'Sample Title' }} />}
>
  {data && <Dashboard data={data} />}
</Skeleton>
```

## Excluding elements

Use `data-no-skeleton` on elements that should be ignored during capture.

```tsx
<nav data-no-skeleton>
  {/* excluded from capture */}
</nav>
```

## Notes

- The generated registry is meant to live in `frontend/app/bones/registry.ts`.
- `Skeleton` uses `loading`, `name`, `fixture`, and `fallback` to describe the real UI shape.
- Re-run `npx boneyard-js build` whenever the layout changes.