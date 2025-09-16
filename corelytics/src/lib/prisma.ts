import { PrismaClient } from '../generated/prisma';
import { withAccelerate } from '@prisma/extension-accelerate'

declare global {
  var prisma: PrismaClient | undefined;
}

export const prisma = new PrismaClient().$extends(withAccelerate());
