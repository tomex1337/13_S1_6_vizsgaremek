import { PrismaClient } from '../src/generated/prisma';
import { hash } from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  // Create activity levels
  const activityLevels = await Promise.all([
    prisma.activityLevel.upsert({
      where: { name: 'Ülő életmód' },
      update: {},
      create: { name: 'Ülő életmód' },
    }),
    prisma.activityLevel.upsert({
      where: { name: 'Enyhén aktív' },
      update: {},
      create: { name: 'Enyhén aktív' },
    }),
    prisma.activityLevel.upsert({
      where: { name: 'Mérsékelten aktív' },
      update: {},
      create: { name: 'Mérsékelten aktív' },
    }),
    prisma.activityLevel.upsert({
      where: { name: 'Nagyon aktív' },
      update: {},
      create: { name: 'Nagyon aktív' },
    }),
  ]);

  // Create goals
  const goals = await Promise.all([
    prisma.goal.upsert({
      where: { name: 'Fogyás' },
      update: {},
      create: { name: 'Fogyás' },
    }),
    prisma.goal.upsert({
      where: { name: 'Súlytartás' },
      update: {},
      create: { name: 'Súlytartás' },
    }),
    prisma.goal.upsert({
      where: { name: 'Hízás' },
      update: {},
      create: { name: 'Hízás' },
    }),
  ]);

  // Create meal types
  const mealTypes = await Promise.all([
    prisma.mealType.upsert({
      where: { name: 'Reggeli' },
      update: {},
      create: { name: 'Reggeli' },
    }),
    prisma.mealType.upsert({
      where: { name: 'Ebéd' },
      update: {},
      create: { name: 'Ebéd' },
    }),
    prisma.mealType.upsert({
      where: { name: 'Vacsora' },
      update: {},
      create: { name: 'Vacsora' },
    }),
    prisma.mealType.upsert({
      where: { name: 'Snack' },
      update: {},
      create: { name: 'Snack' },
    }),
  ]);

  // Create a test user
  const hashedPassword = await hash('jelszo123', 12);
  
  const testUser = await prisma.user.upsert({
    where: { email: 'teszt@pelda.hu' },
    update: {},
    create: {
      id: '550e8400-e29b-41d4-a716-446655440000',
      email: 'teszt@pelda.hu',
      username: 'TesztFelhasznalo',
      passwordHash: hashedPassword,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  });

  // Create user profile
  await prisma.userProfile.upsert({
    where: { userId: testUser.id },
    update: {},
    create: {
      userId: testUser.id,
      age: 25,
      gender: 'male',
      heightCm: 175,
      weightKg: 70.5,
      activityLevelId: activityLevels[1].id, // Enyhén aktív
      goalId: goals[1].id, // Súlytartás
    },
  });

  // Create some food items
  const foodItems = await Promise.all([
    prisma.foodItem.upsert({
      where: { id: '650e8400-e29b-41d4-a716-446655440001' },
      update: {},
      create: {
        id: '650e8400-e29b-41d4-a716-446655440001',
        name: 'Banán',
        servingSizeGrams: 100,
        calories: 89,
        protein: 1.1,
        fat: 0.3,
        carbs: 22.8,
        fiber: 2.6,
        sugar: 12.2,
        sodium: 1,
      },
    }),
    prisma.foodItem.upsert({
      where: { id: '650e8400-e29b-41d4-a716-446655440002' },
      update: {},
      create: {
        id: '650e8400-e29b-41d4-a716-446655440002',
        name: 'Csirkemell',
        servingSizeGrams: 100,
        calories: 165,
        protein: 31,
        fat: 3.6,
        carbs: 0,
        fiber: 0,
        sugar: 0,
        sodium: 74,
      },
    }),
    prisma.foodItem.upsert({
      where: { id: '650e8400-e29b-41d4-a716-446655440003' },
      update: {},
      create: {
        id: '650e8400-e29b-41d4-a716-446655440003',
        name: 'Barna rizs',
        servingSizeGrams: 100,
        calories: 123,
        protein: 2.6,
        fat: 0.9,
        carbs: 25.6,
        fiber: 1.6,
        sugar: 0.7,
        sodium: 1,
      },
    }),
  ]);

  // Create some exercises
  const exercises = await Promise.all([
    prisma.exercise.upsert({
      where: { id: '750e8400-e29b-41d4-a716-446655440001' },
      update: {},
      create: {
        id: '750e8400-e29b-41d4-a716-446655440001',
        name: 'Futás',
        category: 'Kardió',
        metValue: 8.0,
        defaultDurationMinutes: 30,
      },
    }),
    prisma.exercise.upsert({
      where: { id: '750e8400-e29b-41d4-a716-446655440002' },
      update: {},
      create: {
        id: '750e8400-e29b-41d4-a716-446655440002',
        name: 'Fekvőtámasz',
        category: 'Erősítés',
        metValue: 3.8,
        defaultDurationMinutes: 15,
      },
    }),
    prisma.exercise.upsert({
      where: { id: '750e8400-e29b-41d4-a716-446655440003' },
      update: {},
      create: {
        id: '750e8400-e29b-41d4-a716-446655440003',
        name: 'Kerékpározás',
        category: 'Kardió',
        metValue: 6.8,
        defaultDurationMinutes: 45,
      },
    }),
  ]);

  // Create today's daily goal
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  await prisma.dailyGoal.upsert({
    where: {
      userId_date: {
        userId: testUser.id,
        date: today,
      },
    },
    update: {},
    create: {
      userId: testUser.id,
      date: today,
      caloriesGoal: 2000,
      proteinGoal: 150,
      fatGoal: 67,
      carbsGoal: 250,
    },
  });

  // Create some food logs for today
  await Promise.all([
    prisma.userFoodLog.create({
      data: {
        id: '850e8400-e29b-41d4-a716-446655440001',
        userId: testUser.id,
        foodItemId: foodItems[0].id, // Banán
        logDate: today,
        mealTypeId: mealTypes[0].id, // Reggeli
        quantity: 2,
        createdAt: new Date(today.getTime() + 8 * 60 * 60 * 1000), // 8 AM
      },
    }),
    prisma.userFoodLog.create({
      data: {
        id: '850e8400-e29b-41d4-a716-446655440002',
        userId: testUser.id,
        foodItemId: foodItems[1].id, // Csirkemell
        logDate: today,
        mealTypeId: mealTypes[1].id, // Ebéd
        quantity: 1.5,
        createdAt: new Date(today.getTime() + 12 * 60 * 60 * 1000), // 12 PM
      },
    }),
    prisma.userFoodLog.create({
      data: {
        id: '850e8400-e29b-41d4-a716-446655440003',
        userId: testUser.id,
        foodItemId: foodItems[2].id, // Barna rizs
        logDate: today,
        mealTypeId: mealTypes[2].id, // Vacsora
        quantity: 1,
        createdAt: new Date(today.getTime() + 18 * 60 * 60 * 1000), // 6 PM
      },
    }),
  ]);

  // Create some exercise logs
  await Promise.all([
    prisma.userExerciseLog.create({
      data: {
        id: '950e8400-e29b-41d4-a716-446655440001',
        userId: testUser.id,
        exerciseId: exercises[0].id, // Futás
        durationMinutes: 30,
        caloriesBurned: 300,
        logDate: today,
        createdAt: new Date(today.getTime() + 7 * 60 * 60 * 1000), // 7 AM
      },
    }),
    prisma.userExerciseLog.create({
      data: {
        id: '950e8400-e29b-41d4-a716-446655440002',
        userId: testUser.id,
        exerciseId: exercises[1].id, // Fekvőtámasz
        durationMinutes: 15,
        caloriesBurned: 50,
        logDate: today,
        createdAt: new Date(today.getTime() + 16 * 60 * 60 * 1000), // 4 PM
      },
    }),
  ]);

  console.log('Adatbázis sikeresen feltöltve!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
