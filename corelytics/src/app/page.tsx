"use client";
import Header from "@/components/header";
import Footer from "@/components/footer";
import Image from "next/image";
import { useSession, signOut } from "next-auth/react";
import { SpeedInsights } from "@vercel/speed-insights/next"

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
            <div className="text-3x1 md:text-2x1 sm:text-6xl font-semibold sm:w-2/3 text-center sm:text-left">
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
    <Footer />    
  </>
  );
}
