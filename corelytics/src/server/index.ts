import { router, publicProcedure } from './trpc';
import { z } from 'zod';

export const appRouter = router({
  hello: router({
    world: publicProcedure
      .input(z.object({ text: z.string() }))
      .query(({ input }) => {
        return {
          greeting: `Hello ${input.text}!`,
        };
      }),
  }),
});

export type AppRouter = typeof appRouter;
