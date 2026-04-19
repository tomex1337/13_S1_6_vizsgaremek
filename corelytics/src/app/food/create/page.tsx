'use client'

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { Capacitor } from "@capacitor/core";
import { trpc } from "@/lib/trpc";
import { isBarcodeScannerSupported, normalizeBarcodeValue, scanBarcodeLax } from "@/lib/barcodeScanner";
import Header from "@/components/header";
import Footer from "@/components/footer";
import {
  PlusCircleIcon,
  ArrowLeftIcon,
  BeakerIcon,
  ScaleIcon,
  FireIcon,
  CheckCircleIcon,
  QrCodeIcon
} from '@heroicons/react/24/outline';
import {
  SparklesIcon
} from '@heroicons/react/24/solid';

interface FoodFormData {
  name: string;
  brand?: string;
  barcode?: string;
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
  const isNativePlatform = Capacitor.isNativePlatform();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isScanningBarcode, setIsScanningBarcode] = useState(false);
  const [isScannerSupported, setIsScannerSupported] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showError, setShowError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch
  } = useForm<FoodFormData>({
    defaultValues: {
      barcode: '',
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

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const barcodeFromQuery = params.get('barcode')?.trim();

    if (barcodeFromQuery) {
      setValue('barcode', normalizeBarcodeValue(barcodeFromQuery), {
        shouldDirty: true,
        shouldValidate: true,
      });
    }
  }, [setValue]);

  useEffect(() => {
    const checkScannerSupport = async () => {
      if (!isNativePlatform) {
        setIsScannerSupported(false);
        return;
      }

      const supported = await isBarcodeScannerSupported();
      setIsScannerSupported(supported);
    };

    void checkScannerSupport();
  }, [isNativePlatform]);

  const handleBarcodeScan = async () => {
    if (!isNativePlatform) {
      setErrorMessage('A vonalkód szkenner csak mobilalkalmazásban érhető el.');
      setShowError(true);
      setTimeout(() => setShowError(false), 5000);
      return;
    }

    if (!isScannerSupported) {
      setErrorMessage('A vonalkód olvasás nem támogatott ezen az eszközön.');
      setShowError(true);
      setTimeout(() => setShowError(false), 5000);
      return;
    }

    try {
      setIsScanningBarcode(true);

      const { value: scannedValue, likelyEmulator } = await scanBarcodeLax();

      if (likelyEmulator && !scannedValue) {
        const manual = window.prompt('Emulátorban a kamera/beolvasás gyakran nem működik. Másold be vagy írd be a vonalkódot:');
        const value = (manual ?? '').trim();
        if (!value) {
          setErrorMessage('Nem adtál meg vonalkódot.');
          setShowError(true);
          setTimeout(() => setShowError(false), 4000);
          return;
        }

        setValue('barcode', normalizeBarcodeValue(value), {
          shouldDirty: true,
          shouldValidate: true,
        });
        return;
      }

      if (!scannedValue) {
        const manual = window.prompt('Nem sikerült automatikusan beolvasni. Írd be kézzel a vonalkódot (ha látható a csomagoláson):');
        const manualValue = (manual ?? '').trim();
        if (manualValue) {
          setValue('barcode', normalizeBarcodeValue(manualValue), {
            shouldDirty: true,
            shouldValidate: true,
          });
          return;
        }

        setErrorMessage('Nem sikerült vonalkódot beolvasni. Próbáld meg távolabbról, jobb fényben, vagy írd be kézzel a kódot.');
        setShowError(true);
        setTimeout(() => setShowError(false), 5000);
        return;
      }

      setValue('barcode', scannedValue, {
        shouldDirty: true,
        shouldValidate: true,
      });
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : String(e);
      console.error('Barcode scan error:', e);
      setErrorMessage(`Hiba történt a vonalkód beolvasása közben: ${message}`);
      setShowError(true);
      setTimeout(() => setShowError(false), 7000);
    } finally {
      setIsScanningBarcode(false);
    }
  };

  const onSubmit = async (data: FoodFormData) => {
    // Validáld, hogy a makrók súlya ne haladja meg az adagméretet
    const macroWeight = Number(data.protein) + Number(data.carbs) + Number(data.fat);
    if (macroWeight > Number(data.servingSizeGrams)) {
      setErrorMessage(`A makrók összesített súlya (${Math.round(macroWeight)}g) nem lehet nagyobb, mint az adagméret (${data.servingSizeGrams}g)`);
      setShowError(true);
      setTimeout(() => setShowError(false), 5000);
      return;
    }

    // Validáld, hogy a cukor ne haladja meg a szénhidrátot
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
        barcode: data.barcode?.trim() || undefined,
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
      {!isScanningBarcode && <Header />}
      <div className={`min-h-screen bg-gray-50 dark:bg-gray-800 flex flex-col ${isScanningBarcode ? 'opacity-0 pointer-events-none' : ''}`}>
        {/* Header Section */}
        <div className="bg-gradient-to-r from-purple-600 to-pink-600 dark:from-purple-700 dark:to-pink-700 text-white">
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
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-xl p-4 flex items-center space-x-3">
              <CheckCircleIcon className="h-6 w-6 text-green-600 dark:text-green-400 flex-shrink-0" />
              <div>
                <p className="text-green-900 dark:text-green-200 font-medium">Étel sikeresen létrehozva!</p>
                <p className="text-green-700 dark:text-green-300 text-sm">Átirányítás az étkezési naplóhoz...</p>
              </div>
            </div>
          </div>
        )}

        {/* Error Message */}
        {showError && (
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-xl p-4 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="flex-shrink-0">
                  <svg className="h-6 w-6 text-red-600 dark:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <p className="text-red-900 dark:text-red-200 font-medium">Hiba történt!</p>
                  <p className="text-red-700 dark:text-red-300 text-sm">{errorMessage}</p>
                </div>
              </div>
              <button
                onClick={() => setShowError(false)}
                className="text-red-400 dark:text-red-500 hover:text-red-600 dark:hover:text-red-400 transition-colors"
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
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex items-center space-x-3 mb-6">
                <BeakerIcon className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Alapvető Információk</h2>
              </div>

              <div className="space-y-4">
                {/* Food Name */}
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Étel Neve <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="name"
                    {...register('name', { 
                      required: 'Étel neve: Ez a mező kötelező',
                      minLength: { value: 2, message: 'Étel neve: Legalább 2 karakter hosszúnak kell lennie' }
                    })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900 dark:text-gray-100"
                    placeholder="pl. Házi Tészta"
                  />
                  {errors.name && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.name.message}</p>
                  )}
                </div>

                {/* Brand */}
                <div>
                  <label htmlFor="brand" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Márka (Opcionális)
                  </label>
                  <input
                    type="text"
                    id="brand"
                    {...register('brand')}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900 dark:text-gray-100"
                    placeholder="pl. Általános, Házi"
                  />
                </div>

                <div>
                  <label htmlFor="barcode" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Vonalkód (Opcionális)
                  </label>
                  <div className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-3">
                    <div className="relative">
                      <input
                        type="text"
                        id="barcode"
                        {...register('barcode', {
                          minLength: { value: 1, message: 'Vonalkód: Legalább 1 karakter szükséges' },
                          maxLength: { value: 512, message: 'Vonalkód: Maximum 512 karakter lehet' }
                        })}
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900 dark:text-gray-100"
                        placeholder="pl. 5991234567890"
                      />
                      <QrCodeIcon className="absolute right-3 top-2.5 h-5 w-5 text-gray-400 dark:text-gray-600" />
                    </div>
                    {isNativePlatform && (
                      <button
                        type="button"
                        onClick={handleBarcodeScan}
                        disabled={isScanningBarcode || !isScannerSupported}
                        className="inline-flex items-center justify-center px-4 py-2 bg-indigo-600 dark:bg-indigo-700 text-white rounded-lg hover:bg-indigo-700 dark:hover:bg-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        {isScanningBarcode ? 'Olvasás...' : 'Beolvasás'}
                      </button>
                    )}
                  </div>
                  {errors.barcode && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.barcode.message}</p>
                  )}
                  {!isNativePlatform && (
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">A beolvasás gomb mobilalkalmazásban érhető el.</p>
                  )}
                </div>

                {/* Serving Size */}
                <div>
                  <label htmlFor="servingSizeGrams" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
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
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900 dark:text-gray-100"
                      placeholder="100"
                    />
                    <ScaleIcon className="absolute right-3 top-2.5 h-5 w-5 text-gray-400 dark:text-gray-600" />
                  </div>
                  {errors.servingSizeGrams && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.servingSizeGrams.message}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Nutrition Information Card */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex items-center space-x-3 mb-6">
                <FireIcon className="h-6 w-6 text-orange-600 dark:text-orange-400" />
                <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Tápértékek</h2>
              </div>

              <div className="space-y-4">
                {/* Calories */}
                <div>
                  <label htmlFor="calories" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
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
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900 dark:text-gray-100"
                    placeholder="0"
                  />
                  {errors.calories && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.calories.message}</p>
                  )}
                  {calculatedCalories > 0 && (
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                      Makrókból számítva: ~{Math.round(calculatedCalories)} kcal
                    </p>
                  )}
                </div>

                {/* Macronutrients Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Protein */}
                  <div>
                    <label htmlFor="protein" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
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
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900 dark:text-gray-100"
                      placeholder="0"
                    />
                    {errors.protein && (
                      <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.protein.message}</p>
                    )}
                  </div>

                  {/* Carbs */}
                  <div>
                    <label htmlFor="carbs" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
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
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900 dark:text-gray-100"
                      placeholder="0"
                    />
                    {errors.carbs && (
                      <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.carbs.message}</p>
                    )}
                  </div>

                  {/* Fat */}
                  <div>
                    <label htmlFor="fat" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
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
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900 dark:text-gray-100"
                      placeholder="0"
                    />
                    {errors.fat && (
                      <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.fat.message}</p>
                    )}
                  </div>
                </div>

                {/* Macro Weight Validation Warning */}
                {totalMacroWeight > servingSizeGrams && (
                  <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-lg p-3">
                    <p className="text-sm text-yellow-800 dark:text-yellow-200">
                      ⚠️ A makrók összesített súlya ({Math.round(totalMacroWeight)}g) nagyobb, mint az adagméret ({servingSizeGrams}g). Kérjük, ellenőrizze az értékeket.
                    </p>
                  </div>
                )}

                {/* Additional Carb Details */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="fiber" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
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
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900 dark:text-gray-100"
                      placeholder="0"
                    />
                    {errors.fiber && (
                      <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.fiber.message}</p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="sugar" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
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
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900 dark:text-gray-100"
                      placeholder="0"
                    />
                    {errors.sugar && (
                      <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.sugar.message}</p>
                    )}
                    {sugar > 0 && Number(sugar) > Number(carbs) && (
                      <p className="mt-1 text-sm text-yellow-600 dark:text-yellow-400">
                        ⚠️ Cukor: A cukor ({sugar}g) nem lehet több, mint a szénhidrát ({carbs}g)
                      </p>
                    )}
                  </div>
                </div>

                {/* Sodium */}
                <div>
                  <label htmlFor="sodium" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Nátrium (mg)
                  </label>
                  <input
                    type="number"
                    id="sodium"
                    step="0.1"
                    {...register('sodium', { min: { value: 0, message: 'Nátrium: Nem lehet negatív' } })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900 dark:text-gray-100"
                    placeholder="0"
                  />
                  {errors.sodium && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.sodium.message}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-end space-x-4">
              <button
                type="button"
                onClick={() => router.back()}
                className="px-6 py-3 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors font-medium"
              >
                Mégse
              </button>
              <button
                type="submit"
                disabled={isSubmitting || hasWarnings}
                className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 dark:from-purple-700 dark:to-pink-700 dark:hover:from-purple-800 dark:hover:to-pink-800 text-white rounded-lg transition-colors font-medium flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
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
                <p className="text-sm text-red-600 dark:text-red-400 mt-2">
                  ⚠️ A létrehozás gomb le van tiltva mert nincs minden megfelően kitőltve.
                </p>
              </div>
            )}
          </form>

          {/* Info Box */}
          <div className="mt-8 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-xl p-6">
            <h3 className="text-sm font-semibold text-blue-900 dark:text-blue-200 mb-2">💡 Tippek Étel Létrehozásához</h3>
            <ul className="space-y-2 text-sm text-blue-800 dark:text-blue-300">
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
      {!isScanningBarcode && <Footer />}

      {isScanningBarcode && (
        <div className="fixed inset-0 z-[1000] pointer-events-none flex items-center justify-center">
          <div className="absolute inset-0 bg-black/20"></div>
          <div className="relative mx-6 rounded-xl bg-black/60 px-4 py-3 text-center text-white">
            <p className="text-sm font-semibold">Irányítsd a kamerát a vonalkódra</p>
            <p className="text-xs text-gray-200">A beolvasás automatikus, tartsd stabilan az eszközt.</p>
          </div>
        </div>
      )}
    </>
  );
}
