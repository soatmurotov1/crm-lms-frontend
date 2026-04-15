export default function PasswordModal({
  form,
  errors,
  showPassword,
  onClose,
  onChange,
  onToggle,
  onSubmit,
  saving,
}) {
  const EyeIcon = () => (
    <svg
      className="eye-icon"
      viewBox="0 0 24 24"
      aria-hidden="true"
      focusable="false"
    >
      <path d="M12 5C6.5 5 2.1 8.5 1 12c1.1 3.5 5.5 7 11 7s9.9-3.5 11-7c-1.1-3.5-5.5-7-11-7Zm0 11a4 4 0 1 1 0-8 4 4 0 0 1 0 8Z" />
      <circle cx="12" cy="12" r="2.2" />
    </svg>
  );

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true">
      <div className="modal-card modal-card--narrow">
        <div className="modal-header">
          <div>
            <div className="modal-title">Parolni o'zgartirish</div>
            <div className="modal-subtitle">
              Quyidagi ma'lumotlarni to'ldiring
            </div>
          </div>
          <button
            type="button"
            className="modal-close"
            onClick={onClose}
            aria-label="Modalni yopish"
          >
            &times;
          </button>
        </div>

        <div className="modal-form">
          <label className="modal-label" htmlFor="password-current">
            Amaldagi parol
          </label>
          <div className={`modal-input ${errors.current ? "error" : ""}`}>
            <input
              id="password-current"
              type={showPassword.current ? "text" : "password"}
              value={form.current}
              onChange={(event) => onChange("current", event.target.value)}
            />
            <button
              type="button"
              className="eye-btn"
              onClick={() => onToggle("current")}
              aria-label={
                showPassword.current
                  ? "Parolni yashirish"
                  : "Parolni ko'rsatish"
              }
            >
              <EyeIcon />
            </button>
          </div>
          {errors.current && (
            <div className="modal-error">{errors.current}</div>
          )}

          <label className="modal-label" htmlFor="password-next">
            Yangi parol
          </label>
          <div className={`modal-input ${errors.next ? "error" : ""}`}>
            <input
              id="password-next"
              type={showPassword.next ? "text" : "password"}
              value={form.next}
              onChange={(event) => onChange("next", event.target.value)}
            />
            <button
              type="button"
              className="eye-btn"
              onClick={() => onToggle("next")}
              aria-label={
                showPassword.next ? "Parolni yashirish" : "Parolni ko'rsatish"
              }
            >
              <EyeIcon />
            </button>
          </div>
          {errors.next && <div className="modal-error">{errors.next}</div>}

          <label className="modal-label" htmlFor="password-confirm">
            Parolni tasdiqlash
          </label>
          <div className={`modal-input ${errors.confirm ? "error" : ""}`}>
            <input
              id="password-confirm"
              type={showPassword.confirm ? "text" : "password"}
              value={form.confirm}
              onChange={(event) => onChange("confirm", event.target.value)}
            />
            <button
              type="button"
              className="eye-btn"
              onClick={() => onToggle("confirm")}
              aria-label={
                showPassword.confirm
                  ? "Parolni yashirish"
                  : "Parolni ko'rsatish"
              }
            >
              <EyeIcon />
            </button>
          </div>
          {errors.confirm && (
            <div className="modal-error">{errors.confirm}</div>
          )}
        </div>

        <div className="modal-actions">
          <button
            type="button"
            className="modal-btn primary"
            onClick={onSubmit}
          >
            {saving ? "Saqlanmoqda..." : "Saqlash"}
          </button>
        </div>
      </div>
    </div>
  );
}
