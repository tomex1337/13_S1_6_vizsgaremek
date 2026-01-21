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
  const birthDate = new Date();
  birthDate.setFullYear(birthDate.getFullYear() - 25); // 25 éves
  
  await prisma.userProfile.upsert({
    where: { user_id: testUser.id },
    update: {},
    create: {
      user_id: testUser.id,
      birthDate: birthDate,
      gender: 'male',
      heightCm: 175,
      weightKg: 70.5,
      activityLevel_id: activityLevels[1].id, // Enyhén aktív
      goal_id: goals[1].id, // Súlytartás
    },
  });

  // Create some food items (system-wide, not custom)
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
        isCustom: false,
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
        isCustom: false,
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
        isCustom: false,
      },
    }),
  ]);

  // Create some exercises (system-wide, not custom)
  const exercises = await Promise.all([
    // Cardio exercises
    prisma.exercise.upsert({
      where: { id: '750e8400-e29b-41d4-a716-446655440001' },
      update: {},
      create: {
        id: '750e8400-e29b-41d4-a716-446655440001',
        name: 'Futás',
        category: 'Kardió',
        metValue: 8.0,
        defaultDurationMinutes: 30,
        isCustom: false,
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
        isCustom: false,
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
        isCustom: false,
      },
    }),
    // More cardio exercises
    prisma.exercise.upsert({
      where: { id: '750e8400-e29b-41d4-a716-446655440004' },
      update: {},
      create: {
        id: '750e8400-e29b-41d4-a716-446655440004',
        name: 'Gyaloglás',
        category: 'Kardió',
        metValue: 3.5,
        defaultDurationMinutes: 30,
        isCustom: false,
      },
    }),
    prisma.exercise.upsert({
      where: { id: '750e8400-e29b-41d4-a716-446655440005' },
      update: {},
      create: {
        id: '750e8400-e29b-41d4-a716-446655440005',
        name: 'Úszás',
        category: 'Kardió',
        metValue: 7.0,
        defaultDurationMinutes: 45,
        isCustom: false,
      },
    }),
    prisma.exercise.upsert({
      where: { id: '750e8400-e29b-41d4-a716-446655440006' },
      update: {},
      create: {
        id: '750e8400-e29b-41d4-a716-446655440006',
        name: 'Ugrókötelezés',
        category: 'Kardió',
        metValue: 11.0,
        defaultDurationMinutes: 15,
        isCustom: false,
      },
    }),
    prisma.exercise.upsert({
      where: { id: '750e8400-e29b-41d4-a716-446655440007' },
      update: {},
      create: {
        id: '750e8400-e29b-41d4-a716-446655440007',
        name: 'HIIT edzés',
        category: 'Kardió',
        metValue: 12.0,
        defaultDurationMinutes: 20,
        isCustom: false,
      },
    }),
    prisma.exercise.upsert({
      where: { id: '750e8400-e29b-41d4-a716-446655440008' },
      update: {},
      create: {
        id: '750e8400-e29b-41d4-a716-446655440008',
        name: 'Elliptikus gép',
        category: 'Kardió',
        metValue: 5.0,
        defaultDurationMinutes: 30,
        isCustom: false,
      },
    }),
    // Strength training exercises
    prisma.exercise.upsert({
      where: { id: '750e8400-e29b-41d4-a716-446655440009' },
      update: {},
      create: {
        id: '750e8400-e29b-41d4-a716-446655440009',
        name: 'Guggolás',
        category: 'Erősítés',
        metValue: 5.0,
        defaultDurationMinutes: 20,
        isCustom: false,
      },
    }),
    prisma.exercise.upsert({
      where: { id: '750e8400-e29b-41d4-a716-446655440010' },
      update: {},
      create: {
        id: '750e8400-e29b-41d4-a716-446655440010',
        name: 'Húzódzkodás',
        category: 'Erősítés',
        metValue: 8.0,
        defaultDurationMinutes: 15,
        isCustom: false,
      },
    }),
    prisma.exercise.upsert({
      where: { id: '750e8400-e29b-41d4-a716-446655440011' },
      update: {},
      create: {
        id: '750e8400-e29b-41d4-a716-446655440011',
        name: 'Fekve nyomás',
        category: 'Erősítés',
        metValue: 6.0,
        defaultDurationMinutes: 20,
        isCustom: false,
      },
    }),
    prisma.exercise.upsert({
      where: { id: '750e8400-e29b-41d4-a716-446655440012' },
      update: {},
      create: {
        id: '750e8400-e29b-41d4-a716-446655440012',
        name: 'Deadlift',
        category: 'Erősítés',
        metValue: 6.0,
        defaultDurationMinutes: 20,
        isCustom: false,
      },
    }),
    prisma.exercise.upsert({
      where: { id: '750e8400-e29b-41d4-a716-446655440013' },
      update: {},
      create: {
        id: '750e8400-e29b-41d4-a716-446655440013',
        name: 'Vádli emelés',
        category: 'Erősítés',
        metValue: 3.5,
        defaultDurationMinutes: 15,
        isCustom: false,
      },
    }),
    prisma.exercise.upsert({
      where: { id: '750e8400-e29b-41d4-a716-446655440014' },
      update: {},
      create: {
        id: '750e8400-e29b-41d4-a716-446655440014',
        name: 'Bicepsz hajlítás',
        category: 'Erősítés',
        metValue: 3.0,
        defaultDurationMinutes: 15,
        isCustom: false,
      },
    }),
    prisma.exercise.upsert({
      where: { id: '750e8400-e29b-41d4-a716-446655440015' },
      update: {},
      create: {
        id: '750e8400-e29b-41d4-a716-446655440015',
        name: 'Tricepsz nyújtás',
        category: 'Erősítés',
        metValue: 3.0,
        defaultDurationMinutes: 15,
        isCustom: false,
      },
    }),
    prisma.exercise.upsert({
      where: { id: '750e8400-e29b-41d4-a716-446655440016' },
      update: {},
      create: {
        id: '750e8400-e29b-41d4-a716-446655440016',
        name: 'Planking',
        category: 'Erősítés',
        metValue: 4.0,
        defaultDurationMinutes: 10,
        isCustom: false,
      },
    }),
    // Flexibility & Mind-body
    prisma.exercise.upsert({
      where: { id: '750e8400-e29b-41d4-a716-446655440017' },
      update: {},
      create: {
        id: '750e8400-e29b-41d4-a716-446655440017',
        name: 'Jóga',
        category: 'Rugalmasság',
        metValue: 2.5,
        defaultDurationMinutes: 60,
        isCustom: false,
      },
    }),
    prisma.exercise.upsert({
      where: { id: '750e8400-e29b-41d4-a716-446655440018' },
      update: {},
      create: {
        id: '750e8400-e29b-41d4-a716-446655440018',
        name: 'Pilates',
        category: 'Rugalmasság',
        metValue: 3.0,
        defaultDurationMinutes: 45,
        isCustom: false,
      },
    }),
    prisma.exercise.upsert({
      where: { id: '750e8400-e29b-41d4-a716-446655440019' },
      update: {},
      create: {
        id: '750e8400-e29b-41d4-a716-446655440019',
        name: 'Stretching',
        category: 'Rugalmasság',
        metValue: 2.3,
        defaultDurationMinutes: 20,
        isCustom: false,
      },
    }),
    // Sports
    prisma.exercise.upsert({
      where: { id: '750e8400-e29b-41d4-a716-446655440020' },
      update: {},
      create: {
        id: '750e8400-e29b-41d4-a716-446655440020',
        name: 'Tenisz',
        category: 'Sport',
        metValue: 7.3,
        defaultDurationMinutes: 60,
        isCustom: false,
      },
    }),
    prisma.exercise.upsert({
      where: { id: '750e8400-e29b-41d4-a716-446655440021' },
      update: {},
      create: {
        id: '750e8400-e29b-41d4-a716-446655440021',
        name: 'Kosárlabda',
        category: 'Sport',
        metValue: 6.5,
        defaultDurationMinutes: 60,
        isCustom: false,
      },
    }),
    prisma.exercise.upsert({
      where: { id: '750e8400-e29b-41d4-a716-446655440022' },
      update: {},
      create: {
        id: '750e8400-e29b-41d4-a716-446655440022',
        name: 'Foci',
        category: 'Sport',
        metValue: 7.0,
        defaultDurationMinutes: 90,
        isCustom: false,
      },
    }),
    prisma.exercise.upsert({
      where: { id: '750e8400-e29b-41d4-a716-446655440023' },
      update: {},
      create: {
        id: '750e8400-e29b-41d4-a716-446655440023',
        name: 'Röplabda',
        category: 'Sport',
        metValue: 4.0,
        defaultDurationMinutes: 60,
        isCustom: false,
      },
    }),
    prisma.exercise.upsert({
      where: { id: '750e8400-e29b-41d4-a716-446655440024' },
      update: {},
      create: {
        id: '750e8400-e29b-41d4-a716-446655440024',
        name: 'Asztalitenisz',
        category: 'Sport',
        metValue: 4.0,
        defaultDurationMinutes: 30,
        isCustom: false,
      },
    }),
    // Gym activities
    prisma.exercise.upsert({
      where: { id: '750e8400-e29b-41d4-a716-446655440025' },
      update: {},
      create: {
        id: '750e8400-e29b-41d4-a716-446655440025',
        name: 'Súlyzós edzés',
        category: 'Edzőterem',
        metValue: 6.0,
        defaultDurationMinutes: 45,
        isCustom: false,
      },
    }),
    prisma.exercise.upsert({
      where: { id: '750e8400-e29b-41d4-a716-446655440026' },
      update: {},
      create: {
        id: '750e8400-e29b-41d4-a716-446655440026',
        name: 'Taposógép',
        category: 'Edzőterem',
        metValue: 9.0,
        defaultDurationMinutes: 20,
        isCustom: false,
      },
    }),
    prisma.exercise.upsert({
      where: { id: '750e8400-e29b-41d4-a716-446655440027' },
      update: {},
      create: {
        id: '750e8400-e29b-41d4-a716-446655440027',
        name: 'Evezőgép',
        category: 'Edzőterem',
        metValue: 7.0,
        defaultDurationMinutes: 20,
        isCustom: false,
      },
    }),
    // Home workout
    prisma.exercise.upsert({
      where: { id: '750e8400-e29b-41d4-a716-446655440028' },
      update: {},
      create: {
        id: '750e8400-e29b-41d4-a716-446655440028',
        name: 'Burpees',
        category: 'Otthoni edzés',
        metValue: 8.0,
        defaultDurationMinutes: 10,
        isCustom: false,
      },
    }),
    prisma.exercise.upsert({
      where: { id: '750e8400-e29b-41d4-a716-446655440029' },
      update: {},
      create: {
        id: '750e8400-e29b-41d4-a716-446655440029',
        name: 'Jumping Jacks',
        category: 'Otthoni edzés',
        metValue: 8.0,
        defaultDurationMinutes: 10,
        isCustom: false,
      },
    }),
    prisma.exercise.upsert({
      where: { id: '750e8400-e29b-41d4-a716-446655440030' },
      update: {},
      create: {
        id: '750e8400-e29b-41d4-a716-446655440030',
        name: 'Mountain Climbers',
        category: 'Otthoni edzés',
        metValue: 8.0,
        defaultDurationMinutes: 10,
        isCustom: false,
      },
    }),
    prisma.exercise.upsert({
      where: { id: '750e8400-e29b-41d4-a716-446655440031' },
      update: {},
      create: {
        id: '750e8400-e29b-41d4-a716-446655440031',
        name: 'Kitörés',
        category: 'Otthoni edzés',
        metValue: 4.0,
        defaultDurationMinutes: 15,
        isCustom: false,
      },
    }),
    prisma.exercise.upsert({
      where: { id: '750e8400-e29b-41d4-a716-446655440032' },
      update: {},
      create: {
        id: '750e8400-e29b-41d4-a716-446655440032',
        name: 'Felülés',
        category: 'Otthoni edzés',
        metValue: 3.8,
        defaultDurationMinutes: 10,
        isCustom: false,
      },
    }),
  ]);

  // Create today's daily goal
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  await prisma.dailyGoal.upsert({
    where: {
      user_id_date: {
        user_id: testUser.id,
        date: today,
      },
    },
    update: {},
    create: {
      user_id: testUser.id,
      date: today,
      caloriesGoal: 2000,
      proteinGoal: 150,
      fatGoal: 67,
      carbsGoal: 250,
    },
  });

  // Create some food logs for today
  await Promise.all([
    prisma.userFoodLog.upsert({
      where: { id: '850e8400-e29b-41d4-a716-446655440001' },
      update: {},
      create: {
        id: '850e8400-e29b-41d4-a716-446655440001',
        user_id: testUser.id,
        foodItem_id: foodItems[0].id, // Banán
        logDate: today,
        mealType_id: mealTypes[0].id, // Reggeli
        quantity: 2,
        createdAt: new Date(today.getTime() + 8 * 60 * 60 * 1000), // 8 AM
      },
    }),
    prisma.userFoodLog.upsert({
      where: { id: '850e8400-e29b-41d4-a716-446655440002' },
      update: {},
      create: {
        id: '850e8400-e29b-41d4-a716-446655440002',
        user_id: testUser.id,
        foodItem_id: foodItems[1].id, // Csirkemell
        logDate: today,
        mealType_id: mealTypes[1].id, // Ebéd
        quantity: 1.5,
        createdAt: new Date(today.getTime() + 12 * 60 * 60 * 1000), // 12 PM
      },
    }),
    prisma.userFoodLog.upsert({
      where: { id: '850e8400-e29b-41d4-a716-446655440003' },
      update: {},
      create: {
        id: '850e8400-e29b-41d4-a716-446655440003',
        user_id: testUser.id,
        foodItem_id: foodItems[2].id, // Barna rizs
        logDate: today,
        mealType_id: mealTypes[2].id, // Vacsora
        quantity: 1,
        createdAt: new Date(today.getTime() + 18 * 60 * 60 * 1000), // 6 PM
      },
    }),
  ]);

  // Create some exercise logs
  await Promise.all([
    prisma.userExerciseLog.upsert({
      where: { id: '950e8400-e29b-41d4-a716-446655440001' },
      update: {},
      create: {
        id: '950e8400-e29b-41d4-a716-446655440001',
        user_id: testUser.id,
        exercise_id: exercises[0].id, // Futás
        durationMinutes: 30,
        caloriesBurned: 300,
        logDate: today,
        createdAt: new Date(today.getTime() + 7 * 60 * 60 * 1000), // 7 AM
      },
    }),
    prisma.userExerciseLog.upsert({
      where: { id: '950e8400-e29b-41d4-a716-446655440002' },
      update: {},
      create: {
        id: '950e8400-e29b-41d4-a716-446655440002',
        user_id: testUser.id,
        exercise_id: exercises[1].id, // Fekvőtámasz
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
