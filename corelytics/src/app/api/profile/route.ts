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
    // 'other' esetén használd a férfi és női érték átlagát
    bmr = 10 * weightKg + 6.25 * heightCm - 5 * age - 78;
  }

  // Aktivitási szint szorzók
  // 1: Ülő életmód (kevés vagy nincs gyakorlat) - 1.2
  // 2: Enyhén aktív (edzés 1-3 nap/hét) - 1.375
  // 3: Mérsékelten aktív (edzés 3-5 nap/hét) - 1.55
  // 4: Nagyon aktív (edzés 6-7 nap/hét) - 1.725
  const activityMultipliers: { [key: number]: number } = {
    2: 1.2,    // Ülő életmód
    4: 1.375,  // Enyhén aktív
    3: 1.55,   // Mérsékelten aktív
    1: 1.725,  // Nagyon aktív
  };

  const activityMultiplier = activityMultipliers[activityLevelId] || 1.2;
  const tdee = bmr * activityMultiplier; // Teljes napi energiafelhasználás

  // Cél alapján módosítás
  // 1: Hízás - 500 kal hozzáadása (~0.5kg/hét növekedés)
  // 2: Súlytartás - nincs változás
  // 3: Fogyás - 500 kal levonása (~0.5kg/hét fogyás)
  let caloriesGoal: number;
  
  if (goalId === 1) {
    // Hízás
    caloriesGoal = tdee + 500;
  } else if (goalId === 3) {
    // Fogyás
    caloriesGoal = tdee - 500;
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
      where: { userId: validatedData.userId }
    })

    let profile
    if (existingProfile) {
      // Meglévő profil frissítése
      profile = await prisma.userProfile.update({
        where: { userId: validatedData.userId },
        data: {
          birthDate: validatedData.birthDate,
          gender: validatedData.gender,
          heightCm: validatedData.heightCm,
          weightKg: validatedData.weightKg,
          activityLevelId: validatedData.activityLevelId,
          goalId: validatedData.goalId,
        }
      })
    } else {
      // Új profil létrehozása
      profile = await prisma.userProfile.create({
        data: {
          userId: validatedData.userId,
          birthDate: validatedData.birthDate,
          gender: validatedData.gender,
          heightCm: validatedData.heightCm,
          weightKg: validatedData.weightKg,
          activityLevelId: validatedData.activityLevelId,
          goalId: validatedData.goalId,
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
      
      // Napi táplálkozási célok számítása
      const goals = calculateDailyGoals(
        age,
        validatedData.gender!,
        validatedData.heightCm!,
        validatedData.weightKg!,
        validatedData.activityLevelId!,
        validatedData.goalId!
      );

      // Mai napi cél létrehozása vagy frissítése
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      await prisma.dailyGoal.upsert({
        where: {
          userId_date: {
            userId: validatedData.userId,
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
          userId: validatedData.userId,
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

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const profile = await prisma.userProfile.findUnique({
      where: { userId: session.user.id },
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
