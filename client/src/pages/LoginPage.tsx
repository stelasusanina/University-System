import { useState, type FormEvent } from "react";
import { useNavigate, Link } from "react-router-dom";
import { authService } from "../services/authService";
import { useAuth } from "../context/AuthContext";
import blueLogo from "@shared/assets/blue_logo.png";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await authService.login({ email, password });
      login(response.token, response.user);
      navigate("/home");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <form onSubmit={handleSubmit} className="login-form">
        <img src={blueLogo} alt="УниПортал" className="login-logo" />
        <h1>УниПортал</h1>

        {error && <div className="error-message">{error}</div>}

        <div className="form-group">
          <label htmlFor="email">Имейл</label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="password">Парола</label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>

        <button type="submit" disabled={loading}>
          {loading ? "Влизане..." : "Вход"}
        </button>

        <p className="login-form-footer">
          Нямате акаунт? <Link to="/register">Регистрация</Link>
        </p>
      </form>
    </div>
  );
}
