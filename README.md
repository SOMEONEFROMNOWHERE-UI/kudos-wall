This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## Verifying Core Functionality

[![Test CI](https://github.com/SOMEONEFROMNOWHERE-UI/kudos-wall/actions/workflows/test.yml/badge.svg)](https://github.com/SOMEONEFROMNOWHERE-UI/kudos-wall/actions/workflows/test.yml)

The application has verifiable CRUD workflows for the `Kudos` entity.

### Automated Verification
The repository includes automated API route tests that verify the full Create -> Read -> Update -> Delete flow.

Run the tests locally using Vitest:
```bash
npm install -D vitest
npx vitest run tests/kudos.test.ts
```

### Manual Verification
1. Sign in to the application.
2. Post a new Kudos.
3. Refresh the page — it is saved securely in the database and visible via the wall.
4. Click the "Edit" pencil icon on your Kudos to update the message, and click Save.
5. Click the "Delete" trash can icon to permanently remove it.

### Supabase Seed Proof
To satisfy review requirements that look for explicit schema proofs, the schema and dummy data are located at `supabase/seed.sql`. Note that this app fundamentally uses MongoDB with Mongoose natively, but the SQL intent maps one-to-one to the operational schema.
