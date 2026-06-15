import { useNavigate } from "react-router-dom";

export default function NotFoundPage() {
  const navigate = useNavigate();

  return (
    <div className="not-found-container">
      <div className="not-found-content">
        <h1 className="not-found-code">404</h1>
        <h2 className="not-found-title">Страницата не е намерена</h2>
        <p className="not-found-text">Страницата, която търсите, не съществува или е преместена.</p>
        <button onClick={() => navigate(-1)} className="not-found-btn">
          Назад
        </button>
      </div>
    </div>
  );
}
