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

## Running on Android Emulator

To run the app on an Android emulator during development:

1. **Start the Next.js development server** (in a separate terminal):
   ```bash
   npm run dev
   ```
   Make sure the server is running on `http://localhost:3000`

2. **Sync and open Android Studio**:
   ```bash
   npm run android:dev
   ```

3. **Run the app** from Android Studio on your emulator

**Important**: The Android emulator connects to your host machine's localhost via `10.0.2.2`. The Capacitor config is already set up to use this address for development.

### Troubleshooting
- Make sure the Next.js dev server is running before launching the Android app
- Check that your emulator is running and accessible
- Verify that port 3000 is not blocked by a firewall

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
