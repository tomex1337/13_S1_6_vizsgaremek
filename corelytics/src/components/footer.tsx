"use client";

export default function Footer() {
    const currentYear = new Date().getFullYear();

    return (
        <footer className="bg-gray-900 text-white py-8 mt-auto">
            <div className="container mx-auto px-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {/* Company Info */}
                    <div>
                        <h3 className="text-lg font-semibold mb-4">Corelytics</h3>
                        <p className="text-gray-400">
                            Személyes fitness és táplálkozás követő társad. Maradj egészséges,
                            maradj motivált.
                        </p>
                    </div>

                    {/* Quick Links */}
                    <div>
                        <h3 className="text-lg font-semibold mb-4">Gyors linkek</h3>
                        <ul className="space-y-2">
                            <li>
                                <a href="#" className="text-gray-400 hover:text-white transition">
                                    Funkciók
                                </a>
                            </li>
                            <li>
                                <a href="#" className="text-gray-400 hover:text-white transition">
                                    Piac
                                </a>
                            </li>
                            <li>
                                <a href="#" className="text-gray-400 hover:text-white transition">
                                    Cég
                                </a>
                            </li>
                        </ul>
                    </div>

                    {/* Contact Info */}
                    <div>
                        <h3 className="text-lg font-semibold mb-4">Kapcsolat</h3>
                        <ul className="space-y-2 text-gray-400">
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