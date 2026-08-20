import { useId } from "react";

/**
 * Forma maydoni uchun label + yordamchi matn + xato o'rami.
 *
 * Label o'lchami va oralig'i bir joyda belgilanadi: avval har forma o'z
 * `text-sm font-medium mb-2` ini yozardi va formalar bir-biriga o'xshamay
 * qolgandi.
 *
 * Bola element funksiya bo'lsa, unga `id` uzatiladi — shunda label bosilganda
 * maydon fokus oladi:
 *   <Field label="Ism">{(id) => <input id={id} className="field" />}</Field>
 */
export default function Field({
  label,
  hint,
  error,
  required = false,
  htmlFor,
  className = "",
  children,
}) {
  const generatedId = useId();
  const id = htmlFor || generatedId;

  return (
    <div className={className}>
      {label && (
        <label
          htmlFor={id}
          className="mb-1.5 block text-[0.8125rem] font-medium text-fg"
        >
          {label}
          {required && <span className="ml-0.5 text-danger">*</span>}
        </label>
      )}

      {typeof children === "function" ? children(id) : children}

      {error ? (
        <p className="mt-1.5 text-xs text-danger">{error}</p>
      ) : (
        hint && <p className="mt-1.5 text-xs text-fg-subtle">{hint}</p>
      )}
    </div>
  );
}
