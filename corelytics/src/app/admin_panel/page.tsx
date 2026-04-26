'use client'

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { trpc } from "@/lib/trpc";
import Header from "@/components/header";
import Footer from "@/components/footer";
import {
  ShieldCheckIcon,
  TrashIcon,
  UserGroupIcon,
  MagnifyingGlassIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  XCircleIcon,
  NoSymbolIcon,
} from '@heroicons/react/24/outline';

// Jogosultsági szint megnevezések
const permissionLevelNames: { [key: number]: string } = {
  0: 'Felhasználó',
  1: 'Moderátor',
  2: 'Admin'
};

// Jogosultsági szint színek
const permissionLevelColors: { [key: number]: string } = {
  0: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
  1: 'bg-blue-100 text-blue-800 dark:bg-blue-700 dark:text-blue-200',
  2: 'bg-purple-100 text-purple-800 dark:bg-purple-700 dark:text-purple-200'
};

export default function AdminPanelPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  
  // Állapotok
  const [activeTab, setActiveTab] = useState<'foods' | 'users'>('foods');
  const [foodSearch, setFoodSearch] = useState('');
  const [userSearch, setUserSearch] = useState('');
  const [deleteConfirmFood, setDeleteConfirmFood] = useState<string | null>(null);
  const [deactivateConfirmUser, setDeactivateConfirmUser] = useState<string | null>(null);
  const [showDisablePrompt, setShowDisablePrompt] = useState<{ foodId: string; creatorId: string | null; creatorName: string } | null>(null);
  const [editingUser, setEditingUser] = useState<string | null>(null);
  const [newPermissionLevel, setNewPermissionLevel] = useState<number>(0);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  
  // Jogosultsági szint lekérése
  const { data: permissionData, isLoading: permissionLoading } = trpc.admin.getPermissionLevel.useQuery(undefined, {
    enabled: status === "authenticated",
  });
  
  // Egyedi ételek lekérése
  const { data: foodsData, isLoading: foodsLoading, refetch: refetchFoods } = trpc.admin.getCustomFoods.useQuery(
    { search: foodSearch || undefined },
    { enabled: status === "authenticated" && (permissionData?.permissionLevel ?? 0) >= 1 }
  );
  
  // Felhasználók lekérése (csak admin)
  const { data: usersData, isLoading: usersLoading, refetch: refetchUsers } = trpc.admin.getUsers.useQuery(
    { search: userSearch || undefined },
    { enabled: status === "authenticated" && (permissionData?.permissionLevel ?? 0) >= 2 }
  );
  
  // Mutációk
  const deleteFoodMutation = trpc.admin.deleteCustomFood.useMutation({
    onSuccess: (_data, variables) => {
      setSuccessMessage('Étel sikeresen törölve');
      setDeleteConfirmFood(null);
      
      // Keressük meg az ételt, hogy megkapjuk a létrehozó adatait
      const deletedFood = foodsData?.foods.find(f => f.id === variables.foodId);
      if (deletedFood?.createdByUser?.id && isAdmin) {
        setShowDisablePrompt({
          foodId: variables.foodId,
          creatorId: deletedFood.createdByUser.id,
          creatorName: deletedFood.createdByUser.username
        });
      }
      
      refetchFoods();
      setTimeout(() => setSuccessMessage(null), 3000);
    },
    onError: (error) => {
      setErrorMessage(error.message || 'Hiba történt a törlés során');
      setTimeout(() => setErrorMessage(null), 5000);
    }
  });
  
  const updatePermissionMutation = trpc.admin.updateUserPermission.useMutation({
    onSuccess: (data) => {
      setSuccessMessage(`${data.username} jogosultsági szintje sikeresen módosítva`);
      setEditingUser(null);
      refetchUsers();
      setTimeout(() => setSuccessMessage(null), 3000);
    },
    onError: (error) => {
      setErrorMessage(error.message || 'Hiba történt a módosítás során');
      setTimeout(() => setErrorMessage(null), 5000);
    }
  });
  
  const toggleCustomFoodMutation = trpc.admin.toggleCustomFoodPermission.useMutation({
    onSuccess: (data) => {
      setSuccessMessage(`${data.username} egyedi étel létrehozási joga ${data.canCreateCustomFood ? 'engedélyezve' : 'letiltva'}`);
      refetchUsers();
      setTimeout(() => setSuccessMessage(null), 3000);
    },
    onError: (error) => {
      setErrorMessage(error.message || 'Hiba történt a módosítás során');
      setTimeout(() => setErrorMessage(null), 5000);
    }
  });
  
  // Felhasználó deaktiválása
  const deactivateUserMutation = trpc.admin.deactivateUser.useMutation({
    onSuccess: (data) => {
      setSuccessMessage(`${data.username} fiókja sikeresen deaktiválva`);
      setDeactivateConfirmUser(null);
      refetchUsers();
      setTimeout(() => setSuccessMessage(null), 3000);
    },
    onError: (error) => {
      setErrorMessage(error.message || 'Hiba történt a deaktiválás során');
      setTimeout(() => setErrorMessage(null), 5000);
    }
  });
  
  // Felhasználó újraaktiválása
  const reactivateUserMutation = trpc.admin.reactivateUser.useMutation({
    onSuccess: (data) => {
      setSuccessMessage(`${data.username} fiókja sikeresen újraaktiválva`);
      refetchUsers();
      setTimeout(() => setSuccessMessage(null), 3000);
    },
    onError: (error) => {
      setErrorMessage(error.message || 'Hiba történt az újraaktiválás során');
      setTimeout(() => setErrorMessage(null), 5000);
    }
  });
  
  // Bejelentkezés ellenőrzése
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin");
    }
  }, [status, router]);
  
  // Jogosultság ellenőrzése
  useEffect(() => {
    if (!permissionLoading && permissionData && permissionData.permissionLevel < 1) {
      router.push("/user");
    }
  }, [permissionLoading, permissionData, router]);
  
  // Törlés kezelése
  const handleDeleteFood = (foodId: string) => {
    deleteFoodMutation.mutate({ foodId });
  };
  
  // Jogosultság módosítás kezelése
  const handleUpdatePermission = (userId: string) => {
    updatePermissionMutation.mutate({ userId, permissionLevel: newPermissionLevel });
  };
  
  // Szerkesztés indítása
  const startEditingUser = (userId: string, currentLevel: number) => {
    setEditingUser(userId);
    setNewPermissionLevel(currentLevel);
  };
  
  // Felhasználó deaktiválás kezelése
  const handleDeactivateUser = (userId: string) => {
    deactivateUserMutation.mutate({ userId });
  };
  
  // Felhasználó újraaktiválás kezelése
  const handleReactivateUser = (userId: string) => {
    reactivateUserMutation.mutate({ userId });
  };
  
  // Egyedi étel létrehozási jog váltása
  const handleToggleCustomFood = (userId: string, currentValue: boolean) => {
    toggleCustomFoodMutation.mutate({ userId, canCreateCustomFood: !currentValue });
  };
  
  // Létrehozó letiltása a prompt után
  const handleDisableCreator = () => {
    if (showDisablePrompt?.creatorId) {
      toggleCustomFoodMutation.mutate({ 
        userId: showDisablePrompt.creatorId, 
        canCreateCustomFood: false 
      });
    }
    setShowDisablePrompt(null);
  };
  
  // Prompt elutasítása
  const handleSkipDisable = () => {
    setShowDisablePrompt(null);
  };
  
  // Betöltési állapot
  if (status === "loading" || permissionLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }
  
  // Jogosultság ellenőrzése
  if (status === "unauthenticated" || !permissionData || permissionData.permissionLevel < 1) {
    return null;
  }
  
  const isAdmin = permissionData.permissionLevel >= 2;
  
  return (
    <>
      <Header />
      <div className="min-h-screen bg-gray-50 dark:bg-gray-800">
        {/* Header szekció */}
        <div className="bg-gradient-to-r from-purple-600 to-indigo-700 dark:from-purple-800 dark:to-indigo-900 text-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="flex items-center space-x-4">
              <div className="h-16 w-16 bg-white/10 rounded-full flex items-center justify-center">
                <ShieldCheckIcon className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold !text-gray-900 dark:text-gray-100">
                  Admin Panel
                </h1>
                <p className="!dark:text-purple-100 !text-purple-900 mt-1">
                  {isAdmin ? 'Teljes adminisztrátori hozzáférés' : 'Moderátori hozzáférés'}
                </p>
              </div>
            </div>
          </div>
        </div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Létrehozó letiltása prompt modal */}
          {showDisablePrompt && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl p-6 max-w-md mx-4">
                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0">
                    <ExclamationTriangleIcon className="h-6 w-6 text-orange-500" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                      Létrehozó letiltása?
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                      Szeretnéd letiltani <span className="font-semibold text-gray-900 dark:text-gray-100">{showDisablePrompt.creatorName}</span> felhasználó egyedi étel létrehozási jogát?
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-500 mb-4">
                      Ez megakadályozza, hogy a felhasználó a jövőben új egyedi ételeket hozzon létre.
                    </p>
                    <div className="flex space-x-3">
                      <button
                        onClick={handleDisableCreator}
                        disabled={toggleCustomFoodMutation.isPending}
                        className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors"
                      >
                        Letiltás
                      </button>
                      <button
                        onClick={handleSkipDisable}
                        className="flex-1 px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                      >
                        Kihagyás
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {/* Sikeres/hibaüzenet */}
          {successMessage && (
            <div className="mb-6 bg-green-50 border border-green-200 rounded-xl p-4 flex items-center space-x-3">
              <CheckCircleIcon className="h-6 w-6 text-green-600" />
              <p className="text-green-800">{successMessage}</p>
            </div>
          )}
          
          {errorMessage && (
            <div className="mb-6 bg-red-50 border border-red-200 rounded-xl p-4 flex items-center space-x-3">
              <XCircleIcon className="h-6 w-6 text-red-600" />
              <p className="text-red-800">{errorMessage}</p>
            </div>
          )}
          
          {/* Tabok */}
          <div className="mb-8 border-b border-gray-200 dark:border-gray-700">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab('foods')}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === 'foods'
                    ? 'border-purple-500 text-purple-600 dark:text-purple-400'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                }`}
              >
                <div className="flex items-center space-x-2">
                  <TrashIcon className="h-5 w-5" />
                  <span>Egyedi ételek kezelése</span>
                </div>
              </button>
              
              {isAdmin && (
                <button
                  onClick={() => setActiveTab('users')}
                  className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === 'users'
                      ? 'border-purple-500 text-purple-600 dark:text-purple-400'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    <UserGroupIcon className="h-5 w-5" />
                    <span>Felhasználók kezelése</span>
                  </div>
                </button>
              )}
            </nav>
          </div>
          
          {/* Ételek kezelése tab */}
          {activeTab === 'foods' && (
            <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
              <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                    Egyedi ételek ({foodsData?.total || 0})
                  </h2>
                  <div className="relative">
                    <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Keresés..."
                      value={foodSearch}
                      onChange={(e) => setFoodSearch(e.target.value)}
                      className="pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-gray-800 dark:text-gray-100"
                    />
                  </div>
                </div>
              </div>
              
              <div className="overflow-x-auto">
                {foodsLoading ? (
                  <div className="p-8 text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto"></div>
                  </div>
                ) : foodsData?.foods.length === 0 ? (
                  <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                    Nincs megjeleníthető egyedi étel
                  </div>
                ) : (
                  <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-800">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Étel neve
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Márka
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Kalória
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Létrehozta
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Műveletek
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                      {foodsData?.foods.map((food) => (
                        <tr key={food.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100">
                            {food.name}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                            {food.brand || '-'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                            {food.calories ? `${Number(food.calories)} kcal` : '-'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                            {food.createdByUser?.username || 'Ismeretlen'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            {deleteConfirmFood === food.id ? (
                              <div className="flex items-center justify-end space-x-2">
                                <span className="text-red-600 dark:text-red-400 text-xs">Biztos?</span>
                                <button
                                  onClick={() => handleDeleteFood(food.id)}
                                  disabled={deleteFoodMutation.isPending}
                                  className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50"
                                >
                                  Igen
                                </button>
                                <button
                                  onClick={() => setDeleteConfirmFood(null)}
                                  className="px-3 py-1 bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-200 rounded hover:bg-gray-400 dark:hover:bg-gray-500"
                                >
                                  Nem
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={() => setDeleteConfirmFood(food.id)}
                                className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                              >
                                <TrashIcon className="h-5 w-5" />
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          )}
          
          {/* Felhasználók kezelése tab (csak admin) */}
          {activeTab === 'users' && isAdmin && (
            <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
              <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                    Felhasználók ({usersData?.total || 0})
                  </h2>
                  <div className="relative">
                    <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Keresés..."
                      value={userSearch}
                      onChange={(e) => setUserSearch(e.target.value)}
                      className="pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-gray-800 dark:text-gray-100"
                    />
                  </div>
                </div>
              </div>
              
              {/* Figyelmeztetés */}
              <div className="px-6 py-4 bg-yellow-50 dark:bg-yellow-900/20 border-b border-yellow-100 dark:border-yellow-800">
                <div className="flex items-start space-x-3">
                  <ExclamationTriangleIcon className="h-5 w-5 text-yellow-600 dark:text-yellow-500 mt-0.5" />
                  <p className="text-sm text-yellow-700 dark:text-yellow-400">
                    A jogosultsági szintek módosítása komoly hatással van a felhasználók hozzáférésére. Légy óvatos!
                  </p>
                </div>
              </div>
              
              <div className="overflow-x-auto">
                {usersLoading ? (
                  <div className="p-8 text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto"></div>
                  </div>
                ) : usersData?.users.length === 0 ? (
                  <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                    Nincs megjeleníthető felhasználó
                  </div>
                ) : (
                  <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-800">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Felhasználónév
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Email
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Regisztráció
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Jogosultság
                        </th>
                        <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Egyedi étel
                        </th>
                        <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Státusz
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Műveletek
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                      {usersData?.users.map((user) => (
                        <tr 
                          key={user.id} 
                          className={`hover:bg-gray-50 dark:hover:bg-gray-800 ${
                            user.id === session?.user?.id ? 'bg-purple-50 dark:bg-purple-900/20' : ''
                          }`}
                        >
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100">
                            {user.username}
                            {user.id === session?.user?.id && (
                              <span className="ml-2 text-xs text-purple-600 dark:text-purple-400">(Te)</span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                            {user.email}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                            {user.createdAt 
                              ? new Date(user.createdAt).toLocaleDateString('hu-HU') 
                              : '-'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {editingUser === user.id ? (
                              <select
                                value={newPermissionLevel}
                                onChange={(e) => setNewPermissionLevel(Number(e.target.value))}
                                className="text-sm border border-gray-300 dark:border-gray-600 rounded px-2 py-1 dark:bg-gray-800 dark:text-gray-100"
                              >
                                <option value={0}>Felhasználó</option>
                                <option value={1}>Moderátor</option>
                                <option value={2}>Admin</option>
                              </select>
                            ) : (
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${permissionLevelColors[user.permissionLevel] || permissionLevelColors[0]}`}>
                                {permissionLevelNames[user.permissionLevel] || 'Felhasználó'}
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-center">
                            <button
                              onClick={() => handleToggleCustomFood(user.id, user.canCreateCustomFood)}
                              disabled={toggleCustomFoodMutation.isPending}
                              className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium transition-colors disabled:opacity-50 ${
                                user.canCreateCustomFood
                                  ? 'bg-green-100 text-green-800 hover:bg-green-200 dark:bg-green-800 dark:text-green-200 dark:hover:bg-green-700'
                                  : 'bg-red-100 text-red-800 hover:bg-red-200 dark:bg-red-800 dark:text-red-200 dark:hover:bg-red-700'
                              }`}
                              title={user.canCreateCustomFood ? 'Kattints a letiltáshoz' : 'Kattints az engedélyezéshez'}
                            >
                              {user.canCreateCustomFood ? (
                                <>
                                  <CheckCircleIcon className="h-4 w-4 mr-1" />
                                  Engedélyezve
                                </>
                              ) : (
                                <>
                                  <NoSymbolIcon className="h-4 w-4 mr-1" />
                                  Letiltva
                                </>
                              )}
                            </button>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-center">
                            {user.isActive ? (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-200">
                                <CheckCircleIcon className="h-4 w-4 mr-1" />
                                Aktív
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-200">
                                <XCircleIcon className="h-4 w-4 mr-1" />
                                Inaktív
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            {user.id === session?.user?.id ? (
                              <span className="text-gray-400 text-xs">Saját fiók</span>
                            ) : editingUser === user.id ? (
                              <div className="flex items-center justify-end space-x-2">
                                <button
                                  onClick={() => handleUpdatePermission(user.id)}
                                  disabled={updatePermissionMutation.isPending}
                                  className="px-3 py-1 bg-purple-600 text-white rounded hover:bg-purple-700 disabled:opacity-50"
                                >
                                  Mentés
                                </button>
                                <button
                                  onClick={() => setEditingUser(null)}
                                  className="px-3 py-1 bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-200 rounded hover:bg-gray-400 dark:hover:bg-gray-500"
                                >
                                  Mégse
                                </button>
                              </div>
                            ) : deactivateConfirmUser === user.id ? (
                              <div className="flex items-center justify-end space-x-2">
                                <span className="text-red-600 dark:text-red-400 text-xs">Biztosan deaktiválod?</span>
                                <button
                                  onClick={() => handleDeactivateUser(user.id)}
                                  disabled={deactivateUserMutation.isPending}
                                  className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50"
                                >
                                  Igen
                                </button>
                                <button
                                  onClick={() => setDeactivateConfirmUser(null)}
                                  className="px-3 py-1 bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-200 rounded hover:bg-gray-400 dark:hover:bg-gray-500"
                                >
                                  Nem
                                </button>
                              </div>
                            ) : (
                              <div className="flex items-center justify-end space-x-2">
                                <button
                                  onClick={() => startEditingUser(user.id, user.permissionLevel)}
                                  className="text-purple-600 hover:text-purple-800 dark:text-purple-400 dark:hover:text-purple-300"
                                >
                                  Szerkesztés
                                </button>
                                {user.isActive ? (
                                  <button
                                    onClick={() => setDeactivateConfirmUser(user.id)}
                                    className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                                    title="Fiók deaktiválása"
                                  >
                                    <TrashIcon className="h-5 w-5" />
                                  </button>
                                ) : (
                                  <button
                                    onClick={() => handleReactivateUser(user.id)}
                                    disabled={reactivateUserMutation.isPending}
                                    className="text-green-600 hover:text-green-800 dark:text-green-400 dark:hover:text-green-300 disabled:opacity-50"
                                    title="Fiók újraaktiválása"
                                  >
                                    <CheckCircleIcon className="h-5 w-5" />
                                  </button>
                                )}
                              </div>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
      <Footer />
    </>
  );
}
