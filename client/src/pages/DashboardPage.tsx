import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

export default function DashboardPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <h1>Dashboard</h1>
        <div className="user-info">
          <span>{user?.email} ({user?.role})</span>
          <button onClick={handleLogout}>Logout</button>
        </div>
      </header>
      <main>
        <p>Welcome to the University System!</p>
      </main>
    </div>
  );
}
