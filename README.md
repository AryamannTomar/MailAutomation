# Mail Automation App with Authentication

This is a Next.js application with a complete authentication system that protects the mail automation form.

## Features

- 🔐 **Authentication System**: Login/logout functionality with protected routes
- 📧 **Mail Automation Form**: Multi-table data submission with email mapping
- 🎨 **Modern UI**: Beautiful interface with Tailwind CSS and shadcn/ui components
- 🔒 **Route Protection**: Automatic redirects for unauthenticated users
- 👤 **User Management**: Display current user and logout functionality

## Demo Credentials

You can use any of these demo accounts to test the application:

| Email | Password |
|-------|----------|
| admin@example.com | admin123 |
| user@example.com | user123 |
| test@example.com | test123 |

## Getting Started

1. **Install dependencies**:
   ```bash
   npm install
   # or
   pnpm install
   ```

2. **Run the development server**:
   ```bash
   npm run dev
   # or
   pnpm dev
   ```

3. **Open your browser** and navigate to `http://localhost:3000`

4. **Login** using one of the demo credentials above

## Authentication Flow

1. **Initial Access**: When you first visit the app, you'll be redirected to `/login`
2. **Login**: Enter your email and password using the demo credentials
3. **Success**: Upon successful login, you'll be redirected to the main form
4. **Protected Access**: The main form is now protected and only accessible to authenticated users
5. **Logout**: Use the logout button in the header to sign out

## File Structure

```
app/
├── api/
│   └── auth/
│       ├── login/route.ts      # Login API endpoint
│       └── logout/route.ts     # Logout API endpoint
├── components/
│   ├── Header.tsx             # Header with user info and logout
│   └── ProtectedRoute.tsx     # Route protection component
├── contexts/
│   └── AuthContext.tsx        # Authentication context
├── login/
│   └── page.tsx               # Login page
├── layout.tsx                 # Root layout with AuthProvider
└── page.tsx                   # Main page with protection
```

## Customization

### Adding Real Authentication

To replace the demo authentication with a real system:

1. **Update the login API** (`app/api/auth/login/route.ts`):
   - Replace `DEMO_USERS` with your database connection
   - Implement proper password hashing (bcrypt)
   - Use JWT tokens instead of simple tokens

2. **Update AuthContext** (`app/contexts/AuthContext.tsx`):
   - Modify the login function to use your real API
   - Add token refresh logic if needed
   - Implement proper error handling

3. **Add Environment Variables**:
   ```env
   DATABASE_URL=your_database_url
   JWT_SECRET=your_jwt_secret
   ```

### Styling

The app uses Tailwind CSS with a blue color scheme. You can customize the colors by modifying the CSS classes in the components.

## Security Notes

- The current implementation uses localStorage for token storage
- In production, consider using httpOnly cookies for better security
- Implement proper CSRF protection
- Add rate limiting to the login API
- Use HTTPS in production

## API Endpoints

- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout

## Technologies Used

- **Next.js 14** - React framework
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **shadcn/ui** - UI components
- **Lucide React** - Icons 