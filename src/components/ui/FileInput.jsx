import { useId, useState } from "react";
import { useTheme } from "../../theme/themeContext";
import Icon from "./Icon";

const formatSize = (bytes) => {
  if (!bytes) return "";
  const mb = bytes / (1024 * 1024);
  return mb >= 1
    ? `${mb.toFixed(1)} MB`
    : `${Math.max(1, Math.round(bytes / 1024))} KB`;
};

/**
 * Fayl tanlash maydoni.
 *
 * Brauzerning o'z tugmasi ("Choose file / No file chosen") ingliz tilida
 * chiqadi va uslubga bo'ysunmaydi, shuning uchun asl input yashiriladi va
 * uning o'rniga label ko'rsatiladi.
 */
export default function FileInput({
  name,
  accept,
  onChange,
  buttonLabel = "Fayl tanlash",
  placeholder = "Fayl tanlanmagan",
  hint,
  disabled = false,
}) {
  const { theme } = useTheme();
  const inputId = useId();
  const [selected, setSelected] = useState(null);

  const handleChange = (event) => {
    setSelected(event.target.files?.[0] || null);
    onChange?.(event);
  };

  return (
    <div>
      <input
        id={inputId}
        type="file"
        name={name}
        accept={accept}
        disabled={disabled}
        onChange={handleChange}
        className="sr-only"
      />

      <label
        htmlFor={inputId}
        className={`flex items-center gap-2.5 w-full rounded-md border border-line-strong
          bg-surface px-1.5 py-1.5 transition-colors
          ${
            disabled
              ? "opacity-60 cursor-not-allowed"
              : "cursor-pointer hover:border-fg-subtle"
          }`}
      >
        <span
          className="inline-flex shrink-0 items-center gap-1.5 rounded-sm border border-line
            bg-surface-2 px-2.5 py-1 text-xs font-medium text-fg"
        >
          <Icon name="attachment" size={14} />
          {buttonLabel}
        </span>

        <span
          className={`min-w-0 flex-1 truncate text-sm ${
            selected ? theme.text : theme.subtle
          }`}
          title={selected?.name}
        >
          {selected
            ? `${selected.name} · ${formatSize(selected.size)}`
            : placeholder}
        </span>
      </label>

      {hint && <p className={`mt-1.5 text-xs ${theme.subtle}`}>{hint}</p>}
    </div>
  );
}
