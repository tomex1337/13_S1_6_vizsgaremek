import NextAuth from 'next-auth';
import { type AuthOptions } from 'next-auth';
import { PrismaAdapter } from '@auth/prisma-adapter';
import { prisma } from '@/lib/prisma';

export const authOptions: AuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    // Add your providers here
  ],
  session: {
    strategy: 'jwt',
  },
  callbacks: {
    session: ({ session, user }) => ({
      ...session,
      user: {
        ...session.user,
        id: user.id,
      },
    }),
  },
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
