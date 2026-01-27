'use client'

import { useRouter } from "next/navigation";
import { useEffect } from "react";

// Átirányítás a fő edzés oldalra
export default function WorkoutLogRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/workout");
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-purple-600"></div>
    </div>
  );
}
