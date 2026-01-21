'use client'

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { trpc } from "@/lib/trpc";
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
  SparklesIcon
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

export default function WorkoutLogPage() {
  const { status } = useSession();
  const router = useRouter();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [showAddWorkout, setShowAddWorkout] = useState(false);
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null);
  const [duration, setDuration] = useState(30);
  const [editingLog, setEditingLog] = useState<string | null>(null);
  const [editDuration, setEditDuration] = useState(30);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());

  // tRPC queries and mutations
  const { data: categories = [] } = trpc.workout.getCategories.useQuery(undefined, {
    enabled: status === "authenticated"
  });
  
  const { data: dailyLogs = [], refetch: refetchLogs } = trpc.workout.getDailyLogs.useQuery({
    date: selectedDate.toISOString().split('T')[0]
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
        logDate: selectedDate.toISOString().split('T')[0]
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

  const toggleCategory = (category: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(category)) {
      newExpanded.delete(category);
    } else {
      newExpanded.add(category);
    }
    setExpandedCategories(newExpanded);
  };

  // Group search results by category
  const groupedExercises = searchResults.reduce((acc, exercise) => {
    const category = exercise.category || 'Egyéb';
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(exercise);
    return acc;
  }, {} as Record<string, typeof searchResults>);

  // Calculate today's totals
  const todayTotals = (dailyLogs as unknown as WorkoutLog[]).reduce(
    (totals, log) => ({
      workouts: totals.workouts + 1,
      minutes: totals.minutes + (log.durationMinutes || 0),
      calories: totals.calories + Number(log.caloriesBurned || 0)
    }),
    { workouts: 0, minutes: 0, calories: 0 }
  );

  // Calculate net calories (consumed - burned)
  const calorieGoal = userStats?.caloriesTarget || 2000;
  const caloriesConsumed = userStats?.caloriesConsumed || 0;
  const caloriesBurnedToday = userStats?.caloriesBurned || todayTotals.calories;
  const netCalories = caloriesConsumed - caloriesBurnedToday;
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
    <div className="min-h-screen bg-gray-50 flex flex-col">
    
      {/* Header Section */}
      <div className="bg-gradient-to-r from-purple-600 to-indigo-700 dark:from-purple-800 dark:to-indigo-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center space-x-4">
              <div className="h-16 w-16 bg-white/10 rounded-full flex items-center justify-center">
                <BoltIcon className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold !text-white">Edzésnapló</h1>
                <p className="!text-purple-100 mt-1">
                  Kövesd nyomon az edzéseidet és égesd a kalóriákat
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
                onClick={() => router.push('/workout/history')}
                className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors flex items-center space-x-2"
              >
                <ChartBarIcon className="h-5 w-5" />
                <span>Statisztikák</span>
              </button>
              <button
                onClick={() => router.push('/workout/create')}
                className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors flex items-center space-x-2"
              >
                <SparklesIcon className="h-5 w-5" />
                <span>Egyéni edzés</span>
              </button>
              <button
                onClick={() => setShowAddWorkout(true)}
                className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors flex items-center space-x-2"
              >
                <PlusIcon className="h-5 w-5" />
                <span>Edzés hozzáadása</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-grow">
        {/* Daily Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          {/* Workouts Today */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center space-x-3 mb-4">
              <div className="p-2 bg-purple-100 rounded-lg">
                <BoltIcon className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Mai edzések</p>
                <p className="text-2xl font-bold text-gray-900">
                  {todayTotals.workouts}
                </p>
              </div>
            </div>
            <p className="text-sm text-gray-500">
              Heti edzések: {userStats?.workoutsCompleted || 0}
            </p>
          </div>

          {/* Total Minutes */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center space-x-3 mb-4">
              <div className="p-2 bg-blue-100 rounded-lg">
                <ClockIcon className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Edzés idő</p>
                <p className="text-2xl font-bold text-gray-900">
                  {todayTotals.minutes} perc
                </p>
              </div>
            </div>
            <p className="text-sm text-gray-500">
              {Math.floor(todayTotals.minutes / 60)} óra {todayTotals.minutes % 60} perc
            </p>
          </div>

          {/* Calories Burned */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center space-x-3 mb-4">
              <div className="p-2 bg-orange-100 rounded-lg">
                <FireIconSolid className="h-6 w-6 text-orange-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Elégetett kalória</p>
                <p className="text-2xl font-bold text-gray-900">
                  {Math.round(todayTotals.calories)}
                </p>
              </div>
            </div>
            <p className="text-sm text-gray-500">
              Edzésből ma égetve
            </p>
          </div>

          {/* Net Calories */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center space-x-3 mb-4">
              <div className="p-2 bg-green-100 rounded-lg">
                <FireIconSolid className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Nettó kalória</p>
                <p className="text-2xl font-bold text-gray-900">
                  {Math.round(netCalories)}
                </p>
              </div>
            </div>
            <div className="text-sm text-gray-500">
              <p>{caloriesConsumed} bevitt - {Math.round(caloriesBurnedToday)} égetett</p>
              <p className={`font-medium ${caloriesRemaining >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {caloriesRemaining >= 0 ? `${Math.round(caloriesRemaining)} maradt a célból` : `${Math.abs(Math.round(caloriesRemaining))} túllépve`}
              </p>
            </div>
          </div>
        </div>

        {/* Today's Workouts */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-8">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900">Mai edzések</h2>
              <button
                onClick={() => setShowAddWorkout(true)}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
              >
                <PlusIcon className="h-5 w-5" />
              </button>
            </div>
          </div>
          <div className="p-6">
            {(dailyLogs as unknown as WorkoutLog[]).length > 0 ? (
              <div className="space-y-4">
                {(dailyLogs as unknown as WorkoutLog[]).map((log) => (
                  <div key={log.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3">
                        <div className="h-10 w-10 bg-purple-100 rounded-full flex items-center justify-center">
                          <BoltIcon className="h-5 w-5 text-purple-600" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">
                            {log.exercise?.name || 'Ismeretlen edzés'}
                          </p>
                          <p className="text-sm text-gray-500">
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
                                className="w-20 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-purple-500"
                              />
                              <span className="text-sm text-gray-500">perc</span>
                            </div>
                          ) : (
                            <p className="text-sm text-gray-400 mt-1">
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
                            className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                          >
                            <CheckIcon className="h-5 w-5" />
                          </button>
                          <button
                            onClick={handleCancelEdit}
                            className="p-2 text-gray-400 hover:bg-gray-100 rounded-lg transition-colors"
                          >
                            <XMarkIcon className="h-5 w-5" />
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={() => handleEditLog(log)}
                            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                          >
                            <PencilIcon className="h-5 w-5" />
                          </button>
                          <button
                            onClick={() => handleDeleteLog(log.id)}
                            disabled={deleteLogMutation.isPending}
                            className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
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
                <BoltIcon className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 mb-4">Még nincs edzés rögzítve ma</p>
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
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">Heti statisztika</h2>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <p className="text-3xl font-bold text-purple-600">{userStats?.workoutsCompleted || 0}</p>
                <p className="text-sm text-gray-600 mt-1">Heti edzések</p>
              </div>
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <p className="text-3xl font-bold text-blue-600">{userStats?.weeklyWorkoutMinutes || 0}</p>
                <p className="text-sm text-gray-600 mt-1">Heti percek</p>
              </div>
              <div className="text-center p-4 bg-orange-50 rounded-lg">
                <p className="text-3xl font-bold text-orange-600">{userStats?.weeklyCaloriesBurned || 0}</p>
                <p className="text-sm text-gray-600 mt-1">Heti elégetett kcal</p>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <p className="text-3xl font-bold text-green-600">{userStats?.currentStreak || 0}</p>
                <p className="text-sm text-gray-600 mt-1">Napi sorozat</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Add Workout Modal */}
      {showAddWorkout && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900">
                  {selectedExercise ? 'Edzés részletei' : 'Edzés keresése'}
                </h2>
                <button
                  onClick={() => {
                    setShowAddWorkout(false);
                    setSelectedExercise(null);
                    setSearchQuery('');
                    setSelectedCategory('');
                  }}
                  className="p-2 text-gray-400 hover:text-gray-600 rounded-lg"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>
            </div>

            <div className="p-6 overflow-y-auto max-h-[60vh]">
              {selectedExercise ? (
                // Exercise details and logging
                <div className="space-y-6">
                  <div className="flex items-center space-x-4 p-4 bg-purple-50 rounded-lg">
                    <div className="h-12 w-12 bg-purple-100 rounded-full flex items-center justify-center">
                      <BoltIcon className="h-6 w-6 text-purple-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">{selectedExercise.name}</p>
                      <p className="text-sm text-gray-500">{selectedExercise.category || 'Egyéb'}</p>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Időtartam (perc)
                    </label>
                    <div className="space-y-3">
                      <input
                        type="range"
                        min="5"
                        max="180"
                        step="5"
                        value={duration}
                        onChange={(e) => setDuration(parseInt(e.target.value))}
                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-purple-600"
                      />
                      <input
                        type="number"
                        min="1"
                        max="480"
                        value={duration}
                        onChange={(e) => setDuration(Math.min(parseInt(e.target.value) || 1, 480))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />
                    </div>
                    <div className="flex justify-between mt-2">
                      {[15, 30, 45, 60, 90, 120, 145, 180].map((mins) => (
                        <button
                          key={mins}
                          onClick={() => setDuration(mins)}
                          className={`px-3 py-1 text-sm rounded-full transition-colors ${
                            duration === mins
                              ? 'bg-purple-600 text-white'
                              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                          }`}
                        >
                          {mins} perc
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
                    <span className="text-gray-600">Becsült elégetett kalória:</span>
                    <span className="text-xl font-bold text-orange-600">
                      ~{Math.round((Number(selectedExercise.metValue) || 5) * 70 * (duration / 60))} kcal
                    </span>
                  </div>

                  <div className="flex space-x-3">
                    <button
                      onClick={() => setSelectedExercise(null)}
                      className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
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
                // Search and browse exercises
                <div className="space-y-4">
                  {/* Search Input */}
                  <div className="relative">
                    <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Edzés keresése..."
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                  </div>

                  {/* Category Filter */}
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => setSelectedCategory('')}
                      className={`px-3 py-1 text-sm rounded-full transition-colors ${
                        !selectedCategory
                          ? 'bg-purple-600 text-white'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
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
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
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
                        <p className="text-gray-500 mt-2">Keresés...</p>
                      </div>
                    ) : Object.keys(groupedExercises).length > 0 ? (
                      Object.entries(groupedExercises).map(([category, exercises]) => (
                        <div key={category} className="border border-gray-200 rounded-lg overflow-hidden">
                          <button
                            onClick={() => toggleCategory(category)}
                            className="w-full px-4 py-3 bg-gray-50 flex items-center justify-between hover:bg-gray-100 transition-colors"
                          >
                            <span className="font-medium text-gray-900">{category}</span>
                            <div className="flex items-center space-x-2">
                              <span className="text-sm text-gray-500">{exercises.length} edzés</span>
                              {expandedCategories.has(category) ? (
                                <ChevronUpIcon className="h-5 w-5 text-gray-400" />
                              ) : (
                                <ChevronDownIcon className="h-5 w-5 text-gray-400" />
                              )}
                            </div>
                          </button>
                          {expandedCategories.has(category) && (
                            <div className="divide-y divide-gray-100">
                              {exercises.map((exercise) => (
                                <button
                                  key={exercise.id}
                                  onClick={() => {
                                    setSelectedExercise(exercise);
                                    setDuration(exercise.defaultDurationMinutes || 30);
                                  }}
                                  className="w-full px-4 py-3 flex items-center justify-between hover:bg-purple-50 transition-colors text-left"
                                >
                                  <div className="flex items-center space-x-3">
                                    <div className="h-8 w-8 bg-purple-100 rounded-full flex items-center justify-center">
                                      <BoltIcon className="h-4 w-4 text-purple-600" />
                                    </div>
                                    <span className="text-gray-900">{exercise.name}</span>
                                  </div>
                                  <div className="text-sm text-gray-500">
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
                        <BoltIcon className="h-12 w-12 text-gray-300 mx-auto mb-2" />
                        <p className="text-gray-500 mb-4">
                          {searchQuery ? 'Nincs találat' : 'Kezdj el írni a kereséshez'}
                        </p>
                        {searchQuery && (
                          <button
                            onClick={() => {
                              setShowAddWorkout(false);
                              router.push('/workout/create');
                            }}
                            className="inline-flex items-center px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
                          >
                            <SparklesIcon className="h-5 w-5 mr-2" />
                            Egyéni edzés létrehozása
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
