import React from 'react';

export const SunBackground: React.FC = () => {
    return (
        <div className="fixed inset-0 -z-10 overflow-hidden bg-gradient-to-b from-orange-400 via-red-500 to-purple-900">
            {/* Sun */}
            <div className="absolute top-10 left-1/2 -translate-x-1/2 w-64 h-64 bg-yellow-300 rounded-full blur-3xl opacity-60 animate-pulse-sun"></div>
            <div className="absolute top-20 left-1/2 -translate-x-1/2 w-48 h-48 bg-yellow-100 rounded-full blur-2xl opacity-80"></div>

            {/* Water Reflection / Horizon */}
            <div className="absolute bottom-0 w-full h-1/2 bg-gradient-to-t from-blue-900/80 to-transparent"></div>

            {/* Overlay texture or particles could go here */}
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-20"></div>
            
            {/* Dark overlay for better text readability */}
            <div className="absolute inset-0 bg-black/40"></div>
        </div>
    );
};
