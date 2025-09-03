import { prisma } from '@/lib/prisma';
import { inferAsyncReturnType } from '@trpc/server';
import { CreateNextContextOptions } from '@trpc/server/adapters/next';
import { getServerSession } from 'next-auth';
import { authOptions } from '../api/auth/nextauth/route';

export async function createContext(opts: CreateNextContextOptions) {
  const session = await getServerSession(opts.req, opts.res, authOptions);

  return {
    session,
    prisma,
  };
}

export type Context = inferAsyncReturnType<typeof createContext>;
