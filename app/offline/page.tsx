'use client';

export default function OfflinePage() {
    return (
        <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-100 flex items-center justify-center p-4">
            <div className="text-center">
                <div className="w-24 h-24 mx-auto mb-6 bg-emerald-100 rounded-full flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-12 h-12 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636a9 9 0 010 12.728m0 0l-2.829-2.829m2.829 2.829L21 21M15.536 8.464a5 5 0 010 7.072m0 0l-2.829-2.829m-4.243 2.829a4.978 4.978 0 01-1.414-2.83m-1.414 5.658a9 9 0 01-2.167-9.238m7.824 2.167a1 1 0 111.414 1.414m-1.414-1.414L3 3m8.293 8.293l1.414 1.414" />
                    </svg>
                </div>
                <h1 className="text-2xl font-bold text-gray-800 mb-2">Tidak Ada Koneksi</h1>
                <p className="text-gray-600 mb-6">Anda sedang offline. Silakan periksa koneksi internet Anda.</p>
                <button
                    onClick={() => window.location.reload()}
                    className="px-6 py-3 bg-emerald-600 text-white rounded-xl font-medium hover:bg-emerald-700 transition-colors"
                >
                    Coba Lagi
                </button>
            </div>
        </div>
    );
}
