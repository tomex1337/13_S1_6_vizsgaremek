'use client'

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { trpc } from "@/lib/trpc";
import Header from "@/components/header";
import Footer from "@/components/footer";
import {
  CalendarIcon,
  ChartBarIcon,
  ClockIcon,
  ArrowLeftIcon,
  ArrowRightIcon
} from '@heroicons/react/24/outline';
import {
  FireIcon as FireIconSolid,
  BoltIcon
} from '@heroicons/react/24/solid';

interface WorkoutLog {
  id: string;
  durationMinutes: number | null;
  caloriesBurned: number | string | null;
  logDate: Date | null;
  createdAt: Date | null;
  exercise: {
    id: string;
    name: string;
    category?: string | null;
  } | null;
}

export default function WorkoutHistoryPage() {
  const { status } = useSession();
  const router = useRouter();
  const [startDate, setStartDate] = useState(() => {
    const date = new Date();
    date.setDate(date.getDate() - 7);
    return date;
  });
  const [endDate, setEndDate] = useState(new Date());

  const { data: workoutStats } = trpc.workout.getStats.useQuery({
    startDate: startDate.toISOString().split('T')[0],
    endDate: endDate.toISOString().split('T')[0]
  }, {
    enabled: status === "authenticated"
  });

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin");
    }
  }, [status, router]);

  const goToPreviousWeek = () => {
    const newStart = new Date(startDate);
    newStart.setDate(newStart.getDate() - 7);
    const newEnd = new Date(endDate);
    newEnd.setDate(newEnd.getDate() - 7);
    setStartDate(newStart);
    setEndDate(newEnd);
  };

  const goToNextWeek = () => {
    const newStart = new Date(startDate);
    newStart.setDate(newStart.getDate() + 7);
    const newEnd = new Date(endDate);
    newEnd.setDate(newEnd.getDate() + 7);
    setStartDate(newStart);
    setEndDate(newEnd);
  };

  const goToCurrentWeek = () => {
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - 7);
    setStartDate(start);
    setEndDate(end);
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('hu-HU', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

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

  const categoryColors: { [key: string]: string } = {
    'Kardió': 'bg-red-100 text-red-800',
    'Erősítés': 'bg-blue-100 text-blue-800',
    'Rugalmasság': 'bg-green-100 text-green-800',
    'Sport': 'bg-yellow-100 text-yellow-800',
    'Edzőterem': 'bg-purple-100 text-purple-800',
    'Otthoni edzés': 'bg-orange-100 text-orange-800',
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-800 flex flex-col">
      <Header />
      
      {/* Header Section */}
      <div className="bg-gradient-to-r from-purple-600 to-indigo-700 dark:from-purple-800 dark:to-indigo-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center space-x-4">
              <div className="h-16 w-16 bg-white/10 rounded-full flex items-center justify-center">
                <ChartBarIcon className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold !text-white">Edzés Statisztikák</h1>
                <p className="!text-purple-100 mt-1">
                  Elemezd az edzési előrehaladásodat
                </p>
              </div>
            </div>
            <button
              onClick={() => router.push('/workout')}
              className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors flex items-center space-x-2"
            >
              <BoltIcon className="h-5 w-5" />
              <span>Vissza az edzésnaplóhoz</span>
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-grow">
        {/* Date Range Selector */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-8">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center space-x-4">
              <CalendarIcon className="h-6 w-6 text-gray-400 dark:text-gray-500" />
              <span className="text-gray-700 dark:text-gray-300 font-medium">
                {formatDate(startDate)} - {formatDate(endDate)}
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={goToPreviousWeek}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <ArrowLeftIcon className="h-5 w-5 text-gray-600 dark:text-gray-400" />
              </button>
              <button
                onClick={goToCurrentWeek}
                className="px-4 py-2 text-sm bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-200 rounded-lg hover:bg-purple-200 dark:hover:bg-purple-800 transition-colors"
              >
                Ez a hét
              </button>
              <button
                onClick={goToNextWeek}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <ArrowRightIcon className="h-5 w-5 text-gray-600 dark:text-gray-400" />
              </button>
            </div>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center space-x-3 mb-2">
              <div className="p-2 bg-purple-100 dark:bg-purple-600 rounded-lg">
                <BoltIcon className="h-6 w-6 text-purple-600 dark:text-purple-100" />
              </div>
              <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Összes edzés</span>
            </div>
            <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">{workoutStats?.totalWorkouts || 0}</p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center space-x-3 mb-2">
              <div className="p-2 bg-blue-100 dark:bg-blue-600 rounded-lg">
                <ClockIcon className="h-6 w-6 text-blue-600 dark:text-blue-100" />
              </div>
              <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Összes idő</span>
            </div>
            <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">{workoutStats?.totalMinutes || 0} perc</p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {Math.floor((workoutStats?.totalMinutes || 0) / 60)} óra {(workoutStats?.totalMinutes || 0) % 60} perc
            </p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center space-x-3 mb-2">
              <div className="p-2 bg-orange-100 dark:bg-orange-600 rounded-lg">
                <FireIconSolid className="h-6 w-6 text-orange-600 dark:text-orange-100" />
              </div>
              <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Elégetett kalória</span>
            </div>
            <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">{Math.round(workoutStats?.totalCaloriesBurned || 0)}</p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center space-x-3 mb-2">
              <div className="p-2 bg-green-100 dark:bg-green-600 rounded-lg">
                <ChartBarIcon className="h-6 w-6 text-green-600 dark:text-green-100" />
              </div>
              <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Átlag / edzés</span>
            </div>
            <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">{workoutStats?.averageMinutesPerWorkout || 0} perc</p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              ~{workoutStats?.averageCaloriesPerWorkout || 0} kcal
            </p>
          </div>
        </div>

        {/* Category Breakdown */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Kategória szerinti bontás</h2>
          </div>
          <div className="p-6">
            {workoutStats?.byCategory && Object.keys(workoutStats.byCategory).length > 0 ? (
              <div className="space-y-4">
                {Object.entries(workoutStats.byCategory).map(([category, stats]) => {
                  const totalWorkouts = workoutStats.totalWorkouts || 1;
                  const percentage = Math.round((stats.count / totalWorkouts) * 100);
                  
                  return (
                    <div key={category} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
                      <div className="flex items-center space-x-4">
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${categoryColors[category] || 'bg-gray-100 text-gray-800'}`}>
                          {category}
                        </span>
                        <div>
                          <p className="font-medium text-gray-900 dark:text-gray-100">{stats.count} edzés</p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">{stats.minutes} perc • {Math.round(stats.calories)} kcal</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-4">
                        <div className="w-32 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                          <div 
                            className="bg-purple-600 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${percentage}%` }}
                          ></div>
                        </div>
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300 w-12 text-right">{percentage}%</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-12">
                <BoltIcon className="h-12 w-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                <p className="text-gray-500 dark:text-gray-400">Nincs edzés ebben az időszakban</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
