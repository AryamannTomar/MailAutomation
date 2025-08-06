"use client"

import { useState } from "react"
import { useAuth } from "../contexts/AuthContext"
import { Button } from "@/components/ui/button"
import { LogOut, User, Settings } from "lucide-react"
import ChangePasswordDialog from "./ChangePasswordDialog"

export default function Header() {
  const { user, logout } = useAuth()
  const [showChangePassword, setShowChangePassword] = useState(false)

  return (
    <>
      <header className="bg-white shadow-sm border-b border-blue-200">
        <div className="container mx-auto max-w-6xl px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-semibold text-sm">MA</span>
              </div>
              <h1 className="text-xl font-semibold text-gray-900">
                Mail Automation
              </h1>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <User className="w-4 h-4" />
                <span>{user?.email}</span>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowChangePassword(true)}
                className="border-blue-300 text-blue-600 hover:bg-blue-50"
              >
                <Settings className="w-4 h-4 mr-2" />
                Settings
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={logout}
                className="border-red-300 text-red-600 hover:bg-red-50"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>
      
      <ChangePasswordDialog 
        isOpen={showChangePassword} 
        onClose={() => setShowChangePassword(false)} 
      />
    </>
  )
} 