// src/App.jsx
import React from 'react';
import WheelDisplay from './features/wheel/WheelDisplay'; // Make sure this import is correct

function App() {
    return (
        <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-gradient-to-br from-slate-900 to-gray-800">
            <header className="text-center mb-10">
                <h1 className="text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-500 to-red-500 animate-pulse">
                    Wheel of Names - Enhanced!
                </h1>
                <p className="text-slate-400 mt-2">The ultimate spinning wheel for streamers.</p>
            </header>

            <main className="w-full max-w-5xl flex justify-center"> {/* Adjusted max-width and added flex justify-center */}
                <WheelDisplay />
            </main>

            <footer className="mt-12 text-center text-slate-500 text-sm">
                <p>© {new Date().getFullYear()} Your Stream Team. Powered by CodeFarm.</p>
            </footer>
        </div>
    );
}

export default App;