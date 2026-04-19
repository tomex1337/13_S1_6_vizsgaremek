import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { z } from 'zod'
import { Decimal } from '@prisma/client/runtime/library'

const profileSchema = z.object({
  userId: z.string(),
  birthDate: z.string()
    .optional()
    .transform(val => val ? new Date(val) : undefined),
  gender: z.enum(["male", "female", "other"]).optional(),
  heightCm: z.number().min(50).max(300).optional(),
  weightKg: z.number().min(20).max(500).optional(),
  activityLevelId: z.number().optional(),
  goalId: z.number().optional(),
})

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
  activityLevelName: string | null | undefined,
  goalName: string | null | undefined
) {
  // BMR (Alapanyagcsere) számítása a Mifflin-St Jeor egyenlet alapján
  let bmr: number;
  
  if (gender === 'male') {
    bmr = 10 * weightKg + 6.25 * heightCm - 5 * age + 5;
  } else if (gender === 'female') {
    bmr = 10 * weightKg + 6.25 * heightCm - 5 * age - 161;
  } else {
    // 'other' esetén használd a férfi és női érték átlagát
    bmr = 10 * weightKg + 6.25 * heightCm - 5 * age - 78;
  }

  const normalizedActivity = (activityLevelName ?? '').toLocaleLowerCase('hu-HU');
  const normalizedGoal = (goalName ?? '').toLocaleLowerCase('hu-HU');

  const activityMultiplier = normalizedActivity.includes('enyhén')
    ? 1.375
    : normalizedActivity.includes('mérsékelten')
      ? 1.55
      : normalizedActivity.includes('nagyon')
        ? 1.725
        : 1.2;
  const tdee = bmr * activityMultiplier; // Teljes napi energiafelhasználás

  // Cél alapján módosítás
  // Fogyás - 500 kal levonása (~0.5kg/hét fogyás)
  // Súlytartás - nincs változás
  // Hízás - 500 kal hozzáadása (~0.5kg/hét növekedés)
  let caloriesGoal: number;
  
  if (normalizedGoal.includes('fogyás')) {
    // Fogyás
    caloriesGoal = tdee - 500;
  } else if (normalizedGoal.includes('hízás')) {
    // Hízás
    caloriesGoal = tdee + 500;
  } else {
    // Súlytartás
    caloriesGoal = tdee;
  }

  // Minimális kalória biztosítása (1200 nőknek, 1500 férfiaknak)
  const minCalories = gender === 'female' ? 1200 : gender === 'male' ? 1500 : 1350;
  caloriesGoal = Math.max(caloriesGoal, minCalories);

  // Makrotápanyag célok számítása
  // Fehérje: Dinamikus aktivitási szint és cél alapján
  // Alap: 0.8g/kg (ülő életmód, súlytartás)
  // Növelés aktivitásra: +0.4g/kg (enyhén aktív), +0.6g/kg (mérsékelten aktív), +1.0g/kg (nagyon aktív)
  // Növelés célokra: +0.2g/kg (fogyás - izomtömeg megőrzése), +0.4g/kg (hízás - izomépítés)
  
  let proteinMultiplier = 0.8; // Alap ülő életmódhoz
  
  // Aktivitási szint alapján módosítás
  if (normalizedActivity.includes('enyhén')) {
    proteinMultiplier += 0.4; // Enyhén aktív
  } else if (normalizedActivity.includes('mérsékelten')) {
    proteinMultiplier += 0.6; // Mérsékelten aktív
  } else if (normalizedActivity.includes('nagyon')) {
    proteinMultiplier += 1.0; // Nagyon aktív
  }
  
  // Cél alapján módosítás
  if (normalizedGoal.includes('fogyás')) {
    proteinMultiplier += 0.2; // Fogyás - izomtömeg megőrzése
  } else if (normalizedGoal.includes('hízás')) {
    proteinMultiplier += 0.4; // Hízás - izomépítés
  }
  
  const proteinGoal = weightKg * proteinMultiplier;
  
  // Zsír: 25-30% az összes kalóriából (30% használata)
  const fatCalories = caloriesGoal * 0.30;
  const fatGoal = fatCalories / 9; // 9 kalória grammnonként zsírból
  
  // Szénhidrát: Maradék kalóriák
  const proteinCalories = proteinGoal * 4; // 4 kalória grammonként fehérjéből
  const remainingCalories = caloriesGoal - proteinCalories - fatCalories;
  const carbsGoal = remainingCalories / 4; // 4 kalória grammonként szénhidrátból

  return {
    caloriesGoal: Math.round(caloriesGoal),
    proteinGoal: Math.round(proteinGoal),
    fatGoal: Math.round(fatGoal),
    carbsGoal: Math.round(carbsGoal),
  };
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const validatedData = profileSchema.parse(body)

    // Biztosítsd, hogy a felhasználó csak a saját profilját hozhassa létre/frissíthesse
    if (validatedData.userId !== session.user.id) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      )
    }

    // Ellenőrizd, hogy létezik-e már a profil
    const existingProfile = await prisma.userProfile.findUnique({
      where: { user_id: validatedData.userId }
    })

    let profile
    if (existingProfile) {
      // Meglévő profil frissítése
      profile = await prisma.userProfile.update({
        where: { user_id: validatedData.userId },
        data: {
          birthDate: validatedData.birthDate,
          gender: validatedData.gender,
          heightCm: validatedData.heightCm,
          weightKg: validatedData.weightKg,
          activityLevel_id: validatedData.activityLevelId,
          goal_id: validatedData.goalId,
        }
      })
    } else {
      // Új profil létrehozása
      profile = await prisma.userProfile.create({
        data: {
          user_id: validatedData.userId,
          birthDate: validatedData.birthDate,
          gender: validatedData.gender,
          heightCm: validatedData.heightCm,
          weightKg: validatedData.weightKg,
          activityLevel_id: validatedData.activityLevelId,
          goal_id: validatedData.goalId,
        }
      })
    }

    // Ellenőrizd, hogy a profil teljes-e és számítsd ki a napi célokat
    const isComplete = !!(
      validatedData.birthDate &&
      validatedData.gender &&
      validatedData.heightCm &&
      validatedData.weightKg &&
      validatedData.activityLevelId &&
      validatedData.goalId
    );

    if (isComplete) {
      // Életkor számítása a születési dátumból
      const age = calculateAge(validatedData.birthDate!);

      const [activityLevel, goal] = await Promise.all([
        prisma.activityLevel.findUnique({
          where: { id: validatedData.activityLevelId! },
          select: { name: true },
        }),
        prisma.goal.findUnique({
          where: { id: validatedData.goalId! },
          select: { name: true },
        }),
      ]);
      
      // Napi táplálkozási célok számítása
      const goals = calculateDailyGoals(
        age,
        validatedData.gender!,
        validatedData.heightCm!,
        validatedData.weightKg!,
        activityLevel?.name,
        goal?.name
      );

      // Mai napi cél létrehozása vagy frissítése
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      await prisma.dailyGoal.upsert({
        where: {
          user_id_date: {
            user_id: validatedData.userId,
            date: today,
          },
        },
        update: {
          caloriesGoal: goals.caloriesGoal,
          proteinGoal: new Decimal(goals.proteinGoal),
          fatGoal: new Decimal(goals.fatGoal),
          carbsGoal: new Decimal(goals.carbsGoal),
        },
        create: {
          user_id: validatedData.userId,
          date: today,
          caloriesGoal: goals.caloriesGoal,
          proteinGoal: new Decimal(goals.proteinGoal),
          fatGoal: new Decimal(goals.fatGoal),
          carbsGoal: new Decimal(goals.carbsGoal),
        },
      });

      return NextResponse.json({
        profile,
        dailyGoals: goals,
        message: 'Profil sikeresen kitöltve és napi célok kiszámítva!'
      });
    }

    return NextResponse.json(profile)
  } catch (error) {
    console.error('Error creating/updating profile:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validációs hiba', details: error.issues },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Nem sikerült létrehozni/frissíteni a profilt' },
      { status: 500 }
    )
  }
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const profile = await prisma.userProfile.findUnique({
      where: { user_id: session.user.id },
      include: {
        activityLevel: true,
        goal: true,
      }
    })

    if (!profile) {
      return NextResponse.json(
        { error: 'Profil nem található' },
        { status: 404 }
      )
    }

    const response = NextResponse.json(profile)
    return response
  } catch (error) {
    console.error('Error fetching profile:', error)
    return NextResponse.json(
      { error: 'Nem sikerült betölteni a profilt' },
      { status: 500 }
    )
  }
}
