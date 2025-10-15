'use client'

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { trpc } from "@/lib/trpc";
import Header from "@/components/header";
import Footer from "@/components/footer";
import {
  CalendarIcon,
  ChartBarIcon,
  FireIcon,
  HeartIcon,
  TrophyIcon,
  UserIcon,
  CogIcon,
  ArrowTrendingUpIcon,
  ClockIcon,
  PlayIcon,
  PlusIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import { 
  FireIcon as FireIconSolid,
  HeartIcon as HeartIconSolid 
} from '@heroicons/react/24/solid';

export default function UserPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { data: stats, isLoading, error } = trpc.user.stats.useQuery(undefined, {
    enabled: status === "authenticated",
  });
  const { data: profileData, isLoading: profileLoading } = trpc.user.profile.useQuery(undefined, {
    enabled: status === "authenticated",
  });

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin");
    }
  }, [status, router]);

  if (status === "loading" || isLoading || profileLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (status === "unauthenticated") {
    return null;
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-red-600">Error loading user data</div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div>No data available</div>
      </div>
    );
  }

  const caloriesProgress = (stats.caloriesConsumed / stats.caloriesTarget) * 100;
  const workoutProgress = (stats.workoutsCompleted / stats.weeklyGoal) * 100;
  const waterProgress = (stats.waterIntake / stats.waterTarget) * 100;
  const caloriesRemaining = 2000 - stats.caloriesConsumed;

  return (
    <>
    <Header />
    <div className="min-h-screen bg-gray-50">
      {/* Header Section */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-700 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="h-16 w-16 bg-white/10 rounded-full flex items-center justify-center">
                <UserIcon className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold">
                  Welcome back, {session?.user?.name || 'User'}!
                </h1>
                <p className="text-blue-100 mt-1">
                  Keep up the great work on your fitness journey
                </p>
              </div>
            </div>
            <button className="p-2 bg-white/10 rounded-lg hover:bg-white/20 transition-colors">
              <CogIcon className="h-6 w-6" />
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Profile Completion Banner */}
        {profileData && !profileData.isComplete && (
          <div className="mb-8 bg-gradient-to-r from-orange-50 to-red-50 border border-orange-200 rounded-xl p-6">
            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0">
                <ExclamationTriangleIcon className="h-6 w-6 text-orange-600" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-orange-900 mb-2">
                  Complete Your Profile
                </h3>
                <p className="text-orange-700 mb-4">
                  Your profile is incomplete. Complete it now to get personalized recommendations and better track your fitness journey.
                </p>
                <button
                  onClick={() => router.push('/auth/complete_profile')}
                  className="inline-flex items-center px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white font-medium rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2"
                >
                  Finish Your Profile Now
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Calories Card */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <FireIconSolid className="h-6 w-6 text-orange-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Calories Today</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {stats.caloriesConsumed}
                  </p>
                </div>
              </div>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-orange-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${Math.min(caloriesProgress, 100)}%` }}
              ></div>
            </div>
            <p className="text-sm text-gray-500 mt-2">
              {caloriesRemaining > 0 ? `${Math.round(caloriesRemaining)} remaining` : `${Math.round(Math.abs(caloriesRemaining))} over goal`} 
            </p>
          </div>

          {/* Workouts Card */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <ChartBarIcon className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Workouts This Week</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {stats.workoutsCompleted}
                  </p>
                </div>
              </div>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${Math.min(workoutProgress, 100)}%` }}
              ></div>
            </div>
            <p className="text-sm text-gray-500 mt-2">
              {stats.weeklyGoal - stats.workoutsCompleted} more to reach goal
            </p>
          </div>

          {/* Water Intake Card */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-cyan-100 rounded-lg">
                  <HeartIconSolid className="h-6 w-6 text-cyan-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Water Today</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {stats.waterIntake} cups
                  </p>
                </div>
              </div>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-cyan-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${Math.min(waterProgress, 100)}%` }}
              ></div>
            </div>
            <p className="text-sm text-gray-500 mt-2">
              {stats.waterTarget - stats.waterIntake} cups remaining
            </p>
          </div>

          {/* Streak Card */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-yellow-100 rounded-lg">
                  <TrophyIcon className="h-6 w-6 text-yellow-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Current Streak</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {stats.currentStreak} days
                  </p>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-2 text-sm text-gray-500">
              <ArrowTrendingUpIcon className="h-4 w-4" />
              <span>Keep it up!</span>
            </div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Recent Activities */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-xl font-semibold text-gray-900">Recent Activities</h2>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  {stats.recentActivities.length > 0 ? (
                    stats.recentActivities.map((activity, index) => (
                      <div key={activity.id} className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
                        <div className={`p-2 bg-white rounded-lg ${
                          activity.type === 'exercise' ? 'text-green-600' : 
                          activity.name.toLowerCase().includes('breakfast') ? 'text-blue-600' :
                          activity.name.toLowerCase().includes('lunch') ? 'text-orange-600' :
                          'text-purple-600'
                        }`}>
                          {activity.type === 'exercise' ? (
                            <PlayIcon className="h-5 w-5" />
                          ) : (
                            <CalendarIcon className="h-5 w-5" />
                          )}
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-gray-900">{activity.name}</p>
                          <p className="text-sm text-gray-500">{activity.time}</p>
                        </div>
                        <div className="text-sm font-medium text-gray-900">
                          {activity.calories}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <p>No recent activities to show</p>
                      <p className="text-sm">Start logging your meals and workouts!</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="space-y-6">
            {/* Quick Log */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
              <div className="space-y-3">
                <button 
                  onClick={() => router.push('/food/log')}
                  className="w-full p-4 bg-blue-50 hover:bg-blue-100 rounded-lg text-left transition-colors"
                >
                  <div className="flex items-center space-x-3">
                    <CalendarIcon className="h-5 w-5 text-blue-600" />
                    <span className="font-medium text-blue-900">Log Food</span>
                  </div>
                </button>
                <button 
                  onClick={() => router.push('/food/create')}
                  className="w-full p-4 bg-purple-50 hover:bg-purple-100 rounded-lg text-left transition-colors"
                >
                  <div className="flex items-center space-x-3">
                    <PlusIcon className="h-5 w-5 text-purple-600" />
                    <span className="font-medium text-purple-900">Create Custom Food</span>
                  </div>
                </button>
                <button className="w-full p-4 bg-green-50 hover:bg-green-100 rounded-lg text-left transition-colors">
                  <div className="flex items-center space-x-3">
                    <PlayIcon className="h-5 w-5 text-green-600" />
                    <span className="font-medium text-green-900">Start Workout</span>
                  </div>
                </button>
                <button 
                  onClick={() => router.push('/progress/view')}
                  className="w-full p-4 bg-orange-50 hover:bg-orange-100 rounded-lg text-left transition-colors"
                >
                  <div className="flex items-center space-x-3">
                    <ChartBarIcon className="h-5 w-5 text-orange-600" />
                    <span className="font-medium text-orange-900">View Progress</span>
                  </div>
                </button>
              </div>
            </div>

            {/* Weekly Summary */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">This Week</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Total Workouts</span>
                  <span className="font-semibold text-gray-900">{stats.totalWorkouts}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Avg. Calories/Day (7d)</span>
                  <span className="font-semibold text-gray-900">
                    {stats.avgCaloriesPerDay ? stats.avgCaloriesPerDay.toLocaleString() : 'No data'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Goals Met</span>
                  <span className="font-semibold text-green-600">85%</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    <Footer />
    </>
  );
}
