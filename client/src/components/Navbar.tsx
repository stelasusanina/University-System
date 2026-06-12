import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import whiteLogo from "@shared/assets/white_logo.png";

const STAFF_ROLES = ["ПРОФЕСОР", "ДОЦЕНТ", "ГЛАВЕН_АСИСТЕНТ", "АСИСТЕНТ"];

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const isStaff = STAFF_ROLES.includes(user?.role ?? "");

  function handleLogout() {
    logout();
    navigate("/login");
  }

  function linkClass(path: string) {
    return location.pathname === path ? "nav-link nav-link-active" : "nav-link";
  }

  return (
    <nav className="top-nav">
      <div className="top-nav-brand">
        <img src={whiteLogo} alt="" className="nav-logo" />
        УниПортал
      </div>
      <div className="top-nav-links">
        <Link to="/home" className={linkClass("/home")}>Начало</Link>
        <Link to="/schedule" className={linkClass("/schedule")}>Разписание</Link>
        {isStaff && <Link to="/announcements" className={linkClass("/announcements")}>Съобщения</Link>}
        <Link to="/materials" className={linkClass("/materials")}>Материали</Link>
        <Link to="/grades" className={linkClass("/grades")}>Оценки</Link>
      </div>
      <div className="top-nav-user">
        <span>{user?.email}</span>
        <button type="button" onClick={handleLogout} className="nav-logout-button">Изход</button>
      </div>
    </nav>
  );
}
