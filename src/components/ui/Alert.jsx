import Icon from "./Icon";

/**
 * Forma va sahifa ichidagi xabar bloki (xato, ogohlantirish, muvaffaqiyat).
 *
 * Avval bunday xabarlar shunchaki qizil rangdagi matn edi — ular ekranda
 * ko'zga tashlanmasdi va muvaffaqiyat bilan xatoni faqat rang ajratardi.
 * Ikonka + fon xabarni matn oqimidan ajratib turadi.
 */

const TONES = {
  danger: {
    box: "bg-danger-soft border-danger-border text-danger",
    icon: "warning",
  },
  warning: {
    box: "bg-warning-soft border-warning-border text-warning",
    icon: "warning",
  },
  success: {
    box: "bg-success-soft border-success-border text-success",
    icon: "checkCircle",
  },
  info: {
    box: "bg-accent-soft border-accent-border text-accent-soft-fg",
    icon: "info",
  },
};

export default function Alert({
  tone = "info",
  title,
  children,
  onClose,
  className = "",
}) {
  const config = TONES[tone] || TONES.info;

  return (
    <div
      role={tone === "danger" ? "alert" : "status"}
      className={`flex items-start gap-2.5 rounded-md border px-3 py-2.5 text-sm
        ${config.box} ${className}`}
    >
      <Icon name={config.icon} size={16} className="mt-0.5 shrink-0" />

      <div className="min-w-0 flex-1">
        {title && <p className="font-medium">{title}</p>}
        {children && (
          <p className={title ? "mt-0.5 opacity-90" : ""}>{children}</p>
        )}
      </div>

      {onClose && (
        <button
          type="button"
          onClick={onClose}
          aria-label="Yopish"
          className="shrink-0 -mr-1 -mt-0.5 rounded p-1 opacity-60 hover:opacity-100"
        >
          <Icon name="close" size={14} />
        </button>
      )}
    </div>
  );
}
