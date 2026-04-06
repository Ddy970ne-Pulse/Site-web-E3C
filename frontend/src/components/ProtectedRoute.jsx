import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

export function ProtectedRoute({ children, role }) {
  const { user, loading } = useAuth();
  if (loading) return (
    <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-[#D4AF37] border-t-transparent rounded-full animate-spin" />
    </div>
  );
  if (!user) return <Navigate to="/connexion" replace />;
  if (role && user.role !== role) return <Navigate to={user.role === "admin" ? "/admin" : "/espace-client"} replace />;
  return children;
}
