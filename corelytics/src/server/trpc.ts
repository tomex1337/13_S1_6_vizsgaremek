import { initTRPC, TRPCError } from '@trpc/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { authOptions } from '@/lib/auth';

export const createContext = async () => {
  const session = await getServerSession(authOptions);
  return {
    prisma,
    session,
  };
};

const t = initTRPC.context<typeof createContext>().create();

export const router = t.router;
export const publicProcedure = t.procedure;

// Bejelentkezett felhasználó ellenőrzése
const isAuthed = t.middleware(({ ctx, next }) => {
  if (!ctx.session?.user) {
    throw new TRPCError({ code: 'UNAUTHORIZED' });
  }
  return next({
    ctx: {
      ...ctx,
      session: { ...ctx.session, user: ctx.session.user },
    },
  });
});

// Moderátori jogosultság ellenőrzése (permissionLevel >= 1)
const isModerator = t.middleware(async ({ ctx, next }) => {
  if (!ctx.session?.user) {
    throw new TRPCError({ code: 'UNAUTHORIZED' });
  }
  
  const user = await ctx.prisma.user.findUnique({
    where: { id: ctx.session.user.id },
    select: { permissionLevel: true }
  });
  
  if (!user || user.permissionLevel < 1) {
    throw new TRPCError({ 
      code: 'FORBIDDEN', 
      message: 'Nincs moderátori jogosultságod' 
    });
  }
  
  return next({
    ctx: {
      ...ctx,
      session: { ...ctx.session, user: ctx.session.user },
      permissionLevel: user.permissionLevel,
    },
  });
});

// Admin jogosultság ellenőrzése (permissionLevel >= 2)
const isAdmin = t.middleware(async ({ ctx, next }) => {
  if (!ctx.session?.user) {
    throw new TRPCError({ code: 'UNAUTHORIZED' });
  }
  
  const user = await ctx.prisma.user.findUnique({
    where: { id: ctx.session.user.id },
    select: { permissionLevel: true }
  });
  
  if (!user || user.permissionLevel < 2) {
    throw new TRPCError({ 
      code: 'FORBIDDEN', 
      message: 'Nincs admin jogosultságod' 
    });
  }
  
  return next({
    ctx: {
      ...ctx,
      session: { ...ctx.session, user: ctx.session.user },
      permissionLevel: user.permissionLevel,
    },
  });
});

export const protectedProcedure = t.procedure.use(isAuthed);
export const moderatorProcedure = t.procedure.use(isModerator);
export const adminProcedure = t.procedure.use(isAdmin);
