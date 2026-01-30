import { router, publicProcedure, protectedProcedure, moderatorProcedure, adminProcedure } from './trpc';
import { z } from 'zod';
import { Decimal } from '@prisma/client/runtime/library';

// Segédfüggvény az életkor kiszámításához a születési dátumból
function calculateAge(birthDate: Date): number {
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  
  return age;
}

// Segédfüggvény a napi táplálkozási célok kiszámításához
function calculateDailyGoals(
  age: number,
  gender: string,
  heightCm: number,
  weightKg: number,
  activityLevelId: number,
  goalId: number
) {
  // BMR (Alapanyagcsere) számítása a Mifflin-St Jeor egyenlet alapján
  let bmr: number;
  
  if (gender === 'male') {
    bmr = 10 * weightKg + 6.25 * heightCm - 5 * age + 5;
  } else if (gender === 'female') {
    bmr = 10 * weightKg + 6.25 * heightCm - 5 * age - 161;
  } else {
    bmr = 10 * weightKg + 6.25 * heightCm - 5 * age - 78;
  }

  // Aktivitási szint szorzók
  const activityMultipliers: { [key: number]: number } = {
    2: 1.2,    // Ülő életmód
    4: 1.375,  // Enyhén aktív
    3: 1.55,   // Mérsékelten aktív
    1: 1.725,  // Nagyon aktív
  };

  const activityMultiplier = activityMultipliers[activityLevelId] || 1.2;
  const tdee = bmr * activityMultiplier;

  // Cél alapján módosítás
  let caloriesGoal: number;
  if (goalId === 3) {
    caloriesGoal = tdee - 500; // Fogyás
  } else if (goalId === 1) {
    caloriesGoal = tdee + 500; // Hízás
  } else {
    caloriesGoal = tdee; // Súlytartás
  }

  // Minimális kalória biztosítása
  const minCalories = gender === 'female' ? 1200 : gender === 'male' ? 1500 : 1350;
  caloriesGoal = Math.max(caloriesGoal, minCalories);

  // Makrók számítása
  let proteinMultiplier = 0.8; // Alap ülő életmódhoz
  
  // Aktivitási szint alapján módosítás
  if (activityLevelId === 4) {
    proteinMultiplier += 0.4; // Enyhén aktív
  } else if (activityLevelId === 3) {
    proteinMultiplier += 0.6; // Mérsékelten aktív
  } else if (activityLevelId === 1) {
    proteinMultiplier += 1.0; // Nagyon aktív
  }
  
  // Cél alapján módosítás
  if (goalId === 3) {
    proteinMultiplier += 0.2; // Fogyás - izomtömeg megőrzése
  } else if (goalId === 1) {
    proteinMultiplier += 0.4; // Hízás - izomépítés
  }
  
  const proteinGoal = weightKg * proteinMultiplier;
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
          where: { user_id: userId },
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

        // Profil teljesség ellenőrzése - minden kötelező mező legyen kitöltve
        const isComplete = !!(
          profile.birthDate &&
          profile.gender &&
          profile.heightCm &&
          profile.weightKg &&
          profile.activityLevel_id &&
          profile.goal_id
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
        
        // Hét kezdetének számítása (hétfő)
        const startOfWeek = new Date(today);
        const dayOfWeek = today.getDay();
        const daysToSubtract = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // Hétfő = 0 nap vissza
        startOfWeek.setDate(today.getDate() - daysToSubtract);
        startOfWeek.setHours(0, 0, 0, 0);
        
        // Mai napi étel naplók kalóriáihoz
        const startOfDay = new Date(today);
        startOfDay.setHours(0, 0, 0, 0);
        
        const endOfDay = new Date(today);
        endOfDay.setHours(23, 59, 59, 999);
        
        const todayFoodLogs = await ctx.prisma.userFoodLog.findMany({
          where: {
            user_id: userId,
            logDate: {
              gte: startOfDay,
              lte: endOfDay
            }
          },
          include: {
            foodItem: true,
          },
        });

        // Felhasználói profil lekérése a teljesség ellenőrzéséhez
        const userProfile = await ctx.prisma.userProfile.findUnique({
          where: { user_id: userId },
        });

        // Mai napi cél lekérése
        let dailyGoal = await ctx.prisma.dailyGoal.findUnique({
          where: {
            user_id_date: {
              user_id: userId,
              date: today,
            },
          },
        });

        // Ha nincs napi cél és a profil teljes, hozz létre egyet
        if (!dailyGoal && userProfile) {
          const isProfileComplete = !!(
            userProfile.birthDate &&
            userProfile.gender &&
            userProfile.heightCm &&
            userProfile.weightKg &&
            userProfile.activityLevel_id &&
            userProfile.goal_id
          );

          if (isProfileComplete) {
            const age = calculateAge(userProfile.birthDate!);
            
            const goals = calculateDailyGoals(
              age,
              userProfile.gender!,
              userProfile.heightCm!,
              Number(userProfile.weightKg!),
              userProfile.activityLevel_id!,
              userProfile.goal_id!
            );

            dailyGoal = await ctx.prisma.dailyGoal.create({
              data: {
                user_id: userId,
                date: today,
                caloriesGoal: goals.caloriesGoal,
                proteinGoal: new Decimal(goals.proteinGoal),
                fatGoal: new Decimal(goals.fatGoal),
                carbsGoal: new Decimal(goals.carbsGoal),
              },
            });
          }
        }

        // Ezen heti gyakorlat naplók lekérése
        const weekExerciseLogs = await ctx.prisma.userExerciseLog.findMany({
          where: {
            user_id: userId,
            logDate: {
              gte: startOfWeek,
              lte: endOfDay,
            },
          },
        });

        // Heti összegek számítása az adatbázisból
        const weeklyCaloriesBurned = weekExerciseLogs.reduce((total, log) => {
          return total + Number(log.caloriesBurned || 0);
        }, 0);

        const weeklyWorkoutMinutes = weekExerciseLogs.reduce((total, log) => {
          return total + (log.durationMinutes || 0);
        }, 0);

        // Legutóbbi aktivitások lekérése (utolsó 7 nap)
        const sevenDaysAgo = new Date(today);
        sevenDaysAgo.setDate(today.getDate() - 7);

        const recentFoodLogs = await ctx.prisma.userFoodLog.findMany({
          where: {
            user_id: userId,
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
            user_id: userId,
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

        // Mai bevitt kalóriák számítása
        const caloriesConsumed = todayFoodLogs.reduce((total, log) => {
          const calories = log.foodItem.calories || 0;
          const quantity = log.quantity || 1;
          const logCalories = Number(calories) * Number(quantity);
          return total + logCalories;
        }, 0);

        // Mai elégetett kalóriák számítása edzésekből
        const todayWorkoutLogs = await ctx.prisma.userExerciseLog.findMany({
          where: {
            user_id: userId,
            logDate: {
              gte: startOfDay,
              lte: endOfDay
            }
          }
        });
        
        const caloriesBurned = todayWorkoutLogs.reduce((total, log) => {
          return total + Number(log.caloriesBurned || 0);
        }, 0);
        
        // Sorozat számítása (egymást követő napok naplózott aktivitással)
        let currentStreak = 0;
        const checkDate = new Date(today);
        
        for (let i = 0; i < 30; i++) { // Utolsó 30 nap ellenőrzése
          const dayStart = new Date(checkDate);
          dayStart.setHours(0, 0, 0, 0);
          const dayEnd = new Date(checkDate);
          dayEnd.setHours(23, 59, 59, 999);

          const hasActivity = await ctx.prisma.userFoodLog.findFirst({
            where: {
              user_id: userId,
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

        // Összes edzés száma erre a hétre (ugyanaz, mint a workoutsCompleted)
        const totalWorkouts = weekExerciseLogs.length;

        // Átlagos kalória naponta (utolsó 7 nap)
        const last7Days = new Date(today);
        last7Days.setDate(today.getDate() - 6); // Mai nap + 6 előző nap
        
        const weeklyFoodLogs = await ctx.prisma.userFoodLog.findMany({
          where: {
            user_id: userId,
            logDate: {
              gte: last7Days,
              lte: today,
            },
          },
          include: {
            foodItem: true,
          },
        });

        // Kalóriák csoportosítása dátum szerint és napi összegek számítása
        const dailyCalories: { [key: string]: number } = {};
        
        weeklyFoodLogs.forEach(log => {
          if (log.logDate) {
            const dateKey = log.logDate.toISOString().split('T')[0];
            const calories = Number(log.foodItem.calories || 0) * Number(log.quantity || 1);
            dailyCalories[dateKey] = (dailyCalories[dateKey] || 0) + calories;
          }
        });

        // Átlag számítása (csak a naplózott napokat számítva)
        const daysWithLogs = Object.keys(dailyCalories).length;
        const totalCalories = Object.values(dailyCalories).reduce((sum, cal) => sum + cal, 0);
        const avgCaloriesPerDay = daysWithLogs > 0 ? Math.round(totalCalories / daysWithLogs) : 0;

        // Mai bevitt fehérje számítása
        const proteinConsumed = todayFoodLogs.reduce((total, log) => {
          const protein = log.foodItem.protein || 0;
          const quantity = log.quantity || 1;
          const logProtein = Number(protein) * Number(quantity);
          return total + logProtein;
        }, 0);

        // Elért célok százalékának számítása (utolsó 7 nap)
        // Napi célok lekérése az utolsó 7 napra
        const last7DaysGoals = await ctx.prisma.dailyGoal.findMany({
          where: {
            user_id: userId,
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

        // Ellenőrizd minden napra, hogy a kalóriacél teljesült-e
        Object.keys(dailyCalories).forEach(dateKey => {
          const caloriesForDay = dailyCalories[dateKey];
          const goalForDay = calorieGoalsByDate[dateKey] || Number(dailyGoal?.caloriesGoal || 2000);
          
          // Célnak tekintjük, ha a cél 10%-án belül van (nincs túllépés és nem túl kevés)
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
          caloriesBurned: Math.round(caloriesBurned),
          netCalories: Math.round(caloriesConsumed - caloriesBurned),
          caloriesTarget: dailyGoal?.caloriesGoal || 2000,
          proteinConsumed: Math.round(proteinConsumed),
          proteinTarget: dailyGoal?.proteinGoal ? Number(dailyGoal.proteinGoal) : 150,
          fatTarget: dailyGoal?.fatGoal ? Number(dailyGoal.fatGoal) : 65,
          carbsTarget: dailyGoal?.carbsGoal ? Number(dailyGoal.carbsGoal) : 250,
          workoutsCompleted: weekExerciseLogs.length,
          todayWorkouts: todayWorkoutLogs.length,
          weeklyCaloriesBurned: Math.round(weeklyCaloriesBurned),
          weeklyWorkoutMinutes,
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
            user_id: userId,
            foodItem_id: input.foodItemId,
            mealType_id: input.mealTypeId,
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
            user_id: userId,
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
            { mealType_id: 'asc' },
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
        
        // Ellenőrizd, hogy a napló a felhasználóhoz tartozik-e
        const log = await ctx.prisma.userFoodLog.findFirst({
          where: {
            id: input.logId,
            user_id: userId
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
        
        // Ellenőrizd, hogy a napló a felhasználóhoz tartozik-e
        const log = await ctx.prisma.userFoodLog.findFirst({
          where: {
            id: input.logId,
            user_id: userId
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
        const mealTypes = await ctx.prisma.mealType.findMany();
        
        // Definiáld a helyes napi sorrendet: Reggeli, Ebéd, Vacsora, Snack
        const orderMap: { [key: string]: number } = {
          'Reggeli': 1,  // Reggeli
          'Ebéd': 2,     // Ebéd
          'Vacsora': 3,  // Vacsora
          'Snack': 4     // Snack (utolsó)
        };
        
        // Rendezd az étkezés típusokat a napi sorrend szerint
        return mealTypes.sort((a, b) => {
          const orderA = orderMap[a.name] || 999;
          const orderB = orderMap[b.name] || 999;
          return orderA - orderB;
        });
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
        
        // Ellenőrizd, hogy a felhasználónak van-e jogosultsága egyedi étel létrehozásához
        const user = await ctx.prisma.user.findUnique({
          where: { id: userId },
          select: { canCreateCustomFood: true }
        });
        
        if (!user?.canCreateCustomFood) {
          throw new Error('Nincs jogosultságod egyedi étel létrehozásához');
        }
        
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
  workout: router({
    // Összes gyakorlat kategória lekérése
    getCategories: protectedProcedure
      .query(async ({ ctx }) => {
        const userId = ctx.session.user.id;
        const exercises = await ctx.prisma.exercise.findMany({
          select: { category: true },
          distinct: ['category'],
          where: {
            category: { not: null },
            OR: [
              { isCustom: false },
              { createdBy: userId }
            ]
          }
        });
        
        return exercises.map(e => e.category).filter(Boolean) as string[];
      }),
    
    // Gyakorlatok keresése (globális + felhasználó egyéni)
    search: protectedProcedure
      .input(z.object({
        query: z.string().optional(),
        category: z.string().optional(),
        limit: z.number().optional().default(50)
      }))
      .query(async ({ input, ctx }) => {
        const userId = ctx.session.user.id;
        
        // Alapfeltétel: mutasd a globális gyakorlatokat VAGY a felhasználó saját egyéni gyakorlatait
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const conditions: any[] = [
          { OR: [{ isCustom: false }, { createdBy: userId }] }
        ];
        
        if (input.query && input.query.length > 0) {
          conditions.push({
            OR: [
              { name: { contains: input.query, mode: 'insensitive' } },
              { category: { contains: input.query, mode: 'insensitive' } }
            ]
          });
        }
        
        if (input.category) {
          conditions.push({ category: input.category });
        }
        
        const exercises = await ctx.prisma.exercise.findMany({
          where: { AND: conditions },
          take: input.limit,
          orderBy: [
            { category: 'asc' },
            { name: 'asc' }
          ]
        });
        
        return exercises;
      }),
    
    // Egyéni gyakorlat létrehozása
    createCustomExercise: protectedProcedure
      .input(z.object({
        name: z.string().min(1),
        category: z.string().optional(),
        metValue: z.number().positive().optional(),
        defaultDurationMinutes: z.number().int().positive().optional()
      }))
      .mutation(async ({ input, ctx }) => {
        const userId = ctx.session.user.id;
        
        const exercise = await ctx.prisma.exercise.create({
          data: {
            id: crypto.randomUUID(),
            name: input.name,
            category: input.category || 'Egyéni',
            metValue: input.metValue,
            defaultDurationMinutes: input.defaultDurationMinutes,
            isCustom: true,
            createdBy: userId
          }
        });
        
        return exercise;
      }),

    // Egyéni gyakorlat törlése
    deleteCustomExercise: protectedProcedure
      .input(z.object({
        exerciseId: z.string()
      }))
      .mutation(async ({ input, ctx }) => {
        const userId = ctx.session.user.id;
        
        // Csak a saját egyéni gyakorlatok törlésének engedélyezése
        const exercise = await ctx.prisma.exercise.findFirst({
          where: {
            id: input.exerciseId,
            isCustom: true,
            createdBy: userId
          }
        });
        
        if (!exercise) {
          throw new Error('Az edzés nem található vagy nincs jogosultságod törölni');
        }
        
        // Kapcsolódó naplók törlése először
        await ctx.prisma.userExerciseLog.deleteMany({
          where: { exercise_id: input.exerciseId }
        });
        
        await ctx.prisma.exercise.delete({
          where: { id: input.exerciseId }
        });
        
        return { success: true };
      }),
    
    // Edzés naplózása
    logWorkout: protectedProcedure
      .input(z.object({
        exerciseId: z.string(),
        durationMinutes: z.number().positive(),
        logDate: z.string().optional()
      }))
      .mutation(async ({ input, ctx }) => {
        const userId = ctx.session.user.id;
        
        // UTC dátum létrehozása éjfélkor a konzisztens csak-dátum tároláshoz
        const dateString = input.logDate || new Date().toISOString().split('T')[0];
        const logDate = new Date(dateString + 'T00:00:00.000Z');
        
        // Gyakorlat lekérése az elégetett kalóriák számításához
        const exercise = await ctx.prisma.exercise.findUnique({
          where: { id: input.exerciseId }
        });
        
        if (!exercise) {
          throw new Error('Exercise not found');
        }
        
        // Felhasználói profil lekérése súly alapú kalóriaszámításhoz
        const userProfile = await ctx.prisma.userProfile.findUnique({
          where: { user_id: userId }
        });
        
        // Elégetett kalóriák számítása MET képlet alapján: Kalória = MET × súly (kg) × időtartam (óra)
        const weight = userProfile?.weightKg ? Number(userProfile.weightKg) : 70; // Alapértelmezett 70kg
        const met = exercise.metValue ? Number(exercise.metValue) : 5; // Default MET of 5
        const durationHours = input.durationMinutes / 60;
        const caloriesBurned = Math.round(met * weight * durationHours);
        
        const workoutLog = await ctx.prisma.userExerciseLog.create({
          data: {
            id: crypto.randomUUID(),
            user_id: userId,
            exercise_id: input.exerciseId,
            durationMinutes: input.durationMinutes,
            caloriesBurned,
            logDate,
            createdAt: new Date()
          },
          include: {
            exercise: true
          }
        });
        
        return workoutLog;
      }),
    
    // Napi edzési naplók lekérése
    getDailyLogs: protectedProcedure
      .input(z.object({
        date: z.string().optional()
      }))
      .query(async ({ input, ctx }) => {
        const userId = ctx.session.user.id;
        
        // Dátum sztring elemzése és csak-dátum összehasonlítás létrehozása
        // PostgreSQL DATE típushoz a pontos dátummal kell összehasonlítani
        const dateString = input.date || new Date().toISOString().split('T')[0];
        const targetDate = new Date(dateString + 'T00:00:00.000Z');
        
        const logs = await ctx.prisma.userExerciseLog.findMany({
          where: {
            user_id: userId,
            logDate: targetDate
          },
          include: {
            exercise: true
          },
          orderBy: {
            createdAt: 'asc'
          }
        });
        
        return logs;
      }),
    
    // Edzési napló törlése
    deleteLog: protectedProcedure
      .input(z.object({
        logId: z.string()
      }))
      .mutation(async ({ input, ctx }) => {
        const userId = ctx.session.user.id;
        
        const log = await ctx.prisma.userExerciseLog.findFirst({
          where: {
            id: input.logId,
            user_id: userId
          }
        });
        
        if (!log) {
          throw new Error('Workout log not found or access denied');
        }
        
        await ctx.prisma.userExerciseLog.delete({
          where: { id: input.logId }
        });
        
        return { success: true };
      }),
    
    // Edzési napló időtartamának frissítése
    updateLog: protectedProcedure
      .input(z.object({
        logId: z.string(),
        durationMinutes: z.number().positive()
      }))
      .mutation(async ({ input, ctx }) => {
        const userId = ctx.session.user.id;
        
        const log = await ctx.prisma.userExerciseLog.findFirst({
          where: {
            id: input.logId,
            user_id: userId
          },
          include: {
            exercise: true
          }
        });
        
        if (!log) {
          throw new Error('Workout log not found or access denied');
        }
        
        // Elégetett kalóriák újraszámítása
        const userProfile = await ctx.prisma.userProfile.findUnique({
          where: { user_id: userId }
        });
        
        const weight = userProfile?.weightKg ? Number(userProfile.weightKg) : 70;
        const met = log.exercise?.metValue ? Number(log.exercise.metValue) : 5;
        const durationHours = input.durationMinutes / 60;
        const caloriesBurned = Math.round(met * weight * durationHours);
        
        const updatedLog = await ctx.prisma.userExerciseLog.update({
          where: { id: input.logId },
          data: { 
            durationMinutes: input.durationMinutes,
            caloriesBurned
          },
          include: {
            exercise: true
          }
        });
        
        return updatedLog;
      }),
    
    // Edzési statisztikák lekérése dátumtartományra
    getStats: protectedProcedure
      .input(z.object({
        startDate: z.string().optional(),
        endDate: z.string().optional()
      }))
      .query(async ({ input, ctx }) => {
        const userId = ctx.session.user.id;
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const startDate = input.startDate ? new Date(input.startDate) : new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
        const endDate = input.endDate ? new Date(input.endDate) : new Date(today);
        endDate.setHours(23, 59, 59, 999);
        
        const logs = await ctx.prisma.userExerciseLog.findMany({
          where: {
            user_id: userId,
            logDate: {
              gte: startDate,
              lte: endDate
            }
          },
          include: {
            exercise: true
          }
        });
        
        const totalWorkouts = logs.length;
        const totalMinutes = logs.reduce((sum, log) => sum + (log.durationMinutes || 0), 0);
        const totalCaloriesBurned = logs.reduce((sum, log) => sum + Number(log.caloriesBurned || 0), 0);
        
        // Csoportosítás kategória szerint
        const byCategory: { [key: string]: { count: number; minutes: number; calories: number } } = {};
        logs.forEach(log => {
          const category = log.exercise?.category || 'Other';
          if (!byCategory[category]) {
            byCategory[category] = { count: 0, minutes: 0, calories: 0 };
          }
          byCategory[category].count++;
          byCategory[category].minutes += log.durationMinutes || 0;
          byCategory[category].calories += Number(log.caloriesBurned || 0);
        });
        
        return {
          totalWorkouts,
          totalMinutes,
          totalCaloriesBurned,
          byCategory,
          averageMinutesPerWorkout: totalWorkouts > 0 ? Math.round(totalMinutes / totalWorkouts) : 0,
          averageCaloriesPerWorkout: totalWorkouts > 0 ? Math.round(totalCaloriesBurned / totalWorkouts) : 0
        };
      }),
    
    // Mai elégetett kalóriák lekérése
    getTodayBurnedCalories: protectedProcedure
      .query(async ({ ctx }) => {
        const userId = ctx.session.user.id;
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const endOfDay = new Date(today);
        endOfDay.setHours(23, 59, 59, 999);
        
        const logs = await ctx.prisma.userExerciseLog.findMany({
          where: {
            user_id: userId,
            logDate: {
              gte: today,
              lte: endOfDay
            }
          }
        });
        
        const totalBurned = logs.reduce((sum, log) => sum + Number(log.caloriesBurned || 0), 0);
        
        return { caloriesBurned: totalBurned };
      })
  }),
  // Admin panel router - moderátoroknak és adminoknak
  admin: router({
    // Jelenlegi felhasználó jogosultsági szintjének lekérése
    getPermissionLevel: protectedProcedure
      .query(async ({ ctx }) => {
        const userId = ctx.session.user.id;
        
        const user = await ctx.prisma.user.findUnique({
          where: { id: userId },
          select: { permissionLevel: true }
        });
        
        return { permissionLevel: user?.permissionLevel || 0 };
      }),
    
    // Összes egyedi étel lekérése (moderátor+)
    getCustomFoods: moderatorProcedure
      .input(z.object({
        limit: z.number().optional().default(50),
        offset: z.number().optional().default(0),
        search: z.string().optional()
      }))
      .query(async ({ input, ctx }) => {
        const whereClause = {
          isCustom: true,
          ...(input.search && {
            OR: [
              { name: { contains: input.search, mode: 'insensitive' as const } },
              { brand: { contains: input.search, mode: 'insensitive' as const } }
            ]
          })
        };
        
        const [foods, total] = await Promise.all([
          ctx.prisma.foodItem.findMany({
            where: whereClause,
            include: {
              createdByUser: {
                select: {
                  id: true,
                  username: true,
                  email: true
                }
              }
            },
            take: input.limit,
            skip: input.offset,
            orderBy: { name: 'asc' }
          }),
          ctx.prisma.foodItem.count({ where: whereClause })
        ]);
        
        return { foods, total };
      }),
    
    // Egyedi étel törlése (moderátor+)
    deleteCustomFood: moderatorProcedure
      .input(z.object({
        foodId: z.string()
      }))
      .mutation(async ({ input, ctx }) => {
        // Ellenőrizd, hogy az étel létezik és egyedi
        const food = await ctx.prisma.foodItem.findFirst({
          where: {
            id: input.foodId,
            isCustom: true
          }
        });
        
        if (!food) {
          throw new Error('Az étel nem található vagy nem egyedi étel');
        }
        
        // Töröld a kapcsolódó naplókat először
        await ctx.prisma.userFoodLog.deleteMany({
          where: { foodItem_id: input.foodId }
        });
        
        // Töröld az ételt
        await ctx.prisma.foodItem.delete({
          where: { id: input.foodId }
        });
        
        return { success: true };
      }),
    
    // Összes felhasználó lekérése (admin)
    getUsers: adminProcedure
      .input(z.object({
        limit: z.number().optional().default(50),
        offset: z.number().optional().default(0),
        search: z.string().optional()
      }))
      .query(async ({ input, ctx }) => {
        const whereClause = input.search ? {
          OR: [
            { username: { contains: input.search, mode: 'insensitive' as const } },
            { email: { contains: input.search, mode: 'insensitive' as const } }
          ]
        } : {};
        
        const [users, total] = await Promise.all([
          ctx.prisma.user.findMany({
            where: whereClause,
            select: {
              id: true,
              username: true,
              email: true,
              permissionLevel: true,
              canCreateCustomFood: true,
              createdAt: true
            },
            take: input.limit,
            skip: input.offset,
            orderBy: { username: 'asc' }
          }),
          ctx.prisma.user.count({ where: whereClause })
        ]);
        
        return { users, total };
      }),
    
    // Felhasználó jogosultsági szintjének módosítása (admin)
    updateUserPermission: adminProcedure
      .input(z.object({
        userId: z.string(),
        permissionLevel: z.number().min(0).max(2)
      }))
      .mutation(async ({ input, ctx }) => {
        const currentUserId = ctx.session.user.id;
        
        // Ne lehessen saját magát módosítani
        if (input.userId === currentUserId) {
          throw new Error('Nem módosíthatod a saját jogosultsági szintedet');
        }
        
        // Ellenőrizd, hogy a felhasználó létezik-e
        const targetUser = await ctx.prisma.user.findUnique({
          where: { id: input.userId }
        });
        
        if (!targetUser) {
          throw new Error('A felhasználó nem található');
        }
        
        // Frissítsd a jogosultsági szintet
        const updatedUser = await ctx.prisma.user.update({
          where: { id: input.userId },
          data: { permissionLevel: input.permissionLevel },
          select: {
            id: true,
            username: true,
            email: true,
            permissionLevel: true,
            canCreateCustomFood: true
          }
        });
        
        return updatedUser;
      }),
    
    // Felhasználó egyedi étel létrehozási jogának módosítása (admin)
    toggleCustomFoodPermission: adminProcedure
      .input(z.object({
        userId: z.string(),
        canCreateCustomFood: z.boolean()
      }))
      .mutation(async ({ input, ctx }) => {
        // Ellenőrizd, hogy a felhasználó létezik-e
        const targetUser = await ctx.prisma.user.findUnique({
          where: { id: input.userId }
        });
        
        if (!targetUser) {
          throw new Error('A felhasználó nem található');
        }
        
        // Frissítsd az egyedi étel létrehozási jogot
        const updatedUser = await ctx.prisma.user.update({
          where: { id: input.userId },
          data: { canCreateCustomFood: input.canCreateCustomFood },
          select: {
            id: true,
            username: true,
            email: true,
            permissionLevel: true,
            canCreateCustomFood: true
          }
        });
        
        return updatedUser;
      })
  }),
});

export type AppRouter = typeof appRouter;
