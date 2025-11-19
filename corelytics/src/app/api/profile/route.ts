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

// Helper function to calculate age from birth date
function calculateAge(birthDate: Date): number {
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  
  return age;
}

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
    // For 'other', use average of male and female
    bmr = 10 * weightKg + 6.25 * heightCm - 5 * age - 78;
  }

  // Activity level multipliers
  // 1: Sedentary (little or no exercise) - 1.2
  // 2: Lightly active (exercise 1-3 days/week) - 1.375
  // 3: Moderately active (exercise 3-5 days/week) - 1.55
  // 4: Very active (exercise 6-7 days/week) - 1.725
  const activityMultipliers: { [key: number]: number } = {
    1: 1.2,
    2: 1.375,
    3: 1.55,
    4: 1.725,
  };

  const activityMultiplier = activityMultipliers[activityLevelId] || 1.2;
  const tdee = bmr * activityMultiplier; // Total Daily Energy Expenditure

  // Adjust based on goal
  // 1: Weight loss (Fogyás) - subtract 500 cal (lose ~0.5kg/week)
  // 2: Maintain weight (Súlytartás) - no change
  // 3: Weight gain (Hízás) - add 500 cal (gain ~0.5kg/week)
  let caloriesGoal: number;
  
  if (goalId === 1) {
    // Weight loss
    caloriesGoal = tdee - 500;
  } else if (goalId === 3) {
    // Weight gain
    caloriesGoal = tdee + 500;
  } else {
    // Maintain
    caloriesGoal = tdee;
  }

  // Ensure minimum calories (1200 for women, 1500 for men)
  const minCalories = gender === 'female' ? 1200 : gender === 'male' ? 1500 : 1350;
  caloriesGoal = Math.max(caloriesGoal, minCalories);

  // Calculate macronutrient goals
  // Protein: 1.6-2.2g per kg body weight (use 1.8g average for active individuals)
  const proteinGoal = weightKg * 1.8;
  
  // Fat: 25-30% of total calories (use 30%)
  const fatCalories = caloriesGoal * 0.30;
  const fatGoal = fatCalories / 9; // 9 calories per gram of fat
  
  // Carbs: Remaining calories
  const proteinCalories = proteinGoal * 4; // 4 calories per gram of protein
  const remainingCalories = caloriesGoal - proteinCalories - fatCalories;
  const carbsGoal = remainingCalories / 4; // 4 calories per gram of carbs

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

    // Ensure user can only create/update their own profile
    if (validatedData.userId !== session.user.id) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      )
    }

    // Check if profile already exists
    const existingProfile = await prisma.userProfile.findUnique({
      where: { user_id: validatedData.userId }
    })

    let profile
    if (existingProfile) {
      // Update existing profile
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
      // Create new profile
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

    // Check if profile is complete and calculate daily goals
    const isComplete = !!(
      validatedData.birthDate &&
      validatedData.gender &&
      validatedData.heightCm &&
      validatedData.weightKg &&
      validatedData.activityLevelId &&
      validatedData.goalId
    );

    if (isComplete) {
      // Calculate age from birth date
      const age = calculateAge(validatedData.birthDate!);
      
      // Calculate daily nutritional goals
      const goals = calculateDailyGoals(
        age,
        validatedData.gender!,
        validatedData.heightCm!,
        validatedData.weightKg!,
        validatedData.activityLevelId!,
        validatedData.goalId!
      );

      // Create or update today's daily goal
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
        message: 'Profile completed and daily goals calculated successfully!'
      });
    }

    return NextResponse.json(profile)
  } catch (error) {
    console.error('Error creating/updating profile:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.issues },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to create/update profile' },
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
      where: { user_id: session.user.id },
      include: {
        activityLevel: true,
        goal: true,
      }
    })

    if (!profile) {
      return NextResponse.json(
        { error: 'Profile not found' },
        { status: 404 }
      )
    }

    const response = NextResponse.json(profile)
    return response
  } catch (error) {
    console.error('Error fetching profile:', error)
    return NextResponse.json(
      { error: 'Failed to fetch profile' },
      { status: 500 }
    )
  }
}
