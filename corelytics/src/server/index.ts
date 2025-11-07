import { router, publicProcedure, protectedProcedure } from './trpc';
import { z } from 'zod';
import { Decimal } from '@prisma/client/runtime/library';

// Helper function to calculate daily nutritional goals
function calculateDailyGoals(
  age: number,
  gender: string,
  heightCm: number,
  weightKg: number,
  activityLevelId: number,
  goalId: number
) {
  // Calculate BMR (Basal Metabolic Rate) using Mifflin-St Jeor Equation
  let bmr: number;
  
  if (gender === 'male') {
    bmr = 10 * weightKg + 6.25 * heightCm - 5 * age + 5;
  } else if (gender === 'female') {
    bmr = 10 * weightKg + 6.25 * heightCm - 5 * age - 161;
  } else {
    bmr = 10 * weightKg + 6.25 * heightCm - 5 * age - 78;
  }

  // Activity level multipliers
  const activityMultipliers: { [key: number]: number } = {
    1: 1.2,    // Sedentary
    2: 1.375,  // Lightly active
    3: 1.55,   // Moderately active
    4: 1.725,  // Very active
  };

  const activityMultiplier = activityMultipliers[activityLevelId] || 1.2;
  const tdee = bmr * activityMultiplier;

  // Adjust based on goal
  let caloriesGoal: number;
  if (goalId === 1) {
    caloriesGoal = tdee - 500; // Weight loss
  } else if (goalId === 3) {
    caloriesGoal = tdee + 500; // Weight gain
  } else {
    caloriesGoal = tdee; // Maintain
  }

  // Ensure minimum calories
  const minCalories = gender === 'female' ? 1200 : gender === 'male' ? 1500 : 1350;
  caloriesGoal = Math.max(caloriesGoal, minCalories);

  // Calculate macros
  const proteinGoal = weightKg * 1.8;
  const fatCalories = caloriesGoal * 0.30;
  const fatGoal = fatCalories / 9;
  const proteinCalories = proteinGoal * 4;
  const remainingCalories = caloriesGoal - proteinCalories - fatCalories;
  const carbsGoal = remainingCalories / 4;

  return {
    caloriesGoal: Math.round(caloriesGoal),
    proteinGoal: Math.round(proteinGoal),
    fatGoal: Math.round(fatGoal),
    carbsGoal: Math.round(carbsGoal),
  };
}

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
        const startOfDay = new Date(today);
        startOfDay.setHours(0, 0, 0, 0);
        
        const endOfDay = new Date(today);
        endOfDay.setHours(23, 59, 59, 999);
        
        const todayFoodLogs = await ctx.prisma.userFoodLog.findMany({
          where: {
            userId,
            logDate: {
              gte: startOfDay,
              lte: endOfDay
            }
          },
          include: {
            foodItem: true,
          },
        });

        // Get user profile to check if it's complete
        const userProfile = await ctx.prisma.userProfile.findUnique({
          where: { userId },
        });

        // Get today's daily goal
        let dailyGoal = await ctx.prisma.dailyGoal.findUnique({
          where: {
            userId_date: {
              userId,
              date: today,
            },
          },
        });

        // If no daily goal exists and profile is complete, create one
        if (!dailyGoal && userProfile) {
          const isProfileComplete = !!(
            userProfile.age &&
            userProfile.gender &&
            userProfile.heightCm &&
            userProfile.weightKg &&
            userProfile.activityLevelId &&
            userProfile.goalId
          );

          if (isProfileComplete) {
            const goals = calculateDailyGoals(
              userProfile.age!,
              userProfile.gender!,
              userProfile.heightCm!,
              Number(userProfile.weightKg!),
              userProfile.activityLevelId!,
              userProfile.goalId!
            );

            dailyGoal = await ctx.prisma.dailyGoal.create({
              data: {
                userId,
                date: today,
                caloriesGoal: goals.caloriesGoal,
                proteinGoal: new Decimal(goals.proteinGoal),
                fatGoal: new Decimal(goals.fatGoal),
                carbsGoal: new Decimal(goals.carbsGoal),
              },
            });
          }
        }

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
            createdAt: {
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
            createdAt: {
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
          const logCalories = Number(calories) * Number(quantity);
          return total + logCalories;
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

        // Get total workouts count for this week (same as workoutsCompleted)
        const totalWorkouts = weekExerciseLogs.length;

        // Calculate average calories per day (last 7 days)
        const last7Days = new Date(today);
        last7Days.setDate(today.getDate() - 6); // Include today + 6 previous days
        
        const weeklyFoodLogs = await ctx.prisma.userFoodLog.findMany({
          where: {
            userId,
            logDate: {
              gte: last7Days,
              lte: today,
            },
          },
          include: {
            foodItem: true,
          },
        });

        // Group calories by date and calculate daily totals
        const dailyCalories: { [key: string]: number } = {};
        
        weeklyFoodLogs.forEach(log => {
          if (log.logDate) {
            const dateKey = log.logDate.toISOString().split('T')[0];
            const calories = Number(log.foodItem.calories || 0) * Number(log.quantity || 1);
            dailyCalories[dateKey] = (dailyCalories[dateKey] || 0) + calories;
          }
        });

        // Calculate average (only count days with logged food)
        const daysWithLogs = Object.keys(dailyCalories).length;
        const totalCalories = Object.values(dailyCalories).reduce((sum, cal) => sum + cal, 0);
        const avgCaloriesPerDay = daysWithLogs > 0 ? Math.round(totalCalories / daysWithLogs) : 0;

        // Calculate protein consumed today
        const proteinConsumed = todayFoodLogs.reduce((total, log) => {
          const protein = log.foodItem.protein || 0;
          const quantity = log.quantity || 1;
          const logProtein = Number(protein) * Number(quantity);
          return total + logProtein;
        }, 0);

        // Calculate goals met percentage (last 7 days)
        // Get daily goals for the last 7 days
        const last7DaysGoals = await ctx.prisma.dailyGoal.findMany({
          where: {
            userId,
            date: {
              gte: last7Days,
              lte: today,
            },
          },
        });

        let daysMetGoal = 0;
        const calorieGoalsByDate: { [key: string]: number } = {};
        
        last7DaysGoals.forEach(goal => {
          const dateKey = goal.date.toISOString().split('T')[0];
          calorieGoalsByDate[dateKey] = Number(goal.caloriesGoal || 2000);
        });

        // Check each day if calorie goal was met
        Object.keys(dailyCalories).forEach(dateKey => {
          const caloriesForDay = dailyCalories[dateKey];
          const goalForDay = calorieGoalsByDate[dateKey] || Number(dailyGoal?.caloriesGoal || 2000);
          
          // Consider goal met if within 10% of target (not over and not too far under)
          const minCalories = goalForDay * 0.9;
          const maxCalories = goalForDay * 1.1;
          
          if (caloriesForDay >= minCalories && caloriesForDay <= maxCalories) {
            daysMetGoal++;
          }
        });

        const goalsMetPercentage = daysWithLogs > 0 
          ? Math.round((daysMetGoal / daysWithLogs) * 100)
          : 0;

        return {
          caloriesConsumed: Math.round(caloriesConsumed),
          caloriesTarget: dailyGoal?.caloriesGoal || 2000,
          proteinConsumed: Math.round(proteinConsumed),
          proteinTarget: dailyGoal?.proteinGoal || 150, // Default protein goal
          fatTarget: dailyGoal?.fatGoal || 65, // Default fat goal
          carbsTarget: dailyGoal?.carbsGoal || 250, // Default carbs goal
          workoutsCompleted: weekExerciseLogs.length,
          weeklyGoal: 5, // Default weekly goal
          currentStreak,
          totalWorkouts,
          avgCaloriesPerDay,
          goalsMetPercentage,
          recentActivities: [
            ...recentExerciseLogs.map(log => ({
              id: log.id,
              type: 'exercise' as const,
              name: log.exercise?.name || 'Workout',
              time: `${log.durationMinutes || 0} minutes`,
              calories: `${Math.round(Number(log.caloriesBurned || 0))} cal`,
              date: log.createdAt || log.logDate || new Date(),
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
              calories: `${Math.round(Number(log.foodItem?.calories || 0) * Number(log.quantity || 1))} cal`,
              date: log.createdAt || log.logDate || new Date(),
            })),
          ]
          .filter(activity => activity.date) // Only include activities with valid dates
          .sort((a, b) => {
            const dateA = new Date(a.date).getTime();
            const dateB = new Date(b.date).getTime();
            return dateB - dateA;
          })
          .slice(0, 4),
        };
      }),
  }),
  food: router({
    search: protectedProcedure
      .input(z.object({ 
        query: z.string().min(1),
        limit: z.number().optional().default(20)
      }))
      .query(async ({ input, ctx }) => {
        const foods = await ctx.prisma.foodItem.findMany({
          where: {
            OR: [
              { name: { contains: input.query, mode: 'insensitive' } },
              { brand: { contains: input.query, mode: 'insensitive' } }
            ]
          },
          take: input.limit,
          orderBy: [
            { isCustom: 'asc' }, // Show non-custom foods first
            { name: 'asc' }
          ]
        });
        
        return foods;
      }),
    
    logFood: protectedProcedure
      .input(z.object({
        foodItemId: z.string(),
        mealTypeId: z.number(),
        quantity: z.number().positive(),
        logDate: z.string().optional()
      }))
      .mutation(async ({ input, ctx }) => {
        const userId = ctx.session.user.id;
        const logDate = input.logDate ? new Date(input.logDate) : new Date();
        
        const foodLog = await ctx.prisma.userFoodLog.create({
          data: {
            id: crypto.randomUUID(),
            userId,
            foodItemId: input.foodItemId,
            mealTypeId: input.mealTypeId,
            quantity: input.quantity,
            logDate,
            createdAt: new Date()
          },
          include: {
            foodItem: true,
            mealType: true
          }
        });
        
        return foodLog;
      }),
    
    getDailyLogs: protectedProcedure
      .input(z.object({
        date: z.string().optional()
      }))
      .query(async ({ input, ctx }) => {
        const userId = ctx.session.user.id;
        const targetDate = input.date ? new Date(input.date) : new Date();
        
        // Set to start and end of day
        const startOfDay = new Date(targetDate);
        startOfDay.setHours(0, 0, 0, 0);
        
        const endOfDay = new Date(targetDate);
        endOfDay.setHours(23, 59, 59, 999);
        
        const logs = await ctx.prisma.userFoodLog.findMany({
          where: {
            userId,
            logDate: {
              gte: startOfDay,
              lte: endOfDay
            }
          },
          include: {
            foodItem: true,
            mealType: true
          },
          orderBy: [
            { mealTypeId: 'asc' },
            { createdAt: 'asc' }
          ]
        });
        
        return logs;
      }),
    
    deleteLog: protectedProcedure
      .input(z.object({
        logId: z.string()
      }))
      .mutation(async ({ input, ctx }) => {
        const userId = ctx.session.user.id;
        
        // Verify the log belongs to the user
        const log = await ctx.prisma.userFoodLog.findFirst({
          where: {
            id: input.logId,
            userId
          }
        });
        
        if (!log) {
          throw new Error('Food log not found or access denied');
        }
        
        await ctx.prisma.userFoodLog.delete({
          where: { id: input.logId }
        });
        
        return { success: true };
      }),
    
    updateLogQuantity: protectedProcedure
      .input(z.object({
        logId: z.string(),
        quantity: z.number().positive()
      }))
      .mutation(async ({ input, ctx }) => {
        const userId = ctx.session.user.id;
        
        // Verify the log belongs to the user
        const log = await ctx.prisma.userFoodLog.findFirst({
          where: {
            id: input.logId,
            userId
          }
        });
        
        if (!log) {
          throw new Error('Food log not found or access denied');
        }
        
        const updatedLog = await ctx.prisma.userFoodLog.update({
          where: { id: input.logId },
          data: { quantity: input.quantity },
          include: {
            foodItem: true,
            mealType: true
          }
        });
        
        return updatedLog;
      }),
    
    getMealTypes: publicProcedure
      .query(async ({ ctx }) => {
        const mealTypes = await ctx.prisma.mealType.findMany({
          orderBy: { id: 'asc' }
        });
        
        return mealTypes;
      }),
    
    createCustomFood: protectedProcedure
      .input(z.object({
        name: z.string().min(1),
        brand: z.string().optional(),
        servingSizeGrams: z.number().positive().optional(),
        calories: z.number().nonnegative().optional(),
        protein: z.number().nonnegative().optional(),
        fat: z.number().nonnegative().optional(),
        carbs: z.number().nonnegative().optional(),
        fiber: z.number().nonnegative().optional(),
        sugar: z.number().nonnegative().optional(),
        sodium: z.number().nonnegative().optional()
      }))
      .mutation(async ({ input, ctx }) => {
        const userId = ctx.session.user.id;
        
        const customFood = await ctx.prisma.foodItem.create({
          data: {
            id: crypto.randomUUID(),
            name: input.name,
            brand: input.brand,
            servingSizeGrams: input.servingSizeGrams,
            calories: input.calories,
            protein: input.protein,
            fat: input.fat,
            carbs: input.carbs,
            fiber: input.fiber,
            sugar: input.sugar,
            sodium: input.sodium,
            isCustom: true,
            createdBy: userId
          }
        });
        
        return customFood;
      })
  }),
});

export type AppRouter = typeof appRouter;
