'use client'

import { useRouter } from "next/navigation";
import { useEffect } from "react";

// Redirect to the main workout page
export default function WorkoutLogRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/workout");
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-800">
      <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-purple-600 dark:border-purple-400"></div>
    </div>
  );
}
