import Component from "../excel-form"
import ProtectedRoute from "./components/ProtectedRoute"
import Header from "./components/Header"

export default function Page() {
  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-blue-50">
        <Header />
        <Component />
      </div>
    </ProtectedRoute>
  )
}
