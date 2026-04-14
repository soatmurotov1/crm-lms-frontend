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
            >
              👁
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
            >
              👁
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
            >
              👁
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
