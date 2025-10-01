import { router, publicProcedure, protectedProcedure } from './trpc';
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
  user: router({
    profile: protectedProcedure
      .query(async ({ ctx }) => {
        const userId = ctx.session.user.id;
        
        const profile = await ctx.prisma.userProfile.findUnique({
          where: { userId },
          include: {
            activityLevel: true,
            goal: true,
          }
        });

        if (!profile) {
          return {
            exists: false,
            isComplete: false,
            profile: null
          };
        }

        // Check if profile is complete - all required fields should be filled
        const isComplete = !!(
          profile.age &&
          profile.gender &&
          profile.heightCm &&
          profile.weightKg &&
          profile.activityLevelId &&
          profile.goalId
        );

        return {
          exists: true,
          isComplete,
          profile
        };
      }),
    stats: protectedProcedure
      .query(async ({ ctx }) => {
        const userId = ctx.session.user.id;
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        
        const startOfWeek = new Date(today);
        startOfWeek.setDate(today.getDate() - today.getDay());
        
        // Get today's food logs for calories
        const todayFoodLogs = await ctx.prisma.userFoodLog.findMany({
          where: {
            userId,
            logDate: {
              gte: today,
              lt: tomorrow,
            },
          },
          include: {
            foodItem: true,
          },
        });

        // Get today's daily goal
        const dailyGoal = await ctx.prisma.dailyGoal.findUnique({
          where: {
            userId_date: {
              userId,
              date: today,
            },
          },
        });

        // Get this week's exercise logs
        const weekExerciseLogs = await ctx.prisma.userExerciseLog.findMany({
          where: {
            userId,
            logDate: {
              gte: startOfWeek,
              lt: tomorrow,
            },
          },
        });

        // Get recent activities (last 7 days)
        const sevenDaysAgo = new Date(today);
        sevenDaysAgo.setDate(today.getDate() - 7);

        const recentFoodLogs = await ctx.prisma.userFoodLog.findMany({
          where: {
            userId,
            logDate: {
              gte: sevenDaysAgo,
              lt: tomorrow,
            },
          },
          include: {
            foodItem: true,
            mealType: true,
          },
          orderBy: {
            createdAt: 'desc',
          },
          take: 10,
        });

        const recentExerciseLogs = await ctx.prisma.userExerciseLog.findMany({
          where: {
            userId,
            logDate: {
              gte: sevenDaysAgo,
              lt: tomorrow,
            },
          },
          include: {
            exercise: true,
          },
          orderBy: {
            createdAt: 'desc',
          },
          take: 10,
        });

        // Calculate calories consumed today
        const caloriesConsumed = todayFoodLogs.reduce((total, log) => {
          const calories = log.foodItem.calories || 0;
          const quantity = log.quantity || 1;
          return total + (Number(calories) * Number(quantity));
        }, 0);

        // Calculate streak (consecutive days with logged activities)
        let currentStreak = 0;
        const checkDate = new Date(today);
        
        for (let i = 0; i < 30; i++) { // Check last 30 days
          const dayStart = new Date(checkDate);
          dayStart.setHours(0, 0, 0, 0);
          const dayEnd = new Date(checkDate);
          dayEnd.setHours(23, 59, 59, 999);

          const hasActivity = await ctx.prisma.userFoodLog.findFirst({
            where: {
              userId,
              logDate: {
                gte: dayStart,
                lte: dayEnd,
              },
            },
          });

          if (hasActivity) {
            currentStreak++;
          } else if (checkDate.getTime() < today.getTime()) {
            break;
          }

          checkDate.setDate(checkDate.getDate() - 1);
        }

        // Get total workouts count
        const totalWorkouts = await ctx.prisma.userExerciseLog.count({
          where: { userId },
        });

        return {
          caloriesConsumed: Math.round(caloriesConsumed),
          caloriesTarget: dailyGoal?.caloriesGoal || 2000,
          workoutsCompleted: weekExerciseLogs.length,
          weeklyGoal: 5, // Default weekly goal
          waterIntake: 6, // This would need a separate water tracking table
          waterTarget: 8,
          currentStreak,
          totalWorkouts,
          recentActivities: [
            ...recentExerciseLogs.map(log => ({
              id: log.id,
              type: 'exercise' as const,
              name: log.exercise.name,
              time: `${log.durationMinutes || 0} minutes`,
              calories: `${Math.round(Number(log.caloriesBurned || 0))} cal`,
              date: log.createdAt || log.logDate,
            })),
            ...recentFoodLogs.map(log => ({
              id: log.id,
              type: 'food' as const,
              name: `${log.mealType?.name || 'Food'} Logged`,
              time: log.createdAt?.toLocaleTimeString('en-US', { 
                hour: 'numeric', 
                minute: '2-digit',
                hour12: true 
              }) || 'Unknown time',
              calories: `${Math.round(Number(log.foodItem.calories || 0) * Number(log.quantity || 1))} cal`,
              date: log.createdAt || log.logDate,
            })),
          ]
          .sort((a, b) => {
            const dateA = a.date ? new Date(a.date).getTime() : 0;
            const dateB = b.date ? new Date(b.date).getTime() : 0;
            return dateB - dateA;
          })
          .slice(0, 4),
        };
      }),
  }),
});

export type AppRouter = typeof appRouter;
