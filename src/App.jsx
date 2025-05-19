// src/App.jsx
import React from 'react';
import WheelDisplay from './features/wheel/WheelDisplay';

function App() {
    return (
        // This div should now correctly fill the body due to global.css changes
        <div className="min-h-screen w-full flex flex-col items-center justify-center p-4 bg-gradient-to-br from-slate-900 to-gray-800">
        <header className="text-center py-6 md:py-10 w-full px-4"> {/* Added padding and full width */}
                <h1 className="text-4xl sm:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-500 to-red-500 animate-pulse">
                    Wheel of Names - Enhanced!
                </h1>
                <p className="text-slate-400 mt-2 text-sm sm:text-base">The ultimate spinning wheel for streamers.</p>
            </header>

            {/* Main content area takes remaining space and allows children to control their width */}
            <main className="w-full flex-grow flex justify-center px-2 sm:px-4 md:px-6">
                {/* WheelDisplay will now control its own max-width or responsiveness */}
                <WheelDisplay />
            </main>

            <footer className="py-6 text-center text-slate-500 text-sm w-full px-4">
                <p>© {new Date().getFullYear()} Your Stream Team. Powered by CodeFarm.</p>
            </footer>
        </div>
    );
}

export default App;