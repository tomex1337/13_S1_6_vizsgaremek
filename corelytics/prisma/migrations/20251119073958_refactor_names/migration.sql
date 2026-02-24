-- CreateTable
CREATE TABLE "public"."User" (
    "id" UUID NOT NULL,
    "email" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "created_at" TIMESTAMP(3),
    "updated_at" TIMESTAMP(3),
    "reset_token" TEXT,
    "reset_token_expiry" TIMESTAMP(3),

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."UserProfile" (
    "user_id" UUID NOT NULL,
    "birth_date" DATE,
    "gender" VARCHAR(10),
    "height_cm" INTEGER,
    "weight_kg" DECIMAL(5,2),
    "activityLevel_id" INTEGER,
    "goal_id" INTEGER,

    CONSTRAINT "UserProfile_pkey" PRIMARY KEY ("user_id")
);

-- CreateTable
CREATE TABLE "public"."FoodItem" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "brand" TEXT,
    "serving_size_grams" DECIMAL(65,30),
    "calories" DECIMAL(65,30),
    "protein" DECIMAL(65,30),
    "fat" DECIMAL(65,30),
    "carbs" DECIMAL(65,30),
    "fiber" DECIMAL(65,30),
    "sugar" DECIMAL(65,30),
    "sodium" DECIMAL(65,30),
    "is_custom" BOOLEAN NOT NULL DEFAULT false,
    "created_by" UUID,

    CONSTRAINT "FoodItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."UserFoodLog" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "foodItem_id" UUID NOT NULL,
    "logDate" DATE,
    "mealType_id" INTEGER,
    "quantity" DECIMAL(65,30),
    "created_at" TIMESTAMP(3),

    CONSTRAINT "UserFoodLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Exercise" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT,
    "met_value" DECIMAL(65,30),
    "default_duration_minutes" INTEGER,

    CONSTRAINT "Exercise_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."UserExerciseLog" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "exercise_id" UUID NOT NULL,
    "duration_minutes" INTEGER,
    "calories_burned" DECIMAL(65,30),
    "logDate" DATE,
    "created_at" TIMESTAMP(3),

    CONSTRAINT "UserExerciseLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."DailyGoal" (
    "user_id" UUID NOT NULL,
    "date" DATE NOT NULL,
    "calories_goal" INTEGER,
    "protein_goal" DECIMAL(65,30),
    "fat_goal" DECIMAL(65,30),
    "carbs_goal" DECIMAL(65,30),

    CONSTRAINT "DailyGoal_pkey" PRIMARY KEY ("user_id","date")
);

-- CreateTable
CREATE TABLE "public"."WeightLog" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "weight_kg" DECIMAL(65,30),
    "logged_at" DATE NOT NULL,

    CONSTRAINT "WeightLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."MealType" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "MealType_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ActivityLevel" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "ActivityLevel_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Goal" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "Goal_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "public"."User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "public"."User"("username");

-- CreateIndex
CREATE UNIQUE INDEX "MealType_name_key" ON "public"."MealType"("name");

-- CreateIndex
CREATE UNIQUE INDEX "ActivityLevel_name_key" ON "public"."ActivityLevel"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Goal_name_key" ON "public"."Goal"("name");

-- AddForeignKey
ALTER TABLE "public"."UserProfile" ADD CONSTRAINT "UserProfile_activityLevel_id_fkey" FOREIGN KEY ("activityLevel_id") REFERENCES "public"."ActivityLevel"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."UserProfile" ADD CONSTRAINT "UserProfile_goal_id_fkey" FOREIGN KEY ("goal_id") REFERENCES "public"."Goal"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."UserProfile" ADD CONSTRAINT "UserProfile_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."FoodItem" ADD CONSTRAINT "FoodItem_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."UserFoodLog" ADD CONSTRAINT "UserFoodLog_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."UserFoodLog" ADD CONSTRAINT "UserFoodLog_foodItem_id_fkey" FOREIGN KEY ("foodItem_id") REFERENCES "public"."FoodItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."UserFoodLog" ADD CONSTRAINT "UserFoodLog_mealType_id_fkey" FOREIGN KEY ("mealType_id") REFERENCES "public"."MealType"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."UserExerciseLog" ADD CONSTRAINT "UserExerciseLog_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."UserExerciseLog" ADD CONSTRAINT "UserExerciseLog_exercise_id_fkey" FOREIGN KEY ("exercise_id") REFERENCES "public"."Exercise"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."DailyGoal" ADD CONSTRAINT "DailyGoal_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."WeightLog" ADD CONSTRAINT "WeightLog_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
