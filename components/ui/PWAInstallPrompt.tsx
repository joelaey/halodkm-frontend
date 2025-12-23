'use client';

import { useState, useEffect } from 'react';
import { Download, X, Smartphone } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
    prompt: () => Promise<void>;
    userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export function PWAInstallPrompt() {
    const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
    const [showInstallBanner, setShowInstallBanner] = useState(false);
    const [isInstalled, setIsInstalled] = useState(false);
    const [isIOS, setIsIOS] = useState(false);
    const [showIOSGuide, setShowIOSGuide] = useState(false);

    useEffect(() => {
        // Check if already installed
        if (window.matchMedia('(display-mode: standalone)').matches) {
            setIsInstalled(true);
            return;
        }

        // Check if iOS
        const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
        setIsIOS(isIOSDevice);

        // Listen for install prompt event (Chrome, Edge, etc.)
        const handleBeforeInstallPrompt = (e: Event) => {
            e.preventDefault();
            setDeferredPrompt(e as BeforeInstallPromptEvent);
            setShowInstallBanner(true);
        };

        window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

        // Listen for successful install
        window.addEventListener('appinstalled', () => {
            setIsInstalled(true);
            setShowInstallBanner(false);
            setDeferredPrompt(null);
        });

        // Show iOS guide if on iOS and not installed
        if (isIOSDevice && !window.matchMedia('(display-mode: standalone)').matches) {
            // Show after a delay
            const timer = setTimeout(() => setShowInstallBanner(true), 3000);
            return () => clearTimeout(timer);
        }

        return () => {
            window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
        };
    }, []);

    const handleInstallClick = async () => {
        if (isIOS) {
            setShowIOSGuide(true);
            return;
        }

        if (!deferredPrompt) return;

        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;

        if (outcome === 'accepted') {
            setDeferredPrompt(null);
            setShowInstallBanner(false);
        }
    };

    const dismissBanner = () => {
        setShowInstallBanner(false);
        // Don't show again for this session
        sessionStorage.setItem('pwa-banner-dismissed', 'true');
    };

    // Don't show if installed or dismissed
    if (isInstalled) return null;
    if (sessionStorage.getItem('pwa-banner-dismissed') === 'true') return null;
    if (!showInstallBanner) return null;

    return (
        <>
            {/* Install Banner */}
            <div className="fixed bottom-4 left-4 right-4 z-50 animate-slide-up">
                <div className="bg-gradient-to-r from-emerald-500 to-teal-500 rounded-2xl shadow-2xl shadow-emerald-500/25 p-4 max-w-md mx-auto">
                    <div className="flex items-start gap-3">
                        <div className="p-2 bg-white/20 rounded-xl">
                            <Smartphone className="w-6 h-6 text-white" />
                        </div>
                        <div className="flex-1">
                            <h3 className="font-bold text-white">Install HaloDKM</h3>
                            <p className="text-white/80 text-sm mt-0.5">
                                {isIOS
                                    ? 'Tambahkan ke Home Screen untuk akses cepat'
                                    : 'Install aplikasi untuk pengalaman lebih baik'
                                }
                            </p>
                        </div>
                        <button
                            onClick={dismissBanner}
                            className="p-1.5 hover:bg-white/20 rounded-lg transition-colors"
                        >
                            <X className="w-5 h-5 text-white/70" />
                        </button>
                    </div>
                    <button
                        onClick={handleInstallClick}
                        className="w-full mt-3 py-2.5 bg-white text-emerald-600 font-bold rounded-xl hover:bg-emerald-50 transition-colors flex items-center justify-center gap-2"
                    >
                        <Download className="w-5 h-5" />
                        {isIOS ? 'Lihat Cara Install' : 'Install Sekarang'}
                    </button>
                </div>
            </div>

            {/* iOS Install Guide Modal */}
            {showIOSGuide && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100] p-4">
                    <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl">
                        <div className="text-center mb-4">
                            <div className="inline-flex p-3 bg-emerald-100 rounded-full mb-3">
                                <Smartphone className="w-8 h-8 text-emerald-600" />
                            </div>
                            <h3 className="font-bold text-xl text-gray-900">Install di iPhone/iPad</h3>
                        </div>

                        <div className="space-y-4 text-sm">
                            <div className="flex gap-3 items-start">
                                <div className="w-6 h-6 bg-emerald-500 text-white rounded-full flex items-center justify-center font-bold text-xs flex-shrink-0">1</div>
                                <p className="text-gray-600">Tap tombol <strong>Share</strong> (ikon kotak dengan panah ke atas) di Safari</p>
                            </div>
                            <div className="flex gap-3 items-start">
                                <div className="w-6 h-6 bg-emerald-500 text-white rounded-full flex items-center justify-center font-bold text-xs flex-shrink-0">2</div>
                                <p className="text-gray-600">Scroll dan tap <strong>"Add to Home Screen"</strong></p>
                            </div>
                            <div className="flex gap-3 items-start">
                                <div className="w-6 h-6 bg-emerald-500 text-white rounded-full flex items-center justify-center font-bold text-xs flex-shrink-0">3</div>
                                <p className="text-gray-600">Tap <strong>"Add"</strong> di pojok kanan atas</p>
                            </div>
                        </div>

                        <button
                            onClick={() => setShowIOSGuide(false)}
                            className="w-full mt-6 py-3 bg-emerald-500 text-white font-bold rounded-xl hover:bg-emerald-600 transition-colors"
                        >
                            Mengerti
                        </button>
                    </div>
                </div>
            )}
        </>
    );
}
