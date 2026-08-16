import { betterAuth } from 'better-auth';
import { prismaAdapter } from 'better-auth/adapters/prisma';
import { nextCookies } from 'better-auth/next-js';
import { prisma } from '@/lib/db';

const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';

const twitterId = process.env.TWITTER_CLIENT_ID;
const twitterSecret = process.env.TWITTER_CLIENT_SECRET;

export function isTwitterAuthEnabled() {
  return Boolean(twitterId && twitterSecret);
}

export const auth = betterAuth({
  baseURL: appUrl,
  secret: process.env.BETTER_AUTH_SECRET,
  database: prismaAdapter(prisma, {
    provider: 'postgresql',
  }),
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 8,
  },
  socialProviders: isTwitterAuthEnabled()
    ? {
        twitter: {
          clientId: twitterId as string,
          clientSecret: twitterSecret as string,
        },
      }
    : {},
  account: {
    accountLinking: {
      enabled: true,
      trustedProviders: ['twitter'],
    },
  },
  user: {
    additionalFields: {
      plan: {
        type: 'string',
        defaultValue: 'FREE',
        input: false,
      },
      planStatus: {
        type: 'string',
        required: false,
        input: false,
      },
    },
  },
  trustedOrigins: [appUrl],
  plugins: [nextCookies()],
});
