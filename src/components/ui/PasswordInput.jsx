import { useState } from "react";
import Icon from "./Icon";

/**
 * Parol maydoni — o'ng chetida "ko'z" tugmasi bilan.
 *
 * Panel formalarida (xodim, o'quvchi, o'qituvchi, tashkilot) bir xil
 * ko'rinishda ishlatiladi. Maydonning o'zi `.field` sinfidan keladi, ya'ni
 * ilovadagi boshqa barcha input bilan bir xil balandlik, radius va fokus
 * halqasini oladi.
 */
export default function PasswordInput({
  name = "password",
  value,
  onChange,
  placeholder = "Parol",
  autoComplete = "new-password",
  size = "md",
  className = "",
  ...rest
}) {
  const [visible, setVisible] = useState(false);

  const tall = size === "lg";

  return (
    <div className="relative">
      <input
        type={visible ? "text" : "password"}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        autoComplete={autoComplete}
        className={`field pr-10 ${tall ? "py-2.5" : ""} ${className}`}
        {...rest}
      />

      {/*
        Tugma maydon ichida turadi, lekin o'z foni yo'q: fon bo'lsa maydon
        ichida ikkinchi "quti" paydo bo'ladi. Yetarli kontrastni rang beradi.
      */}
      <button
        type="button"
        onClick={() => setVisible((prev) => !prev)}
        tabIndex={-1}
        className="absolute right-1 top-1/2 -translate-y-1/2 p-1.5 rounded-md
          text-fg-subtle hover:text-fg hover:bg-surface-2 transition-colors"
        aria-label={visible ? "Parolni yashirish" : "Parolni ko'rsatish"}
        title={visible ? "Parolni yashirish" : "Parolni ko'rsatish"}
      >
        <Icon name={visible ? "eyeOff" : "eye"} size={17} />
      </button>
    </div>
  );
}
