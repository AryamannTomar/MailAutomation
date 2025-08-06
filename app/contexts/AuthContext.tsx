"use client"

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { useRouter } from 'next/navigation'

interface User {
  email: string
  token: string
}

interface AuthContextType {
  user: User | null
  login: (email: string, password: string) => Promise<boolean>
  logout: () => void
  isLoading: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    // Check if user is already logged in on app load
    const token = localStorage.getItem('authToken')
    const email = localStorage.getItem('userEmail')
    
    if (token && email) {
      setUser({ email, token })
    }
    
    setIsLoading(false)
  }, [])

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      console.log('Attempting login with:', { email, password })
      
      const response = await fetch('https://gep1.app.n8n.cloud/webhook/MA-login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      })

      console.log('Response status:', response.status)
      console.log('Response ok:', response.ok)

      if (response.ok) {
        let data
        try {
          const responseText = await response.text()
          console.log('Raw response text:', responseText)
          
          if (!responseText.trim()) {
            console.error('Empty response received')
            return false
          }
          
          data = JSON.parse(responseText)
          console.log('Login response data:', data)
        } catch (parseError) {
          console.error('Failed to parse JSON response:', parseError)
          return false
        }
        
        // Handle different possible response formats
        const token = data.token || data.accessToken || data.access_token || data.jwt || data.jwtToken
        
        if (!token) {
          console.error('No token found in response:', data)
          return false
        }
        
        const userData = { email, token }
        
        // Store in localStorage
        localStorage.setItem('authToken', token)
        localStorage.setItem('userEmail', email)
        
        console.log('Setting user data:', userData)
        setUser(userData)
        return true
      } else {
        let errorData
        try {
          const errorText = await response.text()
          errorData = errorText.trim() ? JSON.parse(errorText) : { message: 'Unknown error' }
        } catch (parseError) {
          errorData = { message: 'Failed to parse error response' }
        }
        console.error('Login failed:', errorData)
        return false
      }
    } catch (error) {
      console.error('Login error:', error)
      return false
    }
  }

  const logout = async () => {
    try {
      const token = localStorage.getItem('authToken')
      
      if (token) {
        // Call logout API with token
        await fetch('https://gep1.app.n8n.cloud/webhook/MA-logout', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
        })
      }
    } catch (error) {
      console.error('Logout error:', error)
    } finally {
      // Clear localStorage
      localStorage.removeItem('authToken')
      localStorage.removeItem('userEmail')
      
      // Clear user state
      setUser(null)
      
      // Redirect to login
      router.push('/login')
    }
  }

  return (
    <AuthContext.Provider value={{ user, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
} 