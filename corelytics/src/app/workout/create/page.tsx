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
  FireIcon,
  ClockIcon,
  CheckCircleIcon,
  BoltIcon
} from '@heroicons/react/24/outline';
import {
  SparklesIcon
} from '@heroicons/react/24/solid';

interface ExerciseFormData {
  name: string;
  category?: string;
  metValue?: number;
  defaultDurationMinutes?: number;
}

export default function CreateWorkoutPage() {
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
  } = useForm<ExerciseFormData>({
    defaultValues: {
      metValue: 5,
      defaultDurationMinutes: 30
    }
  });

  const createExerciseMutation = trpc.workout.createCustomExercise.useMutation({
    onSuccess: () => {
      setShowSuccess(true);
      setTimeout(() => {
        setShowSuccess(false);
        router.push('/workout/log');
      }, 2000);
    },
    onError: (error) => {
      console.error('Error creating exercise:', error);
      setErrorMessage('Nem sikerült létrehozni az edzést. Kérjük, próbálja újra.');
      setShowError(true);
      setTimeout(() => setShowError(false), 5000);
    }
  });

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin");
    }
  }, [status, router]);

  const onSubmit = async (data: ExerciseFormData) => {
    setIsSubmitting(true);
    try {
      await createExerciseMutation.mutateAsync({
        name: data.name,
        category: data.category || undefined,
        metValue: data.metValue ? Number(data.metValue) : undefined,
        defaultDurationMinutes: data.defaultDurationMinutes ? Number(data.defaultDurationMinutes) : undefined,
      });
    } catch (error) {
      console.error(error);
      setErrorMessage('Nem sikerült létrehozni az edzést. Kérjük, próbálja újra.');
      setShowError(true);
      setTimeout(() => setShowError(false), 5000);
    } finally {
      setIsSubmitting(false);
    }
  };

  // MET érték figyelése kalóriabecsléshez
  const metValue = watch('metValue') || 5;
  const durationMinutes = watch('defaultDurationMinutes') || 30;
  // Becsült kalóriák egy 70 kg-os személyre
  const estimatedCalories = Math.round(Number(metValue) * 70 * (Number(durationMinutes) / 60));

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
        <div className="bg-gradient-to-r from-orange-600 to-red-600 text-white">
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
                    Egyedi Edzés Létrehozása
                  </h1>
                  <p className="text-orange-100 mt-1">
                    Adja hozzá saját edzéseit az adatbázishoz
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
                <p className="text-green-900 font-medium">Edzés sikeresen létrehozva!</p>
                <p className="text-green-700 text-sm">Átirányítás az edzésnaplóhoz...</p>
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
            // Validációs hibák kezelése
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
                <BoltIcon className="h-6 w-6 text-orange-600" />
                <h2 className="text-xl font-semibold text-gray-900">Alapvető Információk</h2>
              </div>

              <div className="space-y-4">
                {/* Exercise Name */}
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                    Edzés Neve <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="name"
                    {...register('name', { 
                      required: 'Edzés neve: Ez a mező kötelező',
                      minLength: { value: 2, message: 'Edzés neve: Legalább 2 karakter hosszúnak kell lennie' }
                    })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    placeholder="pl. Futás, Kerékpározás, Úszás"
                  />
                  {errors.name && (
                    <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
                  )}
                </div>

                {/* Category */}
                <div>
                  <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">
                    Kategória (Opcionális)
                  </label>
                  <input
                    type="text"
                    id="category"
                    {...register('category')}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    placeholder="pl. Kardió, Erősítés, Yoga"
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Ha nem ad meg kategóriát, az &quot;Egyéni&quot; kategóriába kerül
                  </p>
                </div>
              </div>
            </div>

            {/* Exercise Details Card */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center space-x-3 mb-6">
                <FireIcon className="h-6 w-6 text-orange-600" />
                <h2 className="text-xl font-semibold text-gray-900">Edzés Részletei</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* MET Value */}
                <div>
                  <label htmlFor="metValue" className="block text-sm font-medium text-gray-700 mb-1">
                    MET Érték (Opcionális)
                  </label>
                  <input
                    type="number"
                    id="metValue"
                    step="0.1"
                    min="1"
                    max="25"
                    {...register('metValue', { 
                      min: { value: 1, message: 'MET érték: Legalább 1 kell legyen' },
                      max: { value: 25, message: 'MET érték: Maximum 25 lehet' }
                    })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    placeholder="5"
                  />
                  {errors.metValue && (
                    <p className="mt-1 text-sm text-red-600">{errors.metValue.message}</p>
                  )}
                  <p className="mt-1 text-xs text-gray-500">
                    A MET (metabolikus ekvivalens) az edzés intenzitását jelzi. Alapértelmezett: 5
                  </p>
                </div>

                {/* Default Duration */}
                <div>
                  <label htmlFor="defaultDurationMinutes" className="block text-sm font-medium text-gray-700 mb-1">
                    Alapértelmezett Időtartam (perc)
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      id="defaultDurationMinutes"
                      min="1"
                      {...register('defaultDurationMinutes', { 
                        min: { value: 1, message: 'Időtartam: Legalább 1 perc kell legyen' }
                      })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      placeholder="30"
                    />
                    <ClockIcon className="absolute right-3 top-2.5 h-5 w-5 text-gray-400" />
                  </div>
                  {errors.defaultDurationMinutes && (
                    <p className="mt-1 text-sm text-red-600">{errors.defaultDurationMinutes.message}</p>
                  )}
                </div>
              </div>

              {/* MET Reference Guide */}
              <div className="mt-6 bg-orange-50 rounded-lg p-4">
                <h3 className="text-sm font-medium text-orange-900 mb-2">MET Érték Útmutató</h3>
                <div className="grid grid-cols-2 gap-2 text-sm text-orange-800">
                  <div>• Séta (lassú): 2.0</div>
                  <div>• Séta (gyors): 3.5</div>
                  <div>• Futás (lassú): 7.0</div>
                  <div>• Futás (közepes): 9.8</div>
                  <div>• Kerékpározás: 4.0-8.0</div>
                  <div>• Úszás: 6.0-10.0</div>
                  <div>• Súlyzós edzés: 3.0-6.0</div>
                  <div>• HIIT: 8.0-12.0</div>
                </div>
              </div>
            </div>

            {/* Calorie Estimate Card */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <FireIcon className="h-6 w-6 text-red-500" />
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Becsült Kalória Égetés</h3>
                    <p className="text-sm text-gray-500">70 kg-os személy esetén</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-3xl font-bold text-red-600">~{estimatedCalories}</p>
                  <p className="text-sm text-gray-500">kcal / alkalom</p>
                </div>
              </div>
              <p className="mt-3 text-xs text-gray-500">
                A tényleges kalória égetés a testsúly és az edzés intenzitása alapján változik.
              </p>
            </div>

            {/* Submit Button */}
            <div className="flex justify-end space-x-4">
              <button
                type="button"
                onClick={() => router.back()}
                className="px-6 py-3 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Mégse
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-6 py-3 bg-gradient-to-r from-orange-600 to-red-600 text-white rounded-xl hover:from-orange-700 hover:to-red-700 transition-colors flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                    <span>Létrehozás...</span>
                  </>
                ) : (
                  <>
                    <PlusCircleIcon className="h-5 w-5" />
                    <span>Edzés Létrehozása</span>
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Info Section */}
          <div className="mt-8 bg-blue-50 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-blue-900 mb-3">Tudnivalók</h3>
            <ul className="space-y-2 text-sm text-blue-800">
              <li className="flex items-start space-x-2">
                <span className="text-blue-500 mt-0.5">•</span>
                <span>Az egyéni edzések csak Önnek láthatóak.</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="text-blue-500 mt-0.5">•</span>
                <span>A MET érték befolyásolja a kalória számítást - minél magasabb, annál intenzívebb az edzés.</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="text-blue-500 mt-0.5">•</span>
                <span>Az alapértelmezett időtartam a naplózásnál automatikusan kitöltésre kerül.</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
}
