export default function StudentSettings({
  profileName,
  profileEmail,
  profile,
  primaryGroupName,
  firstName,
  lastName,
  identityMode = "split",
  fullNameLabel = "Full name",
  contactLabel = "Telefon raqam",
  contactValue,
  darkMode = false,
  onOpenPassword,
  formatDate,
  getInitials,
  roleLabel = "Student",
}) {
  const resolvedContactValue =
    contactValue || profile?.phone || profileEmail || "-";

  const settingsVars = darkMode
    ? {
        "--bg": "#0f172a",
        "--card-bg": "#111827",
        "--text": "#f8fafc",
        "--text-muted": "#94a3b8",
        "--border": "#334155",
        "--accent": "#a78bfa",
        "--accent2": "#8b5cf6",
      }
    : {
        "--bg": "#f4f6f9",
        "--card-bg": "#ffffff",
        "--text": "#1a1d23",
        "--text-muted": "#7a8494",
        "--border": "#e8ecf2",
        "--accent": "#e07b2b",
        "--accent2": "#f5a623",
      };

  return (
    <div className="page active" id="page-settings" style={settingsVars}>
      <div className="settings-grid">
        <div className="card profile-card">
          <div className="profile-avatar">{getInitials(profileName)}</div>
          <div className="profile-name">{profileName}</div>
          <div className="profile-role">{roleLabel}</div>
          <div className="profile-info">
            <div className="info-row">
              <span className="info-label">Guruh</span>
              <span className="info-val">{primaryGroupName}</span>
            </div>
          </div>
        </div>
        <div className="card">
          <div className="section-title">Shaxsiy ma'lumotlar</div>
          <div className="section-sub">Ma'lumotlaringizni yangilang</div>
          <div className="settings-profile">
            <div className="profile-photo">
              <div className="photo-preview">{getInitials(profileName)}</div>
              <div className="photo-hint">500x500 o'lcham, JPG yoki PNG</div>
            </div>
            <div className="profile-fields">
              {identityMode === "full" ? (
                <div className="info-pair">
                  <span className="info-label">{fullNameLabel}</span>
                  <span className="info-val">{profileName || "-"}</span>
                </div>
              ) : (
                <>
                  <div className="info-pair">
                    <span className="info-label">Ism</span>
                    <span className="info-val">{firstName || "-"}</span>
                  </div>
                  <div className="info-pair">
                    <span className="info-label">Familiya</span>
                    <span className="info-val">{lastName || "-"}</span>
                  </div>
                </>
              )}
              <div className="info-pair">
                <span className="info-label">{contactLabel}</span>
                <span className="info-val">{resolvedContactValue}</span>
              </div>
              {profile?.birth_date && (
                <div className="info-pair">
                  <span className="info-label">Tug'ilgan sana</span>
                  <span className="info-val">
                    {formatDate(profile.birth_date)}
                  </span>
                </div>
              )}
              <div className="info-pair">
                <span className="info-label">HH ID</span>
                <span className="info-val">{profile?.id || "-"}</span>
              </div>
            </div>
          </div>
          <div className="settings-cards">
            <div className="settings-mini">
              <div>
                <div className="mini-title">Kirish</div>
                <div className="mini-value">{profile?.id || "-"}</div>
              </div>
            </div>
            <button
              type="button"
              className="settings-mini actionable"
              onClick={onOpenPassword}
            >
              <div>
                <div className="mini-title">Parol</div>
                <div className="mini-value">••••••••</div>
              </div>
              <span className="mini-edit">✎</span>
            </button>
            <div className="settings-mini">
              <div>
                <div className="mini-title">Bildirishnoma sozlamalari</div>
                <div className="mini-value">-</div>
              </div>
              <span className="mini-edit">✎</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
