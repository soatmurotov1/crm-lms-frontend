import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { authApi, isMissingEndpointError } from "../../api/crmApi";
import { API_BASE_URL } from "../../api/client";
import PhoneInput from "../../components/ui/PhoneInput";
import {
  clearAuthSession,
  parseAuthToken,
  saveAuthTokens,
} from "../../utils/authToken";
import { PHONE_ERROR_MESSAGE, isValidPhone, normalizePhone } from "../../utils/phone";

/** `.env` dagi admin raqami: shu raqam bilan kirilsa admin panel ochiladi. */
const ADMIN_PHONE = normalizePhone(import.meta.env.VITE_ADMIN_PHONE);

const isAdminPhone = (value) =>
  Boolean(ADMIN_PHONE) && normalizePhone(value) === ADMIN_PHONE;

const inputClass =
  "w-full border border-gray-300 rounded-xl px-3 sm:px-4 py-2.5 text-sm sm:text-base outline-none focus:border-green-500 focus:ring-2 focus:ring-green-200 transition";

const labelClass = "block mb-1.5 text-sm sm:text-base font-medium";

/** Maydonlar orasidagi oraliq — forma noutbuk ekraniga sig'ishi uchun ixcham. */
const fieldClass = "mb-3 sm:mb-4";

const linkClass =
  "text-emerald-600 hover:text-emerald-700 font-semibold underline underline-offset-2 cursor-pointer";

/** Parol maydonining ichidagi "ko'z" tugmasi. */
function PasswordToggle({ visible, onToggle }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className="absolute right-2.5 sm:right-3 top-1/2 transform -translate-y-1/2 text-gray-600 hover:text-gray-800 flex items-center justify-center p-2 sm:p-2.5 bg-gray-100 hover:bg-gray-200 rounded-full transition-colors cursor-pointer"
      aria-label={visible ? "Parolni yashirish" : "Parolni ko'rsatish"}
      title={visible ? "Parolni yashirish" : "Parolni ko'rsatish"}
    >
      {visible ? (
        <svg
          className="w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
          />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
          />
        </svg>
      ) : (
        <svg
          className="w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88"
          />
        </svg>
      )}
    </button>
  );
}

const emptyRegisterForm = {
  fullName: "",
  birth_date: "",
  password: "",
  confirmPassword: "",
};

/** Backenddagi qayta yuborish cooldown'i bilan bir xil (60 soniya). */
const RESEND_COOLDOWN_SECONDS = 60;

export default function LoginPage() {
  const navigate = useNavigate();

  const [mode, setMode] = useState("login");
  const [login, setLogin] = useState("");
  const [password, setPassword] = useState("");
  const [registerForm, setRegisterForm] = useState(emptyRegisterForm);
  // Ro'yxatdan o'tish 2 bosqichli: "form" -> SMS kod -> "code" -> hisob ochiladi.
  const [registerStep, setRegisterStep] = useState("form");
  const [smsCode, setSmsCode] = useState("");
  const [resendIn, setResendIn] = useState(0);
  // Ro'yxatdan o'tishda raqam band chiqsa, foydalanuvchiga yo'l ko'rsatamiz.
  const [accountExists, setAccountExists] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState({
    show: false,
    type: "success",
    message: "",
  });
  const toastTimerRef = useRef(null);

  const showToast = (type, message) => {
    if (toastTimerRef.current) {
      clearTimeout(toastTimerRef.current);
    }

    setToast({ show: true, type, message });
    toastTimerRef.current = setTimeout(() => {
      setToast((prev) => ({ ...prev, show: false }));
    }, 2200);
  };

  useEffect(() => {
    return () => {
      if (toastTimerRef.current) {
        clearTimeout(toastTimerRef.current);
      }
    };
  }, []);

  // "Qayta yuborish" tugmasi uchun sanoq.
  useEffect(() => {
    if (resendIn <= 0) return undefined;

    const timer = setTimeout(() => setResendIn((prev) => prev - 1), 1000);
    return () => clearTimeout(timer);
  }, [resendIn]);

  const getRequestErrorMessage = (error, fallback) => {
    if (!navigator.onLine) {
      return "Internet muammosi: internetga ulanmagansiz";
    }

    if (!error?.response) {
      return `Backendga ulanib bo'lmadi (${API_BASE_URL}). Serverni tekshiring`;
    }

    /*
      404 ikki xil: marshrut yo'q (eski deploy) yoki servis "topilmadi" dedi.
      Ikkinchisida serverning o'z xabari aynan foydalanuvchiga kerak —
      masalan "Bu telefon raqami ro'yxatdan o'tmagan".
    */
    if (isMissingEndpointError(error)) {
      return `Endpoint topilmadi: ${error.config?.url}. Server eski versiyada ishlayapti`;
    }

    const message = error?.response?.data?.message;
    return (Array.isArray(message) ? message[0] : message) || fallback;
  };

  /** Token olingandan keyingi umumiy qadam: saqlash va rolga qarab yo'naltirish. */
  const applySession = (result, successMessage) => {
    const accessToken = result?.accessToken || result?.access_token;

    // Oldingi foydalanuvchining keshi yangi sessiyaga o'tib ketmasligi kerak.
    clearAuthSession();
    saveAuthTokens({ accessToken, refreshToken: result?.refreshToken });
    showToast("success", successMessage);

    const role = String(parseAuthToken(accessToken)?.role || "").toUpperCase();
    const targetPath =
      role === "STUDENT"
        ? "/student/dashboard"
        : role === "TEACHER"
          ? "/teacher"
          : role === "SUPERADMIN"
            ? "/superadmin"
            : "/dashboard";

    setTimeout(() => {
      navigate(targetPath);
    }, 800);
  };

  const switchMode = (nextMode, { keepPhone = false } = {}) => {
    setMode(nextMode);
    setAccountExists(false);
    if (!keepPhone) setLogin("");
    setPassword("");
    setShowPassword(false);
    setShowConfirmPassword(false);
    setRegisterForm(emptyRegisterForm);
    setRegisterStep("form");
    setSmsCode("");
    setResendIn(0);
  };

  const handleRegisterChange = (e) => {
    const { name, value } = e.target;
    setRegisterForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleLogin = async () => {
    if (!login || !password) {
      showToast("error", "Telefon raqami va parolni kiriting");
      return;
    }

    if (!isValidPhone(login)) {
      showToast("error", PHONE_ERROR_MESSAGE);
      return;
    }

    try {
      setLoading(true);
      const payload = {
        phone: normalizePhone(login),
        password,
      };

      let result = null;

      if (isAdminPhone(login)) {
        // Admin raqami oldindan ma'lum - o'qituvchi/talaba jadvallarini
        // behuda tekshirib o'tirmaymiz.
        result = await authApi.loginAdmin(payload);
      } else {
        try {
          result = await authApi.loginAdmin(payload);
        } catch {
          try {
            result = await authApi.loginTeacher(payload);
          } catch {
            result = await authApi.loginStudent(payload);
          }
        }
      }

      if (!result?.accessToken) {
        throw new Error("Token kelmadi");
      }

      applySession(result, "Tizimga muvaffaqiyatli kirdingiz");
    } catch (error) {
      showToast(
        "error",
        getRequestErrorMessage(error, "Telefon raqami yoki parol noto'g'ri"),
      );
    } finally {
      setLoading(false);
    }
  };

  /** Ro'yxatdan o'tish formasi to'g'ri to'ldirilganini tekshiradi. */
  const isRegisterFormValid = () => {
    if (
      !registerForm.fullName.trim() ||
      !login ||
      !registerForm.birth_date ||
      !registerForm.password
    ) {
      showToast("error", "Barcha maydonlarni to'ldiring");
      return false;
    }

    if (!isValidPhone(login)) {
      showToast("error", PHONE_ERROR_MESSAGE);
      return false;
    }

    if (registerForm.password.length < 6) {
      showToast("error", "Parol kamida 6 ta belgidan iborat bo'lsin");
      return false;
    }

    if (registerForm.password !== registerForm.confirmPassword) {
      showToast("error", "Parollar mos kelmadi");
      return false;
    }

    return true;
  };

  /** Parolni tiklashda faqat raqam kerak. */
  const isForgotFormValid = () => {
    if (!isValidPhone(login)) {
      showToast("error", PHONE_ERROR_MESSAGE);
      return false;
    }
    return true;
  };

  /** 1-bosqich: raqamga SMS kod yuborish. */
  const handleSendCode = async ({ resend = false } = {}) => {
    const forgot = mode === "forgot";

    if (!resend && !(forgot ? isForgotFormValid() : isRegisterFormValid())) {
      return;
    }
    if (resendIn > 0) return;

    try {
      setLoading(true);
      // Parolni tiklashda backend avval hisob borligini tekshiradi va
      // kodni RESET_PASSWORD maqsadi bilan yuboradi.
      if (forgot) {
        await authApi.forgotPassword(normalizePhone(login));
      } else {
        await authApi.sendCode(normalizePhone(login));
      }
      setRegisterStep("code");
      setSmsCode("");
      setResendIn(RESEND_COOLDOWN_SECONDS);
      showToast("success", "Tasdiqlash kodi SMS orqali yuborildi");
    } catch (error) {
      // 409 = raqam allaqachon band. Foydalanuvchiga aniq yo'l ko'rsatamiz.
      if (!forgot && error?.response?.status === 409) {
        setAccountExists(true);
      }
      showToast("error", getRequestErrorMessage(error, "Kod yuborilmadi"));
    } finally {
      setLoading(false);
    }
  };

  /** 2-bosqich: kodni yuborib hisobni ochish. */
  const handleRegister = async () => {
    if (!isRegisterFormValid()) return;

    const code = smsCode.trim();
    if (code.length !== 6) {
      showToast("error", "Tasdiqlash kodi 6 xonali bo'lishi kerak");
      return;
    }

    try {
      setLoading(true);
      const result = await authApi.register({
        fullName: registerForm.fullName.trim(),
        phone: normalizePhone(login),
        birth_date: registerForm.birth_date,
        password: registerForm.password,
        code,
      });

      if (!result?.accessToken) {
        throw new Error("Token kelmadi");
      }

      applySession(result, "Ro'yxatdan o'tdingiz");
    } catch (error) {
      if (error?.response?.status === 409) {
        setAccountExists(true);
      }
      showToast(
        "error",
        getRequestErrorMessage(error, "Ro'yxatdan o'tishda xato"),
      );
    } finally {
      setLoading(false);
    }
  };

  /** 2-bosqich (parolni tiklash): kod + yangi parol. */
  const handleResetPassword = async () => {
    const code = smsCode.trim();

    if (code.length !== 6) {
      showToast("error", "Tasdiqlash kodi 6 xonali bo'lishi kerak");
      return;
    }

    if (registerForm.password.length < 6) {
      showToast("error", "Parol kamida 6 ta belgidan iborat bo'lsin");
      return;
    }

    if (registerForm.password !== registerForm.confirmPassword) {
      showToast("error", "Parollar mos kelmadi");
      return;
    }

    try {
      setLoading(true);
      await authApi.resetPassword({
        phone: normalizePhone(login),
        code,
        password: registerForm.password,
      });

      const phone = login;
      switchMode("login", { keepPhone: true });
      setLogin(phone);
      showToast("success", "Parol yangilandi. Endi tizimga kiring");
    } catch (error) {
      showToast("error", getRequestErrorMessage(error, "Parol yangilanmadi"));
    } finally {
      setLoading(false);
    }
  };

  const isRegister = mode === "register";
  const isForgot = mode === "forgot";
  // Ikkala ko'p bosqichli oqim ham bir xil qadamlardan iborat: forma -> kod.
  const isCodeStep = (isRegister || isForgot) && registerStep === "code";

  const handleSubmit = (e) => {
    e.preventDefault();
    if (loading) return;
    if (mode === "login") {
      handleLogin();
    } else if (!isCodeStep) {
      handleSendCode();
    } else if (isForgot) {
      handleResetPassword();
    } else {
      handleRegister();
    }
  };

  const submitLabel = loading
    ? "Tekshirilmoqda..."
    : isCodeStep
      ? isForgot
        ? "Parolni yangilash"
        : "Tasdiqlash va ro'yxatdan o'tish"
      : isRegister || isForgot
        ? "Kod olish"
        : "Kirish";

  return (
    <div className="min-h-screen md:h-screen grid md:grid-cols-2 md:overflow-hidden">
      <div
        className={`fixed top-4 right-4 z-50 transform transition-all duration-500 ${
          toast.show
            ? "translate-x-0 opacity-100"
            : "translate-x-8 opacity-0 pointer-events-none"
        }`}
      >
        <div
          className={`rounded-2xl px-5 py-3 shadow-xl text-white min-w-70 text-center ${
            toast.type === "error" ? "bg-red-500" : "bg-emerald-500"
          }`}
        >
          {toast.message}
        </div>
      </div>

      <div className="hidden md:block h-full overflow-hidden">
        <img
          src="/login-bg.jpg"
          alt="EduCenter o'quv xonasi"
          className="w-full h-full object-cover"
        />
      </div>

      <div className="flex flex-col items-center justify-center bg-[#f5f5fa] px-4 sm:px-6 py-6 min-h-screen md:h-screen md:min-h-0 md:overflow-y-auto">
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-semibold text-gray-500 mb-4 sm:mb-6 shrink-0">
          EduCenter
        </h1>

        <form
          onSubmit={handleSubmit}
          className="w-full max-w-sm sm:max-w-md lg:max-w-115 bg-white rounded-2xl shadow-lg p-5 sm:p-6 md:p-8 shrink-0"
        >
          <h2 className="text-xl sm:text-2xl md:text-3xl font-bold mb-3 sm:mb-4">
            {isRegister
              ? "Ro'yxatdan o'tish"
              : isForgot
                ? "Parolni tiklash"
                : "Tizimga kirish"}
          </h2>

          {isRegister && (
            <div className={fieldClass}>
              <label className={labelClass}>Ismingiz</label>
              <input
                type="text"
                name="fullName"
                autoComplete="name"
                value={registerForm.fullName}
                onChange={handleRegisterChange}
                placeholder="Ism Familiya"
                disabled={isCodeStep}
                className={inputClass}
              />
            </div>
          )}

          <div className={fieldClass}>
            <label className={labelClass}>
              {isRegister || isForgot
                ? "Telefon raqamingiz"
                : "Telefon raqami"}
            </label>
            <PhoneInput
              name="phone"
              autoComplete="tel"
              value={login}
              onChange={(e) => {
                setLogin(e.target.value);
                setAccountExists(false);
              }}
              disabled={isCodeStep}
              className={inputClass}
            />
          </div>

          {isRegister && (
            <div className={fieldClass}>
              <label className={labelClass}>Tug'ilgan sana</label>
              <input
                type="date"
                name="birth_date"
                value={registerForm.birth_date}
                onChange={handleRegisterChange}
                max={new Date().toISOString().slice(0, 10)}
                disabled={isCodeStep}
                className={inputClass}
              />
            </div>
          )}

          {/* Parolni tiklashda yangi parol faqat kod tasdiqlangach so'raladi. */}
          {(!isForgot || isCodeStep) && (
            <div className={fieldClass}>
              <label className={labelClass}>
                {isForgot ? "Yangi parol" : "Parol"}
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  autoComplete={
                    isRegister || isForgot ? "new-password" : "current-password"
                  }
                  value={
                    isRegister || isForgot ? registerForm.password : password
                  }
                  onChange={(e) =>
                    isRegister || isForgot
                      ? handleRegisterChange(e)
                      : setPassword(e.target.value)
                  }
                  placeholder={
                    isRegister || isForgot
                      ? "Kamida 6 ta belgi"
                      : "Parolni kiriting"
                  }
                  disabled={isRegister && isCodeStep}
                  className={`${inputClass} pr-12`}
                />
                <PasswordToggle
                  visible={showPassword}
                  onToggle={() => setShowPassword((prev) => !prev)}
                />
              </div>
            </div>
          )}

          {(isRegister || (isForgot && isCodeStep)) && (
            <div className={fieldClass}>
              <label className={labelClass}>Parolni tasdiqlang</label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  name="confirmPassword"
                  autoComplete="new-password"
                  value={registerForm.confirmPassword}
                  onChange={handleRegisterChange}
                  placeholder="Parolni qayta kiriting"
                  disabled={isRegister && isCodeStep}
                  className={`${inputClass} pr-12`}
                />
                <PasswordToggle
                  visible={showConfirmPassword}
                  onToggle={() => setShowConfirmPassword((prev) => !prev)}
                />
              </div>
            </div>
          )}

          {isCodeStep && (
            <div className={fieldClass}>
              <label className={labelClass}>SMS kod</label>
              <input
                type="text"
                name="code"
                inputMode="numeric"
                autoComplete="one-time-code"
                value={smsCode}
                onChange={(e) =>
                  setSmsCode(e.target.value.replace(/\D/g, "").slice(0, 6))
                }
                placeholder="6 xonali kod"
                maxLength={6}
                autoFocus
                className={`${inputClass} tracking-[0.4em] text-center`}
              />
              <div className="mt-2 flex items-center justify-between text-xs sm:text-sm text-gray-600">
                <span>{normalizePhone(login)} raqamiga yuborildi</span>
                <button
                  type="button"
                  onClick={() => handleSendCode({ resend: true })}
                  disabled={resendIn > 0 || loading}
                  className="text-emerald-600 hover:text-emerald-700 font-semibold underline underline-offset-2 disabled:text-gray-400 disabled:no-underline disabled:cursor-not-allowed cursor-pointer"
                >
                  {resendIn > 0
                    ? `Qayta yuborish (${resendIn})`
                    : "Qayta yuborish"}
                </button>
              </div>
            </div>
          )}

          {/* Raqam band bo'lsa, foydalanuvchini boshi berk ko'chada qoldirmaymiz */}
          {accountExists && (
            <div className="mb-3 sm:mb-4 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
              <p className="mb-3">
                Bu raqam allaqachon ro'yxatdan o'tgan. Tizimga kiring yoki
                parolni tiklang.
              </p>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => switchMode("login", { keepPhone: true })}
                  className="rounded-lg bg-emerald-500 px-4 py-2 font-semibold text-white hover:bg-emerald-600 cursor-pointer"
                >
                  Tizimga kirish
                </button>
                <button
                  type="button"
                  onClick={() => switchMode("forgot", { keepPhone: true })}
                  className="rounded-lg border border-amber-300 px-4 py-2 font-semibold hover:bg-amber-100 cursor-pointer"
                >
                  Parolni tiklash
                </button>
              </div>
            </div>
          )}

          {/* Parol maydonining tagida - rejimlar orasida o'tish havolalari */}
          <div className="mb-6 text-sm sm:text-base text-gray-600">
            {isCodeStep ? (
              <span>
                Ma'lumotlarni tuzatmoqchimisiz?{" "}
                <button
                  type="button"
                  onClick={() => {
                    setRegisterStep("form");
                    setSmsCode("");
                  }}
                  className={linkClass}
                >
                  Orqaga
                </button>
              </span>
            ) : isForgot ? (
              <span>
                Parolingiz esingizdami?{" "}
                <button
                  type="button"
                  onClick={() => switchMode("login", { keepPhone: true })}
                  className={linkClass}
                >
                  Tizimga kirish
                </button>
              </span>
            ) : isRegister ? (
              <span>
                Hisobingiz bormi?{" "}
                <button
                  type="button"
                  onClick={() => switchMode("login")}
                  className={linkClass}
                >
                  Tizimga kirish
                </button>
                {" · "}
                <button
                  type="button"
                  onClick={() => switchMode("forgot", { keepPhone: true })}
                  className={linkClass}
                >
                  Parolni tiklash
                </button>
              </span>
            ) : (
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span>
                  Ro'yxatdan o'tmaganmisiz?{" "}
                  <button
                    type="button"
                    onClick={() => switchMode("register")}
                    className={linkClass}
                  >
                    Ro'yxatdan o'tish
                  </button>
                </span>
                <button
                  type="button"
                  onClick={() => switchMode("forgot", { keepPhone: true })}
                  className={linkClass}
                >
                  Parolni unutdingizmi?
                </button>
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-emerald-500 hover:bg-emerald-600 disabled:opacity-60 text-white py-2.5 sm:py-4 rounded-xl sm:rounded-2xl text-base sm:text-xl md:text-2xl font-semibold cursor-pointer transition active:scale-95"
          >
            {submitLabel}
          </button>

          {(isRegister || isForgot) && (
            <p className="mt-4 text-xs sm:text-sm text-gray-500 text-center">
              {isCodeStep
                ? "Kod 3 daqiqa amal qiladi."
                : isForgot
                  ? "Ro'yxatdan o'tgan raqamingizga tiklash kodi yuboriladi."
                  : "Raqamingizga SMS kod yuboriladi. Ro'yxatdan o'tgan foydalanuvchi talaba hisobiga ega bo'ladi."}
            </p>
          )}
        </form>
      </div>
    </div>
  );
}
