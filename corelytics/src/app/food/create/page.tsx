'use client'

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { trpc } from "@/lib/trpc";
import Header from "@/components/header";
import Footer from "@/components/footer";
import {
  PlusCircleIcon,
  ArrowLeftIcon,
  BeakerIcon,
  ScaleIcon,
  FireIcon,
  CheckCircleIcon,
  XCircleIcon
} from '@heroicons/react/24/outline';
import {
  SparklesIcon
} from '@heroicons/react/24/solid';

interface FoodFormData {
  name: string;
  brand?: string;
  servingSizeGrams: number;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber?: number;
  sugar?: number;
  sodium?: number;
}

export default function CreateFoodPage() {
  const { status } = useSession();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch
  } = useForm<FoodFormData>({
    defaultValues: {
      servingSizeGrams: 100,
      calories: 0,
      protein: 0,
      carbs: 0,
      fat: 0,
    }
  });

  const createFoodMutation = trpc.food.createCustomFood.useMutation({
    onSuccess: () => {
      setShowSuccess(true);
      setTimeout(() => {
        setShowSuccess(false);
        router.push('/food/log');
      }, 2000);
    },
    onError: (error) => {
      console.error('Error creating food:', error);
      alert('Failed to create food item. Please try again.');
    }
  });

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin");
    }
  }, [status, router]);

  const onSubmit = async (data: FoodFormData) => {
    setIsSubmitting(true);
    try {
      await createFoodMutation.mutateAsync({
        name: data.name,
        brand: data.brand || undefined,
        servingSizeGrams: Number(data.servingSizeGrams),
        calories: Number(data.calories),
        protein: Number(data.protein),
        carbs: Number(data.carbs),
        fat: Number(data.fat),
        fiber: data.fiber ? Number(data.fiber) : undefined,
        sugar: data.sugar ? Number(data.sugar) : undefined,
        sodium: data.sodium ? Number(data.sodium) : undefined,
      });
    } catch (error) {
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Calculate total calories from macros for validation
  const protein = watch('protein') || 0;
  const carbs = watch('carbs') || 0;
  const fat = watch('fat') || 0;
  const calculatedCalories = (Number(protein) * 4) + (Number(carbs) * 4) + (Number(fat) * 9);

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (status === "unauthenticated") {
    return null;
  }

  return (
    <>
      <Header />
      <div className="min-h-screen bg-gray-50">
        {/* Header Section */}
        <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => router.back()}
                  className="p-2 bg-white/10 rounded-lg hover:bg-white/20 transition-colors"
                >
                  <ArrowLeftIcon className="h-6 w-6" />
                </button>
                <div className="h-16 w-16 bg-white/10 rounded-full flex items-center justify-center">
                  <SparklesIcon className="h-8 w-8 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold">
                    Egyedi Étel Létrehozása
                  </h1>
                  <p className="text-purple-100 mt-1">
                    Adja hozzá saját ételeit az adatbázishoz
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Success Message */}
        {showSuccess && (
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
            <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-center space-x-3">
              <CheckCircleIcon className="h-6 w-6 text-green-600 flex-shrink-0" />
              <div>
                <p className="text-green-900 font-medium">Étel sikeresen létrehozva!</p>
                <p className="text-green-700 text-sm">Átirányítás az étkezési naplóhoz...</p>
              </div>
            </div>
          </div>
        )}

        {/* Main Form */}
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Basic Information Card */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center space-x-3 mb-6">
                <BeakerIcon className="h-6 w-6 text-purple-600" />
                <h2 className="text-xl font-semibold text-gray-900">Alapvető Információk</h2>
              </div>

              <div className="space-y-4">
                {/* Food Name */}
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                    Étel Neve <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="name"
                    {...register('name', { 
                      required: 'Az étel neve kötelező',
                      minLength: { value: 2, message: 'A névnek legalább 2 karakter hosszúnak kell lennie' }
                    })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="pl. Házi Tészta"
                  />
                  {errors.name && (
                    <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
                  )}
                </div>

                {/* Brand */}
                <div>
                  <label htmlFor="brand" className="block text-sm font-medium text-gray-700 mb-1">
                    Márka (Opcionális)
                  </label>
                  <input
                    type="text"
                    id="brand"
                    {...register('brand')}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="pl. Általános, Házi"
                  />
                </div>

                {/* Serving Size */}
                <div>
                  <label htmlFor="servingSizeGrams" className="block text-sm font-medium text-gray-700 mb-1">
                    Adag Mérete (gramm) <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      id="servingSizeGrams"
                      step="0.1"
                      {...register('servingSizeGrams', { 
                        required: 'Az adag mérete kötelező',
                        min: { value: 0.1, message: 'Nullánál nagyobbnak kell lennie' }
                      })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      placeholder="100"
                    />
                    <ScaleIcon className="absolute right-3 top-2.5 h-5 w-5 text-gray-400" />
                  </div>
                  {errors.servingSizeGrams && (
                    <p className="mt-1 text-sm text-red-600">{errors.servingSizeGrams.message}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Nutrition Information Card */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center space-x-3 mb-6">
                <FireIcon className="h-6 w-6 text-orange-600" />
                <h2 className="text-xl font-semibold text-gray-900">Tápértékek</h2>
              </div>

              <div className="space-y-4">
                {/* Calories */}
                <div>
                  <label htmlFor="calories" className="block text-sm font-medium text-gray-700 mb-1">
                    Kalória <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    id="calories"
                    step="0.1"
                    {...register('calories', { 
                      required: 'A kalória megadása kötelező',
                      min: { value: 0, message: 'Nem lehet negatív' }
                    })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="0"
                  />
                  {errors.calories && (
                    <p className="mt-1 text-sm text-red-600">{errors.calories.message}</p>
                  )}
                  {calculatedCalories > 0 && (
                    <p className="mt-1 text-sm text-gray-500">
                      Makrókból számítva: ~{Math.round(calculatedCalories)} kcal
                    </p>
                  )}
                </div>

                {/* Macronutrients Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Protein */}
                  <div>
                    <label htmlFor="protein" className="block text-sm font-medium text-gray-700 mb-1">
                      Fehérje (g) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      id="protein"
                      step="0.1"
                      {...register('protein', { 
                        required: 'A fehérje megadása kötelező',
                        min: { value: 0, message: 'Nem lehet negatív' }
                      })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      placeholder="0"
                    />
                    {errors.protein && (
                      <p className="mt-1 text-sm text-red-600">{errors.protein.message}</p>
                    )}
                  </div>

                  {/* Carbs */}
                  <div>
                    <label htmlFor="carbs" className="block text-sm font-medium text-gray-700 mb-1">
                      Szénhidrát (g) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      id="carbs"
                      step="0.1"
                      {...register('carbs', { 
                        required: 'A szénhidrát megadása kötelező',
                        min: { value: 0, message: 'Nem lehet negatív' }
                      })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      placeholder="0"
                    />
                    {errors.carbs && (
                      <p className="mt-1 text-sm text-red-600">{errors.carbs.message}</p>
                    )}
                  </div>

                  {/* Fat */}
                  <div>
                    <label htmlFor="fat" className="block text-sm font-medium text-gray-700 mb-1">
                      Zsír (g) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      id="fat"
                      step="0.1"
                      {...register('fat', { 
                        required: 'A zsír megadása kötelező',
                        min: { value: 0, message: 'Nem lehet negatív' }
                      })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      placeholder="0"
                    />
                    {errors.fat && (
                      <p className="mt-1 text-sm text-red-600">{errors.fat.message}</p>
                    )}
                  </div>
                </div>

                {/* Additional Carb Details */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="fiber" className="block text-sm font-medium text-gray-700 mb-1">
                      Rost (g)
                    </label>
                    <input
                      type="number"
                      id="fiber"
                      step="0.1"
                      {...register('fiber', { min: { value: 0, message: 'Nem lehet negatív' } })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      placeholder="0"
                    />
                  </div>

                  <div>
                    <label htmlFor="sugar" className="block text-sm font-medium text-gray-700 mb-1">
                      Cukor (g)
                    </label>
                    <input
                      type="number"
                      id="sugar"
                      step="0.1"
                      {...register('sugar', { min: { value: 0, message: 'Nem lehet negatív' } })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      placeholder="0"
                    />
                  </div>
                </div>

                {/* Sodium */}
                <div>
                  <label htmlFor="sodium" className="block text-sm font-medium text-gray-700 mb-1">
                    Nátrium (mg)
                  </label>
                  <input
                    type="number"
                    id="sodium"
                    step="0.1"
                    {...register('sodium', { min: { value: 0, message: 'Nem lehet negatív' } })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="0"
                  />
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-end space-x-4">
              <button
                type="button"
                onClick={() => router.back()}
                className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors font-medium"
              >
                Mégse
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 transition-colors font-medium flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    <span>Létrehozás...</span>
                  </>
                ) : (
                  <>
                    <PlusCircleIcon className="h-5 w-5" />
                    <span>Étel Létrehozása</span>
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Info Box */}
          <div className="mt-8 bg-blue-50 border border-blue-200 rounded-xl p-6">
            <h3 className="text-sm font-semibold text-blue-900 mb-2">💡 Tippek Étel Létrehozásához</h3>
            <ul className="space-y-2 text-sm text-blue-800">
              <li>• Minden értéknek a megadott adagmérethez kell tartoznia</li>
              <li>• Használja a csomagoláson található tápértéktáblázatot referenciaként</li>
              <li>• A kalkulátor becsült kalóriát mutat a makrókból (Fehérje: 4 kcal/g, Szénhidrát: 4 kcal/g, Zsír: 9 kcal/g)</li>
              <li>• Később bármikor szerkesztheti egyedi ételeit</li>
              <li>• Az egyedi ételek privátak és csak Ön számára láthatók</li>
            </ul>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
}
