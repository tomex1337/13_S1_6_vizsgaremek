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
  CheckCircleIcon
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
  fiber: number;
  sugar: number;
  sodium?: number;
}

export default function CreateFoodPage() {
  const { status } = useSession();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showError, setShowError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch
  } = useForm<FoodFormData>({
    defaultValues: {
      servingSizeGrams: 100,
      calories: 0,
      protein: 0,
      carbs: 0,
      fat: 0,
      fiber: 0,
      sugar: 0,
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
      setErrorMessage('Nem sikerült létrehozni az ételt. Kérjük, próbálja újra.');
      setShowError(true);
      setTimeout(() => setShowError(false), 5000);
    }
  });

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin");
    }
  }, [status, router]);

  const onSubmit = async (data: FoodFormData) => {
    // Validate macro weight doesn't exceed serving size
    const macroWeight = Number(data.protein) + Number(data.carbs) + Number(data.fat);
    if (macroWeight > Number(data.servingSizeGrams)) {
      setErrorMessage(`A makrók összesített súlya (${Math.round(macroWeight)}g) nem lehet nagyobb, mint az adagméret (${data.servingSizeGrams}g)`);
      setShowError(true);
      setTimeout(() => setShowError(false), 5000);
      return;
    }

    // Validate sugar doesn't exceed carbs
    if (data.sugar && Number(data.sugar) > Number(data.carbs)) {
      setErrorMessage(`A cukor (${data.sugar}g) nem lehet több, mint a szénhidrát (${data.carbs}g)`);
      setShowError(true);
      setTimeout(() => setShowError(false), 5000);
      return;
    }

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
        fiber: Number(data.fiber),
        sugar: Number(data.sugar),
        sodium: data.sodium ? Number(data.sodium) : undefined,
      });
    } catch (error) {
      console.error(error);
      setErrorMessage('Nem sikerült létrehozni az ételt. Kérjük, próbálja újra.');
      setShowError(true);
      setTimeout(() => setShowError(false), 5000);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Calculate total calories from macros for validation
  const protein = watch('protein') || 0;
  const carbs = watch('carbs') || 0;
  const fat = watch('fat') || 0;
  const sugar = watch('sugar') || 0;
  const servingSizeGrams = watch('servingSizeGrams') || 100;
  const calculatedCalories = (Number(protein) * 4) + (Number(carbs) * 4) + (Number(fat) * 9);
  const totalMacroWeight = Number(protein) + Number(carbs) + Number(fat);

  // Check if there are any validation warnings
  const hasWarnings = totalMacroWeight > servingSizeGrams || (sugar > 0 && Number(sugar) > Number(carbs));

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

        {/* Error Message */}
        {showError && (
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="flex-shrink-0">
                  <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <p className="text-red-900 font-medium">Hiba történt!</p>
                  <p className="text-red-700 text-sm">{errorMessage}</p>
                </div>
              </div>
              <button
                onClick={() => setShowError(false)}
                className="text-red-400 hover:text-red-600 transition-colors"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        )}

        {/* Main Form */}
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <form onSubmit={handleSubmit(onSubmit, (errors) => {
            // Handle validation errors
            const firstError = Object.values(errors)[0];
            if (firstError) {
              setErrorMessage(firstError.message || 'Kérjük, töltse ki az összes kötelező mezőt');
              setShowError(true);
              setTimeout(() => setShowError(false), 5000);
            }
          })} className="space-y-6">
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
                      required: 'Étel neve: Ez a mező kötelező',
                      minLength: { value: 2, message: 'Étel neve: Legalább 2 karakter hosszúnak kell lennie' }
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
                        required: 'Adag mérete: Ez a mező kötelező',
                        min: { value: 0.1, message: 'Adag mérete: Nullánál nagyobbnak kell lennie' }
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
                      required: 'Kalória: Ez a mező kötelező',
                      min: { value: 0.1, message: 'Kalória: Nullánál nagyobbnak kell lennie' }
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
                        required: 'Fehérje: Ez a mező kötelező',
                        min: { value: 0.1, message: 'Fehérje: Nullánál nagyobbnak kell lennie' }
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
                        required: 'Szénhidrát: Ez a mező kötelező',
                        min: { value: 0.1, message: 'Szénhidrát: Nullánál nagyobbnak kell lennie' }
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
                        required: 'Zsír: Ez a mező kötelező',
                        min: { value: 0.1, message: 'Zsír: Nullánál nagyobbnak kell lennie' }
                      })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      placeholder="0"
                    />
                    {errors.fat && (
                      <p className="mt-1 text-sm text-red-600">{errors.fat.message}</p>
                    )}
                  </div>
                </div>

                {/* Macro Weight Validation Warning */}
                {totalMacroWeight > servingSizeGrams && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                    <p className="text-sm text-yellow-800">
                      ⚠️ A makrók összesített súlya ({Math.round(totalMacroWeight)}g) nagyobb, mint az adagméret ({servingSizeGrams}g). Kérjük, ellenőrizze az értékeket.
                    </p>
                  </div>
                )}

                {/* Additional Carb Details */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="fiber" className="block text-sm font-medium text-gray-700 mb-1">
                      Rost (g) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      id="fiber"
                      step="0.1"
                      {...register('fiber', { 
                        required: 'Rost: Ez a mező kötelező',
                        min: { value: 0, message: 'Rost: Nem lehet negatív' },
                        validate: (value) => value !== null && value !== undefined || 'Rost: Ez a mező kötelező'
                      })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      placeholder="0"
                    />
                    {errors.fiber && (
                      <p className="mt-1 text-sm text-red-600">{errors.fiber.message}</p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="sugar" className="block text-sm font-medium text-gray-700 mb-1">
                      Cukor (g) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      id="sugar"
                      step="0.1"
                      {...register('sugar', { 
                        required: 'Cukor: Ez a mező kötelező',
                        min: { value: 0, message: 'Cukor: Nem lehet negatív' },
                        validate: (value) => {
                          if (value === null || value === undefined) return 'Cukor: Ez a mező kötelező';
                          const carbsValue = Number(carbs);
                          if (Number(value) > carbsValue) {
                            return 'Cukor: Nem haladhatja meg a szénhidrát értékét';
                          }
                          return true;
                        }
                      })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      placeholder="0"
                    />
                    {errors.sugar && (
                      <p className="mt-1 text-sm text-red-600">{errors.sugar.message}</p>
                    )}
                    {sugar > 0 && Number(sugar) > Number(carbs) && (
                      <p className="mt-1 text-sm text-yellow-600">
                        ⚠️ Cukor: A cukor ({sugar}g) nem lehet több, mint a szénhidrát ({carbs}g)
                      </p>
                    )}
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
                    {...register('sodium', { min: { value: 0, message: 'Nátrium: Nem lehet negatív' } })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="0"
                  />
                  {errors.sodium && (
                    <p className="mt-1 text-sm text-red-600">{errors.sodium.message}</p>
                  )}
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
                disabled={isSubmitting || hasWarnings}
                className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 transition-colors font-medium flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
                title={hasWarnings ? 'Kérjük, javítsa a validációs figyelmeztetéseket' : ''}
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
            {hasWarnings && (
              <div className="flex justify-end">
                <p className="text-sm text-red-600 mt-2">
                  ⚠️ A létrehozás gomb le van tiltva mert nincs minden megfelően kitőltve.
                </p>
              </div>
            )}
          </form>

          {/* Info Box */}
          <div className="mt-8 bg-blue-50 border border-blue-200 rounded-xl p-6">
            <h3 className="text-sm font-semibold text-blue-900 mb-2">💡 Tippek Étel Létrehozásához</h3>
            <ul className="space-y-2 text-sm text-blue-800">
              <li>• Minden értéknek a megadott adagmérethez kell tartoznia</li>
              <li>• Használja a csomagoláson található tápértéktáblázatot referenciaként</li>
              <li>• A kalkulátor becsült kalóriát mutat a makrókból (Fehérje: 4 kcal/g, Szénhidrát: 4 kcal/g, Zsír: 9 kcal/g)</li>
              <li>• A makrók összesített súlya (fehérje + szénhidrát + zsír) nem haladhatja meg az adagméretet</li>
              <li>• A cukor értéke nem lehet nagyobb, mint a szénhidrát értéke</li>
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
