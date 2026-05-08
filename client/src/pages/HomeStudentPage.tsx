import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function HomeStudentPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="app-layout">
      <nav className="top-nav">
        <div className="top-nav-brand">University System</div>
        <div className="top-nav-links">
          <Link to="/home" className="nav-link">Home</Link>
          <Link to="/schedule" className="nav-link">Schedule</Link>
        </div>
        <div className="top-nav-user">
          <span>{user?.email}</span>
          <button type="button" onClick={handleLogout} className="nav-logout-button">
            Logout
          </button>
        </div>
      </nav>

      <main className="home-main">
        <h1>Welcome, {user?.email}</h1>
        <p>Use the menu above to navigate.</p>
      </main>
    </div>
  );
}
