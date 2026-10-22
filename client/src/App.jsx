import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Unauthorized from './pages/Unauthorized';
import Books from './pages/Books';
import Borrowing from './pages/Borrowing';
import Reservations from './pages/Reservations';
import Wishlist from './pages/Wishlist';
import Notifications from './pages/Notifications';
import Reports from './pages/Reports';
import DashboardDispatcher from './pages/dashboards/DashboardDispatcher';
import AdminDashboard from './pages/dashboards/AdminDashboard';
import LibrarianDashboard from './pages/dashboards/LibrarianDashboard';
import StaffDashboard from './pages/dashboards/StaffDashboard';
import StudentDashboard from './pages/dashboards/StudentDashboard';
import './App.css';

function App() {
  return (
    <Router>
      <AuthProvider>
        <div className="min-h-screen flex flex-col bg-modern-canvas text-[#0F172A] selection:bg-[#D97706]/20 selection:text-[#B45309]">
          <Navbar />
          <main className="flex-1">
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/unauthorized" element={<Unauthorized />} />

              {/* Books Management & Catalog Route (Protected for all authenticated users) */}
              <Route
                path="/books"
                element={
                  <ProtectedRoute>
                    <Books />
                  </ProtectedRoute>
                }
              />

              {/* Borrowing & Circulation Management Route (Protected for all authenticated users) */}
              <Route
                path="/borrow"
                element={
                  <ProtectedRoute>
                    <Borrowing />
                  </ProtectedRoute>
                }
              />

              {/* Book Reservations Route (Protected for all authenticated users) */}
              <Route
                path="/reservations"
                element={
                  <ProtectedRoute>
                    <Reservations />
                  </ProtectedRoute>
                }
              />

              {/* Wishlist Routes */}
              <Route
                path="/student/wishlist"
                element={
                  <ProtectedRoute allowedRoles={['Student']}>
                    <Wishlist />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/wishlist"
                element={
                  <ProtectedRoute allowedRoles={['Student']}>
                    <Wishlist />
                  </ProtectedRoute>
                }
              />

              {/* Notifications Center Route (Protected for all authenticated users) */}
              <Route
                path="/notifications"
                element={
                  <ProtectedRoute>
                    <Notifications />
                  </ProtectedRoute>
                }
              />

              {/* Reports & Audit Logs Route (Protected for Admin and Librarian) */}
              <Route
                path="/reports"
                element={
                  <ProtectedRoute allowedRoles={['Admin', 'Librarian']}>
                    <Reports />
                  </ProtectedRoute>
                }
              />

              {/* General Protected Dashboard: routes based on user role */}
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute>
                    <DashboardDispatcher />
                  </ProtectedRoute>
                }
              />

              {/* Role-Protected Dedicated Routes */}
              <Route
                path="/admin"
                element={
                  <ProtectedRoute allowedRoles={['Admin']}>
                    <AdminDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/librarian"
                element={
                  <ProtectedRoute allowedRoles={['Librarian', 'Admin']}>
                    <LibrarianDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/staff"
                element={
                  <ProtectedRoute allowedRoles={['Staff', 'Admin']}>
                    <StaffDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/student"
                element={
                  <ProtectedRoute allowedRoles={['Student', 'Admin']}>
                    <StudentDashboard />
                  </ProtectedRoute>
                }
              />

              {/* Fallback */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>
        </div>
      </AuthProvider>
    </Router>
  );
}

export default App;
