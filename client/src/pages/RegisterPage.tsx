import { useState, type FormEvent } from "react";
import { useNavigate, Link } from "react-router-dom";
import { authService } from "../services/authService";
import { useAuth } from "../context/AuthContext";
import blueLogo from "@shared/assets/blue_logo.png";

export default function RegisterPage() {
  const [email, setEmail] = useState("");
  const [identifierNumber, setIdentifierNumber] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("Паролите не съвпадат");
      return;
    }

    setLoading(true);

    try {
      const response = await authService.register({
        email,
        identifierNumber,
        firstName,
        lastName,
        password,
      });
      login(response.token, response.user);
      navigate("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Registration failed");
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
          <label htmlFor="identifierNumber">Факултетен / Служебен номер</label>
          <input
            id="identifierNumber"
            type="text"
            value={identifierNumber}
            onChange={(e) => setIdentifierNumber(e.target.value)}
            required
          />
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="firstName">Име</label>
            <input
              id="firstName"
              type="text"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="lastName">Фамилия</label>
            <input
              id="lastName"
              type="text"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              required
            />
          </div>
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

        <div className="form-group">
          <label htmlFor="confirmPassword">Потвърди парола</label>
          <input
            id="confirmPassword"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
          />
        </div>

        <button type="submit" disabled={loading}>
          {loading ? "Регистриране..." : "Регистрация"}
        </button>

        <p className="login-form-footer">
          Вече имате акаунт? <Link to="/login">Вход</Link>
        </p>
      </form>
    </div>
  );
}
