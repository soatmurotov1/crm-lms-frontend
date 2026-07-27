import { useRef } from "react";
import {
  PHONE_PLACEHOLDER,
  PHONE_DISPLAY_PREFIX,
  formatPhone,
} from "../../utils/phone";

const isDigit = (char) => char >= "0" && char <= "9";

/** Kursor oldidagi milliy raqamlar soni (prefiksdagi 998 hisobga olinmaydi). */
const countNationalDigits = (rawValue, caret) => {
  const headDigits = rawValue.slice(0, caret).replace(/\D/g, "");
  const allDigits = rawValue.replace(/\D/g, "");
  const prefixDigits = allDigits.startsWith("998") ? 3 : 0;
  return Math.max(0, headDigits.length - prefixDigits);
};

/** Formatlangan matnda N-chi milliy raqamdan keyingi kursor pozitsiyasi. */
const caretAfterDigit = (formatted, count) => {
  if (count <= 0) return PHONE_DISPLAY_PREFIX.length;

  let seen = 0;
  for (let i = PHONE_DISPLAY_PREFIX.length; i < formatted.length; i += 1) {
    if (!isDigit(formatted[i])) continue;
    seen += 1;
    if (seen === count) return i + 1;
  }

  return formatted.length;
};

/**
 * `(+998)` prefiksi doim turadigan, faqat raqam qabul qiladigan telefon maydoni.
 * Qiymat `onChange` orqali `{ target: { name, value } }` ko'rinishida qaytadi,
 * ya'ni oddiy `handleChange` bilan ishlaydi.
 */
export default function PhoneInput({
  name = "phone",
  value,
  onChange,
  className = "",
  placeholder = PHONE_PLACEHOLDER,
  ...rest
}) {
  const inputRef = useRef(null);

  const commit = (rawValue, caretInRaw) => {
    const nationalCount = countNationalDigits(rawValue, caretInRaw);
    const formatted = formatPhone(rawValue);

    onChange({ target: { name, value: formatted } });

    const caret = caretAfterDigit(formatted, nationalCount);

    // React qiymatni yangilagandan keyin kursorni joyiga qaytaramiz.
    requestAnimationFrame(() => {
      inputRef.current?.setSelectionRange(caret, caret);
    });
  };

  const handleChange = (event) => {
    const input = event.target;
    commit(input.value, input.selectionStart ?? input.value.length);
  };

  const handleKeyDown = (event) => {
    const input = event.currentTarget;
    const start = input.selectionStart ?? 0;
    const end = input.selectionEnd ?? 0;

    if (event.key !== "Backspace" || start !== end) return;

    // Prefiksni o'chirishga yo'l qo'ymaymiz.
    if (start <= PHONE_DISPLAY_PREFIX.length) {
      event.preventDefault();
      return;
    }

    // Kursor bo'sh joydan keyin tursa, oldingi raqamni o'chiramiz.
    if (isDigit(input.value[start - 1])) return;

    let index = start - 1;
    while (index >= 0 && !isDigit(input.value[index])) index -= 1;

    event.preventDefault();
    if (index < PHONE_DISPLAY_PREFIX.length) return;

    commit(input.value.slice(0, index) + input.value.slice(start), index);
  };

  const guardCaret = () => {
    const input = inputRef.current;
    if (!input) return;

    if ((input.selectionStart ?? 0) < PHONE_DISPLAY_PREFIX.length) {
      const caret = Math.max(input.value.length, PHONE_DISPLAY_PREFIX.length);
      input.setSelectionRange(caret, caret);
    }
  };

  return (
    <input
      {...rest}
      ref={inputRef}
      type="tel"
      inputMode="numeric"
      name={name}
      value={formatPhone(value)}
      onChange={handleChange}
      onKeyDown={handleKeyDown}
      onFocus={guardCaret}
      onClick={guardCaret}
      placeholder={placeholder}
      maxLength={PHONE_PLACEHOLDER.length}
      className={className}
    />
  );
}
