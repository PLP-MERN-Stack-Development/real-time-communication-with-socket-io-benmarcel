// import React from 'react'
import { LogOut } from 'lucide-react';
const SideBar = ({ user, logout }) => {
  return (
    <>
    <div className="p-4 border-b border-gray-200 bg-linear-to-r from-blue-500 to-purple-500">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-full bg-white text-blue-500 flex items-center justify-center font-bold">
                    {user?.username?.[0]?.toUpperCase()}
                  </div>
                  <div>
                    <h3 className="font-semibold text-white">{user?.username}</h3>
                    <p className="text-xs text-blue-100">Online</p>
                  </div>
                </div>
                <button
                  onClick={logout}
                  className="text-white hover:text-red-200 transition-colors"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </div>
            </div>
    </>
  )
}

export default SideBar