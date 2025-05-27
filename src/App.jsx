// src/App.jsx
import React from 'react';
import WheelPage from './features/layout/WheelPage'; // Uses the page orchestrator

function App() {
    return (
        // This div provides the base gradient background for the entire application.
        // WheelPage's root div will be transparent by default, allowing this to show.
        <div className="min-h-screen w-full flex flex-col items-stretch justify-start bg-gradient-to-br from-slate-900 to-gray-800 text-slate-100">
            <header className="text-center py-6 md:py-8 w-full px-4 shrink-0 shadow-lg bg-slate-900/30 backdrop-blur-sm">
                <h1 className="text-4xl sm:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-500 to-red-500 animate-pulse">
                    Wheel of Destiny - Enhanced!
                </h1>
                <p className="text-slate-400 mt-2 text-sm sm:text-base">The ultimate customizable spinning wheel.</p>
            </header>

            {/* Main content area takes remaining space. WheelPage will manage its internal layout. */}
            <main className="w-full flex-grow flex flex-col">
                <WheelPage />
            </main>

            <footer className="py-4 text-center text-slate-500 text-xs sm:text-sm w-full px-4 shrink-0 bg-slate-900/30 backdrop-blur-sm">
                <p>© {new Date().getFullYear()} CodeFarm Masters. All Rights Reserved.</p>
            </footer>
        </div>
    );
}
export default App;