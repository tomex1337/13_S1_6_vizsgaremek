'use client'

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Capacitor } from "@capacitor/core";
import { BarcodeFormat, BarcodeScanner } from "@capacitor-mlkit/barcode-scanning";
import { trpc } from "@/lib/trpc";
import Header from "@/components/header";
import Footer from "@/components/footer";
import {
  MagnifyingGlassIcon,
  PlusIcon,
  ScaleIcon,
  BeakerIcon,
  CheckIcon,
  XMarkIcon,
  PencilIcon,
  QrCodeIcon,
  TrashIcon
} from '@heroicons/react/24/outline';
import {
  FireIcon as FireIconSolid
} from '@heroicons/react/24/solid';

interface FoodItem {
  id: string;   
  name: string;
  brand?: string | null;
  barcode?: string | null;
  servingSizeGrams?: number | string | null;
  calories?: number | string | null;
  protein?: number | string | null;
  fat?: number | string | null;
  carbs?: number | string | null;
  fiber?: number | string | null;
  sugar?: number | string | null;
  sodium?: number | string | null;
  isCustom?: boolean;
}

interface MealType {
  id: number;
  name: string;
}

interface DailyLog {
  id: string;
  quantity: number;
  logDate: Date;
  createdAt: Date;
  foodItem: FoodItem;
  mealType?: MealType;
}

interface NutritionTotals {
  calories: number;
  protein: number;
  fat: number;
  carbs: number;
  fiber: number;
}

export default function FoodLogPage() {
  const { status } = useSession();
  const router = useRouter();
  const isNativePlatform = Capacitor.isNativePlatform();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [searchQuery, setSearchQuery] = useState('');
  const [isScannerSupported, setIsScannerSupported] = useState(false);
  const [isScanningBarcode, setIsScanningBarcode] = useState(false);
  const [selectedMealType, setSelectedMealType] = useState<number>(1);
  const [showAddFood, setShowAddFood] = useState(false);
  const [selectedFood, setSelectedFood] = useState<FoodItem | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [editingLog, setEditingLog] = useState<string | null>(null);
  const [editQuantity, setEditQuantity] = useState(1);
  const [showMealSelector, setShowMealSelector] = useState(false);
  
  // tRPC lekérdezések és mutációk
  const { data: mealTypes = [] } = trpc.food.getMealTypes.useQuery();
  const { data: dailyLogs = [], refetch: refetchLogs } = trpc.food.getDailyLogs.useQuery({
    date: selectedDate.toISOString().split('T')[0]
  }, {
    enabled: status === "authenticated"
  });
  
  // Kiválasztott nap összegzése (célok + elégetett kalória)
  const { data: dailySummary } = trpc.food.getDailySummary.useQuery({
    date: selectedDate.toISOString().split('T')[0]
  }, {
    enabled: status === "authenticated"
  });
  
  const { data: searchResults = [], isLoading: isSearching } = trpc.food.search.useQuery({
    query: searchQuery,
    limit: 20
  }, {
    enabled: searchQuery.length > 2
  });
  
  const logFoodMutation = trpc.food.logFood.useMutation({
    onSuccess: () => {
      refetchLogs();
      setShowAddFood(false);
      setSelectedFood(null);
      setQuantity(1);
      setSearchQuery('');
    }
  });
  
  const deleteLogMutation = trpc.food.deleteLog.useMutation({
    onSuccess: () => {
      refetchLogs();
    }
  });

  const updateLogMutation = trpc.food.updateLogQuantity.useMutation({
    onSuccess: () => {
      refetchLogs();
      setEditingLog(null);
    }
  });

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin");
    }
  }, [status, router]);

  useEffect(() => {
    const checkScannerSupport = async () => {
      if (!isNativePlatform) {
        setIsScannerSupported(false);
        return;
      }

      try {
        const { supported } = await BarcodeScanner.isSupported();
        setIsScannerSupported(supported);
      } catch {
        setIsScannerSupported(false);
      }
    };

    void checkScannerSupport();
  }, [isNativePlatform]);

  const handleScanBarcodeSearch = async () => {
    if (!isNativePlatform) {
      return;
    }

    try {
      setIsScanningBarcode(true);

      const permissionStatus = await BarcodeScanner.checkPermissions();
      let cameraPermission = permissionStatus.camera;

      if (cameraPermission !== 'granted') {
        const requestedPermissions = await BarcodeScanner.requestPermissions();
        cameraPermission = requestedPermissions.camera;
      }

      if (cameraPermission !== 'granted') {
        return;
      }

      const result = await BarcodeScanner.scan({
        formats: [
          BarcodeFormat.Ean13,
          BarcodeFormat.Ean8,
          BarcodeFormat.UpcA,
          BarcodeFormat.UpcE,
        ]
      });

      const scannedValue = result.barcodes[0]?.rawValue?.trim() || result.barcodes[0]?.displayValue?.trim();
      if (scannedValue) {
        setSearchQuery(scannedValue);
      }
    } catch (error) {
      console.error('Error scanning barcode:', error);
    } finally {
      setIsScanningBarcode(false);
    }
  };

  const isBarcodeSearch = /^\d{8,64}$/.test(searchQuery.trim());

  const handleAddFood = async () => {
    if (!selectedFood) return;
    
    try {
      await logFoodMutation.mutateAsync({
        foodItemId: selectedFood.id,
        mealTypeId: selectedMealType,
        quantity,
        logDate: selectedDate.toISOString().split('T')[0]
      });
    } catch (error) {
      console.error('Error logging food:', error);
    }
  };

  const handleDeleteLog = async (logId: string) => {
    try {
      await deleteLogMutation.mutateAsync({ logId });
    } catch (error) {
      console.error('Error deleting log:', error);
    }
  };

  const handleEditLog = (log: DailyLog) => {
    setEditingLog(log.id);
    setEditQuantity(Number(log.quantity) || 1);
  };

  const handleUpdateLog = async (logId: string) => {
    try {
      await updateLogMutation.mutateAsync({ 
        logId, 
        quantity: editQuantity 
      });
    } catch (error) {
      console.error('Error updating log:', error);
    }
  };

  const handleCancelEdit = () => {
    setEditingLog(null);
    setEditQuantity(1);
  };

  const calculateTotals = (): NutritionTotals => {
    return (dailyLogs as unknown as DailyLog[]).reduce((totals: NutritionTotals, log: DailyLog) => {
      const multiplier = Number(log.quantity);
      return {
        calories: totals.calories + (Number(log.foodItem?.calories) || 0) * multiplier,
        protein: totals.protein + (Number(log.foodItem?.protein) || 0) * multiplier,
        fat: totals.fat + (Number(log.foodItem?.fat) || 0) * multiplier,
        carbs: totals.carbs + (Number(log.foodItem?.carbs) || 0) * multiplier,
        fiber: totals.fiber + (Number(log.foodItem?.fiber) || 0) * multiplier
      };
    }, { calories: 0, protein: 0, fat: 0, carbs: 0, fiber: 0 });
  };

  const totals = calculateTotals();
  const calorieGoal = dailySummary?.caloriesTarget || 2000;
  const caloriesBurned = dailySummary?.caloriesBurned || 0;
  const netCalories = totals.calories - caloriesBurned;
  const proteinGoal = Number(dailySummary?.proteinTarget) || 150;
  const fatGoal = Number(dailySummary?.fatTarget) || 65;
  const carbsGoal = Number(dailySummary?.carbsTarget) || 250;
  const caloriesRemaining = calorieGoal - netCalories;
  const proteinRemaining = proteinGoal - totals.protein;
  const fatRemaining = fatGoal - totals.fat;
  const carbsRemaining = carbsGoal - totals.carbs;

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
    <div className="min-h-screen bg-gray-50 dark:bg-gray-800">
      {/* Header Section */}
      <div className="bg-gradient-to-r from-green-600 to-blue-700 dark:from-green-800 dark:to-blue-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="h-16 w-16 bg-white/10 rounded-full flex items-center justify-center">
                <FireIconSolid className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold !text-white">Étkezési Napló</h1>
                <p className="!text-green-100 mt-1">
                  Kövesd nyomon a táplálkozásodat és érdd el a céljaidat
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <input
                type="date"
                value={selectedDate.toISOString().split('T')[0]}
                onChange={(e) => setSelectedDate(new Date(e.target.value))}
                className="px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/60 focus:outline-none focus:border-white/40"
              />
              <button
                onClick={() => setShowMealSelector(true)}
                className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors flex items-center space-x-2"
              >
                <PlusIcon className="h-5 w-5" />
                <span>Étel hozzáadása</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-grow">
        {/* Daily Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          {/* Calories Card */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center space-x-3 mb-4">
              <div className="p-2 bg-orange-100 dark:bg-orange-900 rounded-lg">
                <FireIconSolid className="h-6 w-6 text-orange-600 dark:text-orange-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Nettó kalória</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {Math.round(netCalories)} / {Math.round(calorieGoal)}
                </p>
              </div>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div 
                className="bg-orange-600 dark:bg-orange-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${Math.min(Math.max((netCalories / calorieGoal) * 100, 0), 100)}%` }}
              ></div>
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400 mt-2 space-y-1">
              <p>{caloriesRemaining > 0 ? `${Math.round(caloriesRemaining)} maradt` : `${Math.round(Math.abs(caloriesRemaining))} túllépve`}</p>
              <p className="text-xs text-gray-400 dark:text-gray-500">
                {Math.round(totals.calories)} bevitt - {Math.round(caloriesBurned)} égetett
              </p>
            </div>
          </div>

          {/* Protein Card */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center space-x-3 mb-4">
              <div className="p-2 bg-red-100 dark:bg-red-900 rounded-lg">
                <BeakerIcon className="h-6 w-6 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Fehérje</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {Math.round(totals.protein)}g
                </p>
              </div>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div 
                className="bg-red-600 dark:bg-red-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${Math.min((totals.protein / proteinGoal) * 100, 100)}%` }}
              ></div>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
              {proteinRemaining > 0 ? `${Math.round(proteinRemaining)}g maradt` : 'Cél elérve! 🎉'}
            </p>
          </div>

          {/* Fat Card */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center space-x-3 mb-4">
              <div className="p-2 bg-yellow-100 dark:bg-yellow-900 rounded-lg">
                <ScaleIcon className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Zsír</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {Math.round(totals.fat)}g
                </p>
              </div>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div 
                className="bg-yellow-600 dark:bg-yellow-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${Math.min((totals.fat / fatGoal) * 100, 100)}%` }}
              ></div>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
              {fatRemaining > 0 ? `${Math.round(fatRemaining)}g maradt` : 'Cél elérve! 🎉'}
            </p>
          </div>

          {/* Carbs Card */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center space-x-3 mb-4">
              <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
                <BeakerIcon className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Szénhidrát</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {Math.round(totals.carbs)}g
                </p>
              </div>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div 
                className="bg-green-600 dark:bg-green-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${Math.min((totals.carbs / carbsGoal) * 100, 100)}%` }}
              ></div>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
              {carbsRemaining > 0 ? `${Math.round(carbsRemaining)}g maradt` : 'Cél elérve! 🎉'}
            </p>
          </div>
        </div>

        {/* Meal Sections */}
        <div className="space-y-6">
          {mealTypes.map((mealType) => {
            const mealLogs = (dailyLogs as unknown as DailyLog[]).filter((log: DailyLog) => log.mealType?.id === mealType.id);
            const mealCalories = mealLogs.reduce((sum: number, log: DailyLog) => 
              sum + (Number(log.foodItem?.calories) || 0) * Number(log.quantity), 0
            );

            return (
              <div key={mealType.id} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
                <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">{mealType.name}</h2>
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        {Math.round(mealCalories)} kalória
                      </span>
                    </div>
                    <button
                      onClick={() => {
                        setSelectedMealType(mealType.id);
                        setShowAddFood(true);
                      }}
                      className="p-2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors"
                    >
                      <PlusIcon className="h-5 w-5" />
                    </button>
                  </div>
                </div>
                <div className="p-6">
                  {mealLogs.length > 0 ? (
                    <div className="space-y-4">
                      {mealLogs.map((log: DailyLog) => (
                        <div key={log.id} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
                          <div className="flex-1">
                            <div className="flex items-center space-x-3">
                              <div>
                                <p className="font-medium text-gray-900 dark:text-gray-100">
                                  {log.foodItem?.name || 'Ismeretlen Étel'}
                                  {log.foodItem?.brand && (
                                    <span className="text-gray-500 dark:text-gray-400 ml-2">- {log.foodItem.brand}</span>
                                  )}
                                </p>
                                {editingLog === log.id ? (
                                  <div className="flex items-center space-x-2 mt-2">
                                    <input
                                      type="number"
                                      min="0.1"
                                      step="0.1"
                                      max="100.0"
                                      value={editQuantity}
                                      onChange={(e) => setEditQuantity(Math.min(parseFloat(e.target.value) || 1, 100))}
                                      className="w-20 px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                                    />
                                    <span className="text-sm text-gray-500 dark:text-gray-400">
                                      adag{editQuantity !== 1 ? 'ok' : ''}
                                      {log.foodItem?.servingSizeGrams && (
                                        <span> ({Math.round(Number(log.foodItem.servingSizeGrams) * editQuantity)}g)</span>
                                      )}
                                    </span>
                                  </div>
                                ) : (
                                  <p className="text-sm text-gray-500 dark:text-gray-400">
                                    {Number(log.quantity || 0)} adag{Number(log.quantity || 0) !== 1 ? 'ok' : ''} 
                                    {log.foodItem?.servingSizeGrams && (
                                      <span> ({Math.round(Number(log.foodItem.servingSizeGrams) * Number(log.quantity || 0))}g)</span>
                                    )}
                                  </p>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center space-x-4">
                            <div className="text-right">
                              <p className="font-semibold text-gray-900 dark:text-gray-100">
                                {editingLog === log.id 
                                  ? Math.round((Number(log.foodItem?.calories) || 0) * editQuantity)
                                  : Math.round((Number(log.foodItem?.calories) || 0) * Number(log.quantity || 0))
                                } cal
                              </p>
                              <p className="text-xs text-gray-500 dark:text-gray-400">
                                P: {editingLog === log.id 
                                  ? Math.round((Number(log.foodItem?.protein) || 0) * editQuantity)
                                  : Math.round((Number(log.foodItem?.protein) || 0) * Number(log.quantity || 0))
                                }g |
                                F: {editingLog === log.id 
                                  ? Math.round((Number(log.foodItem?.fat) || 0) * editQuantity)
                                  : Math.round((Number(log.foodItem?.fat) || 0) * Number(log.quantity || 0))
                                }g |
                                C: {editingLog === log.id 
                                  ? Math.round((Number(log.foodItem?.carbs) || 0) * editQuantity)
                                  : Math.round((Number(log.foodItem?.carbs) || 0) * Number(log.quantity || 0))
                                }g
                              </p>
                            </div>
                            <div className="flex space-x-1">
                              {editingLog === log.id ? (
                                <>
                                  <button 
                                    onClick={() => handleUpdateLog(log.id)}
                                    disabled={updateLogMutation.isPending}
                                    className="p-1 text-gray-400 dark:text-gray-500 hover:text-green-600 dark:hover:text-green-400 transition-colors disabled:opacity-50"
                                  >
                                    <CheckIcon className="h-4 w-4" />
                                  </button>
                                  <button 
                                    onClick={handleCancelEdit}
                                    className="p-1 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                                  >
                                    <XMarkIcon className="h-4 w-4" />
                                  </button>
                                </>
                              ) : (
                                <>
                                  <button 
                                    onClick={() => handleEditLog(log)}
                                    className="p-1 text-gray-400 dark:text-gray-500 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                                  >
                                    <PencilIcon className="h-4 w-4" />
                                  </button>
                                  <button 
                                    onClick={() => handleDeleteLog(log.id)}
                                    className="p-1 text-gray-400 dark:text-gray-500 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                                  >
                                    <TrashIcon className="h-4 w-4" />
                                  </button>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                      <p>Nincs étel naplózva ehhez: {mealType.name.toLowerCase()}</p>
                      <button
                        onClick={() => {
                          setSelectedMealType(mealType.id);
                          setShowAddFood(true);
                        }}
                        className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium mt-2"
                      >
                        Első étel hozzáadása
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Meal Selector Modal */}
      {showMealSelector && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg max-w-md w-full">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  Étkezés Kategória Kiválasztása
                </h3>
                <button
                  onClick={() => setShowMealSelector(false)}
                  className="p-2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg transition-colors"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>
            </div>
            
            <div className="p-6">
              <p className="text-gray-600 dark:text-gray-400 mb-4">Válaszd ki, melyik étkezéshez szeretnél ételt hozzáadni:</p>
              <div className="space-y-3">
                {mealTypes.map((mealType) => (
                  <button
                    key={mealType.id}
                    onClick={() => {
                      setSelectedMealType(mealType.id);
                      setShowMealSelector(false);
                      setShowAddFood(true);
                    }}
                    className="w-full p-4 text-left bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-lg border border-gray-200 dark:border-gray-600 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-gray-900 dark:text-gray-100">{mealType.name}</span>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {(dailyLogs as unknown as DailyLog[]).filter((log: DailyLog) => log.mealType?.id === mealType.id).reduce((sum: number, log: DailyLog) => 
                          sum + (Number(log.foodItem?.calories) || 0) * Number(log.quantity), 0
                        )} kal naplózva
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Food Modal */}
      {showAddFood && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg max-w-2xl w-full max-h-[90vh] overflow-hidden">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  Étel hozzáadása: {mealTypes.find(m => m.id === selectedMealType)?.name}
                </h3>
                <button
                  onClick={() => {
                    setShowAddFood(false);
                    setSelectedFood(null);
                    setSearchQuery('');
                  }}
                  className="p-2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg transition-colors"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>
            </div>
            
            <div className="p-6">
              {!selectedFood ? (
                <>
                  {/* Search Input */}
                  <div className="relative mb-6">
                    <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 dark:text-gray-500" />
                    <input
                      type="text"
                      placeholder="Keress egy ételt..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  {isNativePlatform && (
                    <div className="mb-6">
                      <button
                        type="button"
                        onClick={handleScanBarcodeSearch}
                        disabled={isScanningBarcode || !isScannerSupported}
                        className="inline-flex items-center space-x-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        <QrCodeIcon className="h-5 w-5" />
                        <span>{isScanningBarcode ? 'Beolvasás...' : 'Vonalkód beolvasása'}</span>
                      </button>
                    </div>
                  )}

                  {/* Search Results */}
                  <div className="max-h-96 overflow-y-auto">
                    {isSearching ? (
                      <div className="text-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                        <p className="text-gray-500 dark:text-gray-400 mt-2">Keresés...</p>
                      </div>
                    ) : searchResults.length > 0 ? (
                      <div className="space-y-2">
                        {searchResults.map((food) => (
                          <button
                            key={food.id}
                            onClick={() => setSelectedFood(food as FoodItem)}
                            className="w-full p-4 text-left hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600 transition-colors"
                          >
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="font-medium text-gray-900 dark:text-gray-100">{food.name}</p>
                                {food.brand && (
                                  <p className="text-sm text-gray-500 dark:text-gray-400">{food.brand}</p>
                                )}
                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                  {food.servingSizeGrams}g adag
                                </p>
                              </div>
                              <div className="text-right">
                                <p className="font-semibold text-gray-900 dark:text-gray-100">{food.calories} cal</p>
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                  P: {food.protein}g | F: {food.fat}g | C: {food.carbs}g
                                </p>
                              </div>
                            </div>
                          </button>
                        ))}
                      </div>
                    ) : searchQuery.length > 2 ? (
                      <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                        <p>Nem található étel erre: &quot;{searchQuery}&quot;</p>
                        <button 
                          onClick={() => {
                            const barcodeQueryPart = isBarcodeSearch ? `?barcode=${encodeURIComponent(searchQuery.trim())}` : '';
                            router.push(`/food/create${barcodeQueryPart}`);
                          }}
                          className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium mt-2"
                        >
                          {isBarcodeSearch
                            ? 'Egyedi étel létrehozása ezzel a vonalkóddal'
                            : 'Egyedi étel létrehozása'}
                        </button>
                      </div>
                    ) : (
                      <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                        <p>Kezdj el gépelni az ételek kereséséhez</p>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <>
                  {/* Selected Food Details */}
                  <div className="mb-6">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{selectedFood.name}</h4>
                        {selectedFood.brand && (
                          <p className="text-gray-600 dark:text-gray-400">{selectedFood.brand}</p>
                        )}
                      </div>
                      <button
                        onClick={() => setSelectedFood(null)}
                        className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300"
                      >
                        <XMarkIcon className="h-5 w-5" />
                      </button>
                    </div>
                    
                    {/* Nutrition Info */}
                    <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 mb-4">
                      <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">{Number(selectedFood.servingSizeGrams || 0)}g adagonként:</p>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div className="text-gray-900 dark:text-gray-100">Kalória: <span className="font-semibold">{Number(selectedFood.calories || 0)}</span></div>
                        <div className="text-gray-900 dark:text-gray-100">Fehérje: <span className="font-semibold">{Number(selectedFood.protein || 0)}g</span></div>
                        <div className="text-gray-900 dark:text-gray-100">Zsír: <span className="font-semibold">{Number(selectedFood.fat || 0)}g</span></div>
                        <div className="text-gray-900 dark:text-gray-100">Szénhidrát: <span className="font-semibold">{Number(selectedFood.carbs || 0)}g</span></div>
                      </div>
                    </div>

                    {/* Quantity Input */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Adagok száma:
                      </label>
                      <input
                      type="number"
                      min="0.1"
                      max="100"
                      step="0.1"
                      value={quantity}
                      onChange={(e) => setQuantity(Math.min(parseFloat(e.target.value) || 1, 100))}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex space-x-3">
                    <button
                      onClick={() => setSelectedFood(null)}
                      className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
                    >
                      Vissza a kereséshez
                    </button>
                    <button
                      onClick={handleAddFood}
                      disabled={logFoodMutation.isPending}
                      className="flex-1 px-4 py-2 bg-blue-600 dark:bg-blue-700 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center space-x-2"
                    >
                      {logFoodMutation.isPending ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                          <span>Hozzáadás...</span>
                        </>
                      ) : (
                        <>
                          <CheckIcon className="h-4 w-4" />
                          <span>Étel hozzáadása</span>
                        </>
                      )}
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
    <Footer />
    </>
  );
}
