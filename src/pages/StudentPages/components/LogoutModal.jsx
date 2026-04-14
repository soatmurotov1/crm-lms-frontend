export default function LogoutModal({ onClose, onConfirm }) {
  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true">
      <div className="modal-card">
        <div className="modal-header">
          <div className="modal-title">Platformadan chiqishni xohlaysizmi?</div>
          <button
            type="button"
            className="modal-close"
            onClick={onClose}
            aria-label="Modalni yopish"
          >
            &times;
          </button>
        </div>
        <div className="modal-actions">
          <button type="button" className="modal-btn ghost" onClick={onClose}>
            Yo'q
          </button>
          <button
            type="button"
            className="modal-btn primary"
            onClick={onConfirm}
          >
            Ha
          </button>
        </div>
      </div>
    </div>
  );
}
