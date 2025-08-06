import { NextRequest, NextResponse } from 'next/server'

// Demo users - replace with your actual authentication logic
const DEMO_USERS = [
  { email: 'admin@example.com', password: 'admin123' },
  { email: 'user@example.com', password: 'user123' },
  { email: 'test@example.com', password: 'test123' },
]

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()

    // Validate input
    if (!email || !password) {
      return NextResponse.json(
        { message: 'Email and password are required' },
        { status: 400 }
      )
    }

    // Check if user exists and password matches
    const user = DEMO_USERS.find(
      u => u.email === email && u.password === password
    )

    if (!user) {
      return NextResponse.json(
        { message: 'Invalid email or password' },
        { status: 401 }
      )
    }

    // Generate a simple token (in production, use proper JWT)
    const token = `demo_token_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

    return NextResponse.json({
      success: true,
      token,
      user: {
        email: user.email,
      }
    })

  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
} 