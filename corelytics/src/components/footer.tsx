"use client";
import Link from 'next/link';
import { useSession, signOut } from "next-auth/react";

export default function Footer() {
    const currentYear = new Date().getFullYear();
    const { data: session } = useSession();

    return (
        <footer className="dark:bg-gray-900 bg-gray-300 text-white py-8 mt-auto">
            <div className="container mx-auto px-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {/* Company Info */}
                    <div>
                        <h3 className="text-lg font-semibold mb-4 text-gray-800 dark:text-gray-200">Corelytics</h3>
                        <p className="text-gray-400 dark:text-gray-200">
                            Személyes fitness és táplálkozás követő társad. Maradj egészséges,
                            maradj motivált.
                        </p>
                    </div>

                    {/* Quick Links */}
                    <div>
                        <h3 className="text-lg font-semibold mb-4 text-gray-800 dark:text-gray-200">Gyors linkek</h3>
                        <ul className="space-y-2">
                            <li>
                                <Link href="/#meals" className="text-gray-600 dark:text-gray-400 hover:text-white transition">
                                    Ételek
                                </Link>
                            </li>
                            <li>
                                <Link href="/#workouts" className="text-gray-600 dark:text-gray-400 hover:text-white transition">
                                    Edzések
                                </Link>
                            </li>
                            <li>
                                <Link href="/#conclusion" className="text-gray-600 dark:text-gray-400 hover:text-white transition">
                                    Konklúzió
                                </Link>
                            </li>
                            <li>
                                {session?.user ? (
                                    <button onClick={() => signOut({ callbackUrl: '/' })} className="text-gray-600 dark:text-gray-400 hover:text-white transition">
                                        Kijelentkezés
                                    </button>
                                ) : (
                                    <Link href="/auth/signin" className="text-gray-600 dark:text-gray-400 hover:text-white transition">
                                        Bejelentkezés
                                    </Link>
                                )}
                            </li>
                        </ul>
                    </div>

                    {/* Contact Info */}
                    <div>
                        <h3 className="text-lg font-semibold mb-4 text-gray-800 dark:text-gray-200">Kapcsolat</h3>
                        <ul className="space-y-2 text-gray-600 dark:text-gray-400">
                            <li>Email: support@corelytics.com</li>
                            <li>Kövess minket a közösségi médiában</li>
                        </ul>
                    </div>
                </div>

                {/* Copyright */}
                <div className="border-t border-gray-800 mt-8 pt-6 text-center text-gray-400">
                    <p>&copy; {currentYear} Corelytics. Minden jog fenntartva.</p>
                </div>
            </div>
        </footer>
    );
}