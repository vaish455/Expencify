import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { getRoleName } from '../utils/role';

const ProtectedRoute = ({ children, role }) => {
  const { user } = useAuthStore();

  if (!user) {
    return <Navigate to="/login" />;
  }

  if (role) {
    const allowedRoles = Array.isArray(role) ? role : [role];
    const userRoleName = getRoleName(user.role);
    if (!allowedRoles.includes(userRoleName)) {
      return <Navigate to="/" />;
    }
  }

  return children;
};

export default ProtectedRoute;
