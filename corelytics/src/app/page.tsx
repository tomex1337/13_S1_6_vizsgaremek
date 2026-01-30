"use client";
import Header from "@/components/header";
import Footer from "@/components/footer";
import Image from "next/image";
import { useSession, signOut } from "next-auth/react";
import { SpeedInsights } from "@vercel/speed-insights/next";
import {
  FireIcon,
  CalendarDaysIcon,
  ScaleIcon
} from '@heroicons/react/24/solid';

export default function Home() {
  const { data: session } = useSession();
    <SpeedInsights/>

  return (
    <>
      <SpeedInsights/>
      <Header />
      <div className="font-sans grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20">
      <main className="flex flex-col gap-[32px] row-start-2 items-center sm:items-start">
          <div className="flex flex-col sm:flex-row gap-12 items-center sm:items-center">
            <div className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-semibold sm:w-2/3 text-center sm:text-left">
              Gondold újra<br/>az edzésterved
            </div>
            <div className="flex justify-center w-full sm:w-1/3 sm:shrink-0 bg-white dark:bg-gray-900 rounded-xl shadow-lg p-4">
              <Image
                src="/logo.svg"
                alt="Corelytics Logo"
                width={250}
                height={250}
              >
              </Image>
            </div>
          </div>
        </main>
    </div>
    <div className="font-sans grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20 dark:bg-gray-800 bg-gray-100" id="meals">
      <main className="flex flex-col gap-[32px] row-start-2 items-center sm:items-start">
        <div className="flex flex-col sm:flex-row gap-12 items-center sm:items-center">
          <div className="flex justify-center w-full sm:w-1/3 sm:shrink-0 bg-white dark:bg-gray-900 rounded-xl shadow-lg p-4">
            <FireIcon className="w-full h-full text-red-600 dark:text-red-300"></FireIcon>
          </div>
          <div className="flex flex-col gap-6 sm:w-2/3">
            <div className="text-1xl sm:text-2xl lg:text-3xl font-semibold text-center sm:text-left">
              Étrend- és edzéstervező alkalmazás
            </div>
            <div className="bg-white dark:bg-gray-900 rounded-xl shadow-lg p-6 text-center sm:text-left text-gray-800 dark:text-white">
              <p className="text-lg">
                A Corelytics-al kiválóan tudod az étrended követni.
              </p>
            </div>
          </div>
        </div>
        
      </main>
    </div>
    <div className="font-sans grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20" id="workouts">
      <main className="flex flex-col gap-[32px] row-start-2 items-center sm:items-start">
        <div className="flex flex-col sm:flex-row gap-12 items-center sm:items-center">
          <div className="flex flex-col gap-6 sm:w-2/3">
            <div className="text-1xl sm:text-2xl lg:text-3xl font-semibold text-center sm:text-left">
              Edzésterv nyilvántartása
            </div>
            <div className="bg-white dark:bg-gray-900 rounded-xl shadow-lg p-6 text-center sm:text-left text-gray-800 dark:text-white">
              <p className="text-lg">
                Szervezd meg az edzéseidet és kövesd a fejlődésed napról napra.
              </p>
            </div>
          </div>
          <div className="flex justify-center w-full sm:w-1/3 sm:shrink-0 bg-white dark:bg-gray-900 rounded-xl shadow-lg p-4">
            <CalendarDaysIcon className="w-full h-full text-blue-600 dark:text-blue-300"></CalendarDaysIcon>
          </div>
        </div>
      </main>
    </div>
    <div className="font-sans grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20 dark:bg-gray-800 bg-gray-100" id="conclusion">
      <main className="flex flex-col gap-[32px] row-start-2 items-center sm:items-start">
        <div className="flex flex-col sm:flex-row gap-12 items-center sm:items-center">
          <div className="flex justify-center w-full sm:w-1/3 sm:shrink-0 bg-white dark:bg-gray-900 rounded-xl shadow-lg p-4">
            <ScaleIcon className="w-full h-full text-green-600 dark:text-green-300"></ScaleIcon>
          </div>
          <div className="flex flex-col gap-6 sm:w-2/3">
            <div className="text-1xl sm:text-2xl lg:text-3xl font-semibold text-center sm:text-left">
              Súly- és testösszetétel nyomon követés
            </div>
            <div className="bg-white dark:bg-gray-900 rounded-xl shadow-lg p-6 text-center sm:text-left text-gray-800 dark:text-white">
              <p className="text-lg">
                Mérd meg a fejlődésed és figyeld az egészséges súlycsökkentést vagy -emelést.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div> 
    <Footer />    
  </>
  );
}
