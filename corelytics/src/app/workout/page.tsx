'use client'

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { trpc } from "@/lib/trpc";
import { fetchHealthConnectDailySummary } from "@/lib/healthConnect";
import Header from "@/components/header";
import Footer from "@/components/footer";
import {
  MagnifyingGlassIcon,
  PlusIcon,
  ClockIcon,
  CheckIcon,
  XMarkIcon,
  PencilIcon,
  TrashIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  ChartBarIcon,
  SparklesIcon,
  PlusCircleIcon,
  EllipsisVerticalIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';
import {
  FireIcon as FireIconSolid,
  BoltIcon
} from '@heroicons/react/24/solid';

interface Exercise {
  id: string;
  name: string;
  category?: string | null;
  metValue?: number | string | null;
  defaultDurationMinutes?: number | null;
}

interface WorkoutLog {
  id: string;
  durationMinutes: number | null;
  caloriesBurned: number | string | null;
  logDate: Date | null;
  createdAt: Date | null;
  exercise: Exercise | null;
}

interface FoodLog {
  quantity: number;
  foodItem: {
    calories?: number | string | null;
  };
}

const getLocalDateString = (date = new Date()) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export default function WorkoutLogPage() {
  const { status } = useSession();
  const router = useRouter();
  const [selectedDate, setSelectedDate] = useState(getLocalDateString());
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [showAddWorkout, setShowAddWorkout] = useState(false);
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null);
  const [duration, setDuration] = useState(30);
  const [editingLog, setEditingLog] = useState<string | null>(null);
  const [editDuration, setEditDuration] = useState(30);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [showMenu, setShowMenu] = useState(false);

  // tRPC lekérdezések és mutációk
  const { data: categories = [] } = trpc.workout.getCategories.useQuery(undefined, {
    enabled: status === "authenticated"
  });
  
  const { data: dailyLogs = [], refetch: refetchLogs } = trpc.workout.getDailyLogs.useQuery({
    date: selectedDate
  }, {
    enabled: status === "authenticated"
  });

  const { data: dailyFoodLogs = [] } = trpc.food.getDailyLogs.useQuery({
    date: selectedDate
  }, {
    enabled: status === "authenticated"
  });

  const { data: dailySummary } = trpc.food.getDailySummary.useQuery({
    date: selectedDate
  }, {
    enabled: status === "authenticated"
  });
  
  const { data: userStats } = trpc.user.stats.useQuery(undefined, {
    enabled: status === "authenticated"
  });
  
  const { data: searchResults = [], isLoading: isSearching } = trpc.workout.search.useQuery({
    query: searchQuery,
    category: selectedCategory || undefined,
    limit: 50
  }, {
    enabled: status === "authenticated"
  });
  
  const logWorkoutMutation = trpc.workout.logWorkout.useMutation({
    onSuccess: () => {
      refetchLogs();
      setShowAddWorkout(false);
      setSelectedExercise(null);
      setDuration(30);
      setSearchQuery('');
    }
  });
  
  const deleteLogMutation = trpc.workout.deleteLog.useMutation({
    onSuccess: () => {
      refetchLogs();
    }
  });

  const updateLogMutation = trpc.workout.updateLog.useMutation({
    onSuccess: () => {
      refetchLogs();
      setEditingLog(null);
    }
  });

  const importHealthConnectMutation = trpc.workout.importHealthConnectSummary.useMutation({
    onSuccess: () => {
      refetchLogs();
    }
  });

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin");
    }
  }, [status, router]);

  const handleAddWorkout = async () => {
    if (!selectedExercise) return;
    
    try {
      await logWorkoutMutation.mutateAsync({
        exerciseId: selectedExercise.id,
        durationMinutes: duration,
        logDate: selectedDate
      });
    } catch (error) {
      console.error('Error logging workout:', error);
    }
  };

  const handleDeleteLog = async (logId: string) => {
    try {
      await deleteLogMutation.mutateAsync({ logId });
    } catch (error) {
      console.error('Error deleting log:', error);
    }
  };

  const handleEditLog = (log: WorkoutLog) => {
    setEditingLog(log.id);
    setEditDuration(Number(log.durationMinutes) || 30);
  };

  const handleUpdateLog = async (logId: string) => {
    try {
      await updateLogMutation.mutateAsync({ 
        logId, 
        durationMinutes: editDuration 
      });
    } catch (error) {
      console.error('Error updating log:', error);
    }
  };

  const handleCancelEdit = () => {
    setEditingLog(null);
    setEditDuration(30);
  };

  const handleSyncHealthConnect = async () => {
    try {
      const summary = await fetchHealthConnectDailySummary(selectedDate);

      if (summary.status === "not-native") {
        window.alert("A Health Connect szinkron csak mobilalkalmazasban erheto el.");
        return;
      }

      if (summary.status === "not-android") {
        window.alert("A Health Connect szinkron jelenleg csak Androidon erheto el.");
        return;
      }

      if (summary.status === "not-installed") {
        window.alert("A Health Connect alkalmazas nincs telepitve az eszkozon.");
        return;
      }

      if (summary.status === "not-supported") {
        window.alert("A Health Connect ezen az eszkozon nem tamogatott.");
        return;
      }

      if (summary.steps <= 0 && summary.activeCaloriesBurned <= 0) {
        window.alert("Erre a napra nem talalhato importalhato Health Connect adat.");
        return;
      }

      const result = await importHealthConnectMutation.mutateAsync({
        logDate: selectedDate,
        steps: summary.steps,
        activeCaloriesBurned: summary.activeCaloriesBurned,
      });

      const actionText = result.updatedExisting ? "frissitve" : "hozzaadva";
      window.alert(`Health Connect adat sikeresen ${actionText}.\nLepesek: ${result.imported.steps}\nAktiv kaloria: ${result.imported.activeCaloriesBurned} kcal`);
    } catch (error) {
      console.error('Error syncing Health Connect data:', error);

      const errorMessage = error instanceof Error ? error.message : '';
      const isPermissionError = errorMessage.includes('Permission not granted');
      const isPermissionRequestError = errorMessage.includes('jogosultsag kerese sikertelen') || errorMessage.includes('Invalid records specified') || errorMessage.includes('No valid permissions specified');

      if (isPermissionError || isPermissionRequestError) {
        window.alert("A Health Connect engedely hianyzik. Engedelyezd a Lepesek es Aktiv kaloria adatok olvasasat, majd probald ujra.");
      } else {
        window.alert(`A Health Connect szinkron kozben hiba tortent.\nReszletek: ${errorMessage || 'ismeretlen hiba'}`);
      }
    } finally {
      setShowMenu(false);
    }
  };

  const toggleCategory = (category: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(category)) {
      newExpanded.delete(category);
    } else {
      newExpanded.add(category);
    }
    setExpandedCategories(newExpanded);
  };

  // Keresési eredmények csoportosítása kategória szerint
  const groupedExercises = searchResults.reduce((acc, exercise) => {
    const category = exercise.category || 'Egyéb';
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(exercise);
    return acc;
  }, {} as Record<string, typeof searchResults>);

  // Mai összegek számítása
  const todayTotals = (dailyLogs as unknown as WorkoutLog[]).reduce(
    (totals, log) => ({
      workouts: totals.workouts + 1,
      minutes: totals.minutes + (log.durationMinutes || 0),
      calories: totals.calories + Number(log.caloriesBurned || 0)
    }),
    { workouts: 0, minutes: 0, calories: 0 }
  );

  const caloriesConsumed = (dailyFoodLogs as unknown as FoodLog[]).reduce((total, log) => {
    return total + (Number(log.foodItem?.calories) || 0) * Number(log.quantity || 0);
  }, 0);

  // Nettó kalóriák számítása (bevitt - elégetett) a kiválasztott napra
  const calorieGoal = dailySummary?.caloriesTarget || userStats?.caloriesTarget || 2000;
  const caloriesBurnedForSelectedDate = todayTotals.calories;
  const netCalories = caloriesConsumed - caloriesBurnedForSelectedDate;
  const caloriesRemaining = calorieGoal - netCalories;

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  if (status === "unauthenticated") {
    return null;
  }

  return (
    <>
    <Header />
    <div className="min-h-screen bg-gray-50 dark:bg-gray-800 flex flex-col">
    
      {/* Header Section */}
      <div className="bg-gradient-to-r from-purple-600 to-indigo-700 dark:from-purple-800 dark:to-indigo-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col xl:flex-row items-start xl:items-center justify-between gap-4">
            <div className="flex items-center space-x-4 w-full xl:w-auto">
              <div className="h-16 w-16 bg-white/10 rounded-full flex items-center justify-center flex-shrink-0">
                <BoltIcon className="h-8 w-8 text-white" />
              </div>
              <div className="flex-1 xl:flex-none">
                <h1 className="text-3xl font-bold !text-white">Edzésnapló</h1>
                <p className="!text-purple-100 mt-1">
                  Kövesd nyomon az edzéseidet és égesd a kalóriákat
                </p>
              </div>
            </div>
            
            {/* Desktop Controls */}
            <div className="hidden xl:flex items-center gap-2">
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="px-3 py-2 bg-white/10 dark:bg-gray-800/50 dark:hover:bg-gray-800/60 border border-white/20 rounded-lg text-white dark:text-white placeholder-white/60 focus:outline-none focus:border-white/40"
              />
              <button
                onClick={() => router.push('/workout/history')}
                className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors flex items-center space-x-2 whitespace-nowrap"
              >
                <ChartBarIcon className="h-5 w-5" />
                <span>Statisztikák</span>
              </button>
              <button
                onClick={() => router.push('/workout/create')}
                className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors flex items-center space-x-2 whitespace-nowrap"
              >
                <SparklesIcon className="h-5 w-5" />
                <span>Egyedi edzés</span>
              </button>
              <button
                onClick={handleSyncHealthConnect}
                disabled={importHealthConnectMutation.isPending}
                className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors flex items-center space-x-2 whitespace-nowrap disabled:opacity-60"
              >
                <ArrowPathIcon className={`h-5 w-5 ${importHealthConnectMutation.isPending ? 'animate-spin' : ''}`} />
                <span>{importHealthConnectMutation.isPending ? 'Szinkron...' : 'Health Connect szinkron'}</span>
              </button>
              <button
                onClick={() => setShowAddWorkout(true)}
                className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors flex items-center space-x-2 whitespace-nowrap"
              >
                <PlusIcon className="h-5 w-5" />
                <span>Edzés hozzáadása</span>
              </button>
            </div>

            {/* Mobile Controls */}
            <div className="flex xl:hidden items-center space-x-2 w-full gap-2">
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="flex-1 px-3 py-2 bg-white/10 dark:bg-gray-800/50 border border-white/20 rounded-lg text-white dark:text-white placeholder-white/60 focus:outline-none focus:border-white/40 text-sm"
              />
              <div className="relative">
                <button
                  onClick={() => setShowMenu(!showMenu)}
                  className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                >
                  <EllipsisVerticalIcon className="h-5 w-5 text-white" />
                </button>
                
                {/* Mobile Menu */}
                {showMenu && (
                  <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden z-20">
                    <button
                      onClick={() => {
                        router.push('/workout/history');
                        setShowMenu(false);
                      }}
                      className="w-full px-4 py-3 text-left text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex items-center space-x-2"
                    >
                      <ChartBarIcon className="h-5 w-5" />
                      <span>Statisztikák</span>
                    </button>
                    <button
                      onClick={() => {
                        router.push('/workout/create');
                        setShowMenu(false);
                      }}
                      className="w-full px-4 py-3 text-left text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex items-center space-x-2 border-t border-gray-200 dark:border-gray-700"
                    >
                      <SparklesIcon className="h-5 w-5" />
                      <span>Egyedi edzés</span>
                    </button>
                    <button
                      onClick={() => {
                        setShowAddWorkout(true);
                        setShowMenu(false);
                      }}
                      className="w-full px-4 py-3 text-left text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex items-center space-x-2 border-t border-gray-200 dark:border-gray-700"
                    >
                      <PlusIcon className="h-5 w-5" />
                      <span>Edzés hozzáadása</span>
                    </button>
                    <button
                      onClick={handleSyncHealthConnect}
                      disabled={importHealthConnectMutation.isPending}
                      className="w-full px-4 py-3 text-left text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex items-center space-x-2 border-t border-gray-200 dark:border-gray-700 disabled:opacity-60"
                    >
                      <ArrowPathIcon className={`h-5 w-5 ${importHealthConnectMutation.isPending ? 'animate-spin' : ''}`} />
                      <span>{importHealthConnectMutation.isPending ? 'Szinkron...' : 'Health Connect szinkron'}</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-grow">
        {/* Daily Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          {/* Workouts */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center space-x-3 mb-4">
              <div className="p-2 bg-purple-100 dark:bg-purple-600 rounded-lg">
                <BoltIcon className="h-6 w-6 text-purple-600 dark:text-purple-100" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Napi edzések</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {todayTotals.workouts}
                </p>
              </div>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Heti edzések: {userStats?.workoutsCompleted || 0}
            </p>
          </div>

          {/* Total Minutes */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center space-x-3 mb-4">
              <div className="p-2 bg-blue-100 dark:bg-blue-600 rounded-lg">
                <ClockIcon className="h-6 w-6 text-blue-600 dark:text-blue-100" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Edzés idő</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {todayTotals.minutes} perc
                </p>
              </div>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {Math.floor(todayTotals.minutes / 60)} óra {todayTotals.minutes % 60} perc
            </p>
          </div>

          {/* Calories Burned */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center space-x-3 mb-4">
              <div className="p-2 bg-orange-100 dark:bg-orange-600 rounded-lg">
                <FireIconSolid className="h-6 w-6 text-orange-600 dark:text-orange-100" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Elégetett kalória</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {Math.round(todayTotals.calories)}
                </p>
              </div>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400">Edzésből égetve</p>
          </div>

          {/* Net Calories */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center space-x-3 mb-4">
              <div className="p-2 bg-green-100 dark:bg-green-600 rounded-lg">
                <FireIconSolid className="h-6 w-6 text-green-600 dark:text-green-100" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Nettó kalória</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {Math.round(netCalories)}
                </p>
              </div>
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              <p>{Math.round(caloriesConsumed)} bevitt - {Math.round(caloriesBurnedForSelectedDate)} égetett</p>
              <p className={`font-medium ${caloriesRemaining >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                {caloriesRemaining >= 0 ? `${Math.round(caloriesRemaining)} maradt a célból` : `${Math.abs(Math.round(caloriesRemaining))} túllépve`}
              </p>
            </div>
          </div>
        </div>

        {/* Selected Day Workouts */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 mb-8">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Kiválasztott napi edzések</h2>
              <button
                onClick={() => setShowAddWorkout(true)}
                className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-900 rounded-lg transition-colors"
              >
                <PlusIcon className="h-5 w-5" />
              </button>
            </div>
          </div>
          <div className="p-6">
            {(dailyLogs as unknown as WorkoutLog[]).length > 0 ? (
              <div className="space-y-4">
                {(dailyLogs as unknown as WorkoutLog[]).map((log) => (
                  <div key={log.id} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3">
                        <div className="h-10 w-10 bg-purple-100 dark:bg-purple-600 rounded-full flex items-center justify-center">
                          <BoltIcon className="h-5 w-5 text-purple-600 dark:text-purple-100" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900 dark:text-gray-100">
                            {log.exercise?.name || 'Ismeretlen edzés'}
                          </p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            {log.exercise?.category || 'Egyéb'}
                          </p>
                          {editingLog === log.id ? (
                            <div className="flex items-center space-x-2 mt-2">
                              <input
                                type="number"
                                min="1"
                                max="480"
                                value={editDuration}
                                onChange={(e) => setEditDuration(Math.min(parseInt(e.target.value) || 1, 480))}
                                className="w-20 px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded focus:outline-none focus:ring-1 focus:ring-purple-500"
                              />
                              <span className="text-sm text-gray-500 dark:text-gray-400">perc</span>
                            </div>
                          ) : (
                            <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
                              {log.durationMinutes} perc • {Math.round(Number(log.caloriesBurned || 0))} kcal
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {editingLog === log.id ? (
                        <>
                          <button
                            onClick={() => handleUpdateLog(log.id)}
                            disabled={updateLogMutation.isPending}
                            className="p-2 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition-colors"
                          >
                            <CheckIcon className="h-5 w-5" />
                          </button>
                          <button
                            onClick={handleCancelEdit}
                            className="p-2 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                          >
                            <XMarkIcon className="h-5 w-5" />
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={() => handleEditLog(log)}
                            className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                          >
                            <PencilIcon className="h-5 w-5" />
                          </button>
                          <button
                            onClick={() => handleDeleteLog(log.id)}
                            disabled={deleteLogMutation.isPending}
                            className="p-2 text-red-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                          >
                            <TrashIcon className="h-5 w-5" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <BoltIcon className="h-12 w-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                <p className="text-gray-500 dark:text-gray-400 mb-4">Még nincs edzés rögzítve erre a napra</p>
                <button
                  onClick={() => setShowAddWorkout(true)}
                  className="inline-flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                >
                  <PlusIcon className="h-5 w-5 mr-2" />
                  Edzés hozzáadása
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Weekly Stats */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Heti statisztika</h2>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="text-center p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                <p className="text-3xl font-bold text-purple-600 dark:text-purple-400">{userStats?.workoutsCompleted || 0}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Heti edzések</p>
              </div>
              <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">{userStats?.weeklyWorkoutMinutes || 0}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Heti percek</p>
              </div>
              <div className="text-center p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                <p className="text-3xl font-bold text-orange-600 dark:text-orange-400">{userStats?.weeklyCaloriesBurned || 0}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Heti elégetett kcal</p>
              </div>
              <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <p className="text-3xl font-bold text-green-600 dark:text-green-400">{userStats?.currentStreak || 0}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Napi sorozat</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Add Workout Modal */}
      {showAddWorkout && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                  {selectedExercise ? 'Edzés részletei' : 'Edzés keresése'}
                </h2>
                <button
                  onClick={() => {
                    setShowAddWorkout(false);
                    setSelectedExercise(null);
                    setSearchQuery('');
                    setSelectedCategory('');
                  }}
                  className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-lg"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>
            </div>

            <div className="p-6 overflow-y-auto max-h-[60vh]">
              {selectedExercise ? (
                // Edzés részletei és naplózás
                <div className="space-y-6">
                  <div className="flex items-center space-x-4 p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                    <div className="h-12 w-12 bg-purple-100 dark:bg-purple-600 rounded-full flex items-center justify-center">
                      <BoltIcon className="h-6 w-6 text-purple-600 dark:text-purple-100" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900 dark:text-gray-100">{selectedExercise.name}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">{selectedExercise.category || 'Egyéb'}</p>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Időtartam (perc)
                    </label>
                    <div className="flex items-center space-x-4">
                      <input
                        type="range"
                        min="5"
                        max="180"
                        step="5"
                        value={duration}
                        onChange={(e) => setDuration(parseInt(e.target.value))}
                        className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-purple-600"
                      />
                      <input
                        type="number"
                        min="1"
                        max="480"
                        value={duration}
                        onChange={(e) => setDuration(Math.min(parseInt(e.target.value) || 1, 480))}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />
                    </div>
                    <div className="flex justify-between mt-2">
                      {[15, 30, 45, 60, 90].map((mins) => (
                        <button
                          key={mins}
                          onClick={() => setDuration(mins)}
                          className={`px-3 py-1 text-sm rounded-full transition-colors ${
                            duration === mins
                              ? 'bg-purple-600 text-white'
                              : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                          }`}
                        >
                          {mins} perc
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex justify-between items-center p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
                    <span className="text-gray-600 dark:text-gray-400">Becsült elégetett kalória:</span>
                    <span className="text-xl font-bold text-orange-600 dark:text-orange-400">
                      ~{Math.round((Number(selectedExercise.metValue) || 5) * 70 * (duration / 60))} kcal
                    </span>
                  </div>

                  <div className="flex space-x-3">
                    <button
                      onClick={() => setSelectedExercise(null)}
                      className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                    >
                      Vissza
                    </button>
                    <button
                      onClick={handleAddWorkout}
                      disabled={logWorkoutMutation.isPending}
                      className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 flex items-center justify-center"
                    >
                      {logWorkoutMutation.isPending ? (
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      ) : (
                        <>
                          <PlusIcon className="h-5 w-5 mr-2" />
                          Hozzáadás
                        </>
                      )}
                    </button>
                  </div>
                </div>
              ) : (
                // Edzések keresése és böngészése
                <div className="space-y-4">
                  {/* Search Input */}
                  <div className="relative">
                    <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 dark:text-gray-500" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Edzés keresése..."
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                  </div>

                  {/* Category Filter */}
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => setSelectedCategory('')}
                      className={`px-3 py-1 text-sm rounded-full transition-colors ${
                        !selectedCategory
                          ? 'bg-purple-600 text-white'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                      }`}
                    >
                      Összes
                    </button>
                    {categories.map((category) => (
                      <button
                        key={category}
                        onClick={() => setSelectedCategory(category)}
                        className={`px-3 py-1 text-sm rounded-full transition-colors ${
                          selectedCategory === category
                            ? 'bg-purple-600 text-white'
                            : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                        }`}
                      >
                        {category}
                      </button>
                    ))}
                  </div>

                  {/* Exercise List */}
                  <div className="space-y-2">
                    {isSearching ? (
                      <div className="text-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto"></div>
                        <p className="text-gray-500 dark:text-gray-400 mt-2">Keresés...</p>
                      </div>
                    ) : Object.keys(groupedExercises).length > 0 ? (
                      Object.entries(groupedExercises).map(([category, exercises]) => (
                        <div key={category} className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                          <button
                            onClick={() => toggleCategory(category)}
                            className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 flex items-center justify-between hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                          >
                            <span className="font-medium text-gray-900 dark:text-gray-100">{category}</span>
                            <div className="flex items-center space-x-2">
                              <span className="text-sm text-gray-500 dark:text-gray-400">{exercises.length} edzés</span>
                              {expandedCategories.has(category) ? (
                                <ChevronUpIcon className="h-5 w-5 text-gray-400 dark:text-gray-500" />
                              ) : (
                                <ChevronDownIcon className="h-5 w-5 text-gray-400 dark:text-gray-500" />
                              )}
                            </div>
                          </button>
                          {expandedCategories.has(category) && (
                            <div className="divide-y divide-gray-100 dark:divide-gray-700">
                              {exercises.map((exercise) => (
                                <button
                                  key={exercise.id}
                                  onClick={() => {
                                    setSelectedExercise(exercise);
                                    setDuration(exercise.defaultDurationMinutes || 30);
                                  }}
                                  className="w-full px-4 py-3 flex items-center justify-between hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-colors text-left"
                                >
                                  <div className="flex items-center space-x-3">
                                    <div className="h-8 w-8 bg-purple-100 dark:bg-purple-600 rounded-full flex items-center justify-center">
                                      <BoltIcon className="h-4 w-4 text-purple-600 dark:text-purple-100" />
                                    </div>
                                    <span className="text-gray-900 dark:text-gray-100">{exercise.name}</span>
                                  </div>
                                  <div className="text-sm text-gray-500 dark:text-gray-400">
                                    MET: {Number(exercise.metValue || 5).toFixed(1)}
                                  </div>
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-8">
                        <BoltIcon className="h-12 w-12 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
                        <p className="text-gray-500 dark:text-gray-400 mb-4">
                          {searchQuery ? 'Nincs találat' : 'Kezdj el írni a kereséshez'}
                        </p>
                        {searchQuery && (
                          <button
                            onClick={() => {
                              setShowAddWorkout(false);
                              router.push('/workout/create');
                            }}
                            className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-orange-600 to-red-600 text-white rounded-lg hover:from-orange-700 hover:to-red-700 transition-colors"
                          >
                            <PlusCircleIcon className="h-5 w-5 mr-2" />
                            Egyedi edzés létrehozása
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
    </>
  );
}
