import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { formatUzDate } from "../../../utils/date";

export default function StudentSettings({ profile }) {
  const navigate = useNavigate();
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem("crm_access_token");
    navigate("/", { replace: true });
  };

  if (!profile) {
    return (
      <section className="student-page">
        <h1>Sozlamalar</h1>
      </section>
    );
  }

  return (
    <section className="student-page">
      <h1>Sozlamalar</h1>
      <div className="student-card">
        <div className="student-card-title">Shaxsiy ma'lumotlar</div>
        <div className="student-info-grid">
          {profile.fullName ? (
            <div className="student-info-item">
              <div className="student-info-label">To'liq ism</div>
              <div className="student-info-value">{profile.fullName}</div>
            </div>
          ) : null}
          {profile.email ? (
            <div className="student-info-item">
              <div className="student-info-label">Email</div>
              <div className="student-info-value">{profile.email}</div>
            </div>
          ) : null}
          {profile.birth_date ? (
            <div className="student-info-item">
              <div className="student-info-label">Tug'ilgan sana</div>
              <div className="student-info-value">
                {formatUzDate(profile.birth_date)}
              </div>
            </div>
          ) : null}
          {profile.status ? (
            <div className="student-info-item">
              <div className="student-info-label">Status</div>
              <div className="student-info-value">{profile.status}</div>
            </div>
          ) : null}
        </div>
      </div>

      <div className="student-card student-logout-card">
        <div className="student-card-title">Xavfsizlik</div>
        <button
          type="button"
          className="student-logout-btn"
          onClick={() => setShowLogoutModal(true)}
        >
          Chiqish
        </button>
      </div>

      {showLogoutModal ? (
        <div className="student-modal-overlay">
          <div className="student-modal">
            <button
              type="button"
              className="student-modal-close"
              onClick={() => setShowLogoutModal(false)}
              aria-label="Yopish"
            >
              ×
            </button>
            <div className="student-modal-title">
              Platformadan chiqishni xohlaysizmi?
            </div>
            <div className="student-modal-actions">
              <button
                type="button"
                className="student-modal-btn ghost"
                onClick={() => setShowLogoutModal(false)}
              >
                Yo'q
              </button>
              <button
                type="button"
                className="student-modal-btn primary"
                onClick={handleLogout}
              >
                Ha
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
