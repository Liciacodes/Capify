# Capify — WhatsApp Caption Generator

Capify is a small Next.js app that generates shareable captions for images using a server-side AI captioning API. Upload an image and the app will return multiple caption options you can copy or share to WhatsApp.

This README explains how to run the project locally, how the caption API works, and a few tips for development and deployment.

## Quick start

Prerequisites:
- Node.js 18+ (recommended) or compatible runtime
- npm, pnpm, or yarn

Install dependencies:

```bash
npm install
# or
pnpm install
# or
yarn
```

Run the development server:

```bash
npm run dev
# or
pnpm dev
# or
yarn dev
```

Open http://localhost:3000 in your browser.

## Project structure (key files)

- `src/app/page.tsx` — main app entry point / page UI
- `src/components/ImageCaptionGenerator.tsx` — client component that handles image upload, UX, and displaying parsed caption options
- `src/app/api/caption/route.ts` — server-side API route that forwards the uploaded image to the AI model and returns caption text
- `src/app/globals.css` — global styles + a few utility classes used by the component
- `public/` — static assets

## How the caption flow works

1. User uploads an image using the `ImageCaptionGenerator` UI.
2. The client converts the image to base64 and POSTs it to `/api/caption`.
3. The server-side route (`/api/caption`) sends the image to the configured AI model (via Google Generative AI in this project) and returns textual caption suggestions.
4. The client parses the returned text into separate caption options, displays them, and provides Copy/Share controls for each option.

## Environment variables

The project uses a Google service account JSON key for the Generative AI API. Add it to the project as a file named `google-service-account.json` at the repository root (this repo already includes it). Do not commit production keys to public repos.

If you need to configure other environment-specific values, use a `.env.local` file. Example:

```env
# Optional: set NEXT_PUBLIC_API_BASE or other flags
```

## Build & production

Build the production app:

```bash
npm run build
```

Start the production server locally (after build):

```bash
npm start
```

## Common tasks and tips

- Replace the `<img>` tag in `ImageCaptionGenerator.tsx` with Next's `next/image` for optimized loading and to satisfy Next.js linting.
- Consider replacing the small toast implementation with a production-ready library such as `react-hot-toast` for better visuals and accessibility.
- If the AI responses include UI tokens (for example, `📋 Copy` or `💬 Share`), the component includes parsing logic to strip those out before rendering. If you see mis-parsed items, open `parseCaption` in `ImageCaptionGenerator.tsx` and adjust heuristics.

## Deployment

The easiest deployment is to Vercel. Connect the repository and the platform will detect Next.js and configure the build. Make sure to add any service-account secrets in Vercel's dashboard if you deploy there.

## Troubleshooting

- Build fails with ESLint complaints about `any`: fix catch handlers to avoid `any` (use `unknown` and runtime checks).
- Next warns about `<img>`: migrate to `next/image`.
- If the AI API responds slowly, add timeout handling or increase client-side loading feedback.

## Contributing

PRs welcome. Keep changes focused, add tests for parsing logic if possible, and avoid committing secret keys.

---
If you'd like, I can also:
- Convert the toast to `react-hot-toast` and wire it up.
- Replace `<img>` with `next/image` and adjust styles.
- Add a small development script for running the app with mocked API responses for offline testing.
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
