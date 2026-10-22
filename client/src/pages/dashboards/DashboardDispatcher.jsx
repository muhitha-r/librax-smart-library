import { useAuth } from '../../context/AuthContext';
import AdminDashboard from './AdminDashboard';
import LibrarianDashboard from './LibrarianDashboard';
import StaffDashboard from './StaffDashboard';
import StudentDashboard from './StudentDashboard';

export default function DashboardDispatcher() {
  const { user } = useAuth();

  switch (user?.role) {
    case 'Admin':
      return <AdminDashboard />;
    case 'Librarian':
      return <LibrarianDashboard />;
    case 'Staff':
      return <StaffDashboard />;
    case 'Student':
    default:
      return <StudentDashboard />;
  }
}
