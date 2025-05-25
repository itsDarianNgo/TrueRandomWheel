// src/App.jsx
import React from 'react';
// import WheelDisplay from './features/wheel/WheelDisplay'; // Old component
import WheelPage from './features/layout/WheelPage'; // New page orchestrator

function App() {
    return (
        <div className="min-h-screen w-full flex flex-col items-center justify-center p-0 bg-gradient-to-br from-slate-900 to-gray-800"> {/* Removed page padding, WheelPage handles its own */}
            <header className="text-center py-6 md:py-8 w-full px-4 shrink-0"> {/* Shrink-0 for header */}
                <h1 className="text-4xl sm:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-500 to-red-500 animate-pulse">
                    Wheel of Destiny - Refactored!
                </h1>
                <p className="text-slate-400 mt-2 text-sm sm:text-base">The ultimate spinning wheel, now more modular.</p>
            </header>

            <main className="w-full flex-grow flex flex-col justify-center items-center overflow-hidden"> {/* Flex-col for WheelPage to manage its height */}
                <WheelPage /> {/* Use the new WheelPage component */}
            </main>

            <footer className="py-4 text-center text-slate-500 text-xs sm:text-sm w-full px-4 shrink-0"> {/* Shrink-0, smaller padding */}
                <p>© {new Date().getFullYear()} CodeFarm Studios. Modularized Edition.</p>
            </footer>
        </div>
    );
}
export default App;