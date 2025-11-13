import React from 'react'
import { Link } from 'react-router-dom';

const Home = () => {
  return (
    <>
      {/*  Clean Container: Soft background, center content */}
      <div 
        className="min-h-screen flex flex-col items-center justify-center 
                   bg-gray-50 text-gray-900 p-6 font-['Inter', sans-serif]"
      >
        
        {/* App Card/Panel: A defined, rounded container for the content */}
        <div className="max-w-md w-full p-8 bg-white rounded-3xl shadow-2xl shadow-indigo-200/50">
          
          {/* Main Header: Bold, simple, and punchy */}
          <h1 
            className="text-5xl font-extrabold mb-3 tracking-tight 
                       text-transparent bg-clip-text bg-linear-to-r from-indigo-500 to-purple-500"
          >
            Chima Chat.
          </h1>
          
          {/* Subtitle: Descriptive and inviting */}
          <p className="text-lg text-gray-500 mb-8 font-light">
            Tap in. Connect with your community, zero lag.
          </p>

          {/* Action Button Container  */}
          <div className="flex flex-col gap-4">

            {/* Login Button - Primary action, solid fill, poppy color */}
            <Link 
              to="/login" 
              className="w-full text-center py-3 px-6 rounded-xl 
                         font-semibold text-white text-lg transition-all duration-200 
                         bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-500/50"
            >
              Log In // Let's chat
            </Link>
            
            {/* Sign Up Button - Secondary action, outlined, uses accent color */}
            <Link 
              to="/register" 
              className="w-full text-center py-3 px-6 rounded-xl 
                         font-semibold text-indigo-600 text-lg transition-all duration-200 
                         border-2 border-indigo-200 hover:border-indigo-400 hover:bg-indigo-50"
            >
              Sign Up // New vibe
            </Link>

          </div>
          
          {/* Footer Tag - A subtle footnote */}
          <p className="mt-8 text-center text-sm text-gray-400">
            Powered by next-gen connections. (fr)
          </p>

        </div>
      </div>
    </>
  )
}

export default Home