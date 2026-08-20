import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { authApi, isMissingEndpointError } from "../../api/crmApi";
import { API_BASE_URL } from "../../api/client";
import Button from "../../components/ui/Button";
import PhoneInput from "../../components/ui/PhoneInput";
import {
  clearAuthSession,
  parseAuthToken,
  saveAuthTokens,
} from "../../utils/authToken";
import { PHONE_ERROR_MESSAGE, isValidPhone, normalizePhone } from "../../utils/phone";
import Icon from "../../components/ui/Icon";

/** `.env` dagi admin raqami: shu raqam bilan kirilsa admin panel ochiladi. */
const ADMIN_PHONE = normalizePhone(import.meta.env.VITE_ADMIN_PHONE);

const isAdminPhone = (value) =>
  Boolean(ADMIN_PHONE) && normalizePhone(value) === ADMIN_PHONE;

/*
  Maydon uslublari `index.css` dagi `.field` sinfidan keladi, ya'ni login
  ekranidagi input panel ichidagi input bilan bir xil ko'rinadi. Avval bu
  sahifa o'z ranglarini (yashil fokus, kulrang ramka) ishlatardi va ilovaning
  qolgan qismidan ajralib turardi.
*/
const inputClass = "field";

const labelClass = "mb-1.5 block text-[0.8125rem] font-medium text-fg";

/** Maydonlar orasidagi oraliq — forma noutbuk ekraniga sig'ishi uchun ixcham. */
const fieldClass = "mb-3.5";

const linkClass =
  "font-medium text-accent hover:underline underline-offset-4 cursor-pointer";

/** Parol maydonining ichidagi "ko'z" tugmasi. */
function PasswordToggle({ visible, onToggle }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      tabIndex={-1}
      className="absolute right-1 top-1/2 -translate-y-1/2 rounded-md p-1.5
        text-fg-subtle transition-colors hover:bg-surface-2 hover:text-fg"
      aria-label={visible ? "Parolni yashirish" : "Parolni ko'rsatish"}
      title={visible ? "Parolni yashirish" : "Parolni ko'rsatish"}
    >
      <Icon name={visible ? "eyeOff" : "eye"} size={17} />
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

  const heading = isRegister
    ? "Ro'yxatdan o'tish"
    : isForgot
      ? "Parolni tiklash"
      : "Tizimga kirish";

  const headingNote = isCodeStep
    ? `${normalizePhone(login)} raqamiga yuborilgan kodni kiriting`
    : isRegister
      ? "Talaba hisobini ochish uchun ma'lumotlaringizni kiriting"
      : isForgot
        ? "Raqamingizni kiriting — tiklash kodi yuboriladi"
        : "Hisobingizga kirish uchun raqam va parolni kiriting";

  return (
    <div className="grid min-h-screen bg-canvas md:h-screen md:grid-cols-2 md:overflow-hidden">
      {/*
        Xabar yuqori o'rtada: o'ng burchakdagi xabar keng ekranda ko'zdan
        chetda qoladi, forma esa markazda turadi.
      */}
      <div
        className={`fixed left-1/2 top-4 z-50 w-[min(92vw,26rem)] -translate-x-1/2
          transition-all duration-200 ${
            toast.show
              ? "translate-y-0 opacity-100"
              : "pointer-events-none -translate-y-2 opacity-0"
          }`}
      >
        <div
          role="status"
          className={`flex items-start gap-2.5 rounded-md border px-3.5 py-2.5 text-sm shadow-md ${
            toast.type === "error"
              ? "border-danger-border bg-danger-soft text-danger"
              : "border-success-border bg-success-soft text-success"
          }`}
        >
          <Icon
            name={toast.type === "error" ? "warning" : "checkCircle"}
            size={16}
            className="mt-0.5"
          />
          <span className="min-w-0 flex-1">{toast.message}</span>
        </div>
      </div>

      {/* Chap ustun — rasm ustidagi brend bloki. Faqat keng ekranda. */}
      <div className="relative hidden h-full overflow-hidden md:block">
        <img
          src="/login-bg.jpg"
          alt=""
          className="h-full w-full object-cover"
        />
        {/* Rasm ustidagi matn o'qilishi uchun bir tekis qoraytirish */}
        <div className="absolute inset-0 bg-zinc-950/55" />

        <div className="absolute inset-0 flex flex-col justify-between p-8 text-white">
          <div className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-md bg-white/15">
              <Icon name="students" size={17} strokeWidth={2} />
            </span>
            <span className="text-sm font-semibold">EduCenter</span>
          </div>

          <div className="max-w-sm">
            <p className="text-xl font-semibold leading-snug">
              O'quv markazini bitta joydan boshqaring
            </p>
            <p className="mt-2 text-sm text-white/70">
              Guruhlar, davomat, to'lovlar va imtihonlar — barchasi bir tizimda.
            </p>
          </div>
        </div>
      </div>

      <div className="flex min-h-screen flex-col justify-center px-4 py-8 sm:px-6 md:h-screen md:min-h-0 md:overflow-y-auto">
        <div className="mx-auto w-full max-w-96">
          <div className="mb-6 flex items-center gap-2.5 md:hidden">
            <span className="flex h-8 w-8 items-center justify-center rounded-md bg-accent text-accent-fg">
              <Icon name="students" size={17} strokeWidth={2} />
            </span>
            <span className="text-sm font-semibold text-fg">EduCenter</span>
          </div>

          <form
            onSubmit={handleSubmit}
            className="rounded-lg border border-line bg-surface p-5 shadow-sm sm:p-6"
          >
            <h1 className="text-lg font-semibold text-fg">{heading}</h1>
            <p className="mb-5 mt-1 text-[0.8125rem] text-fg-muted">
              {headingNote}
            </p>

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
                placeholder="000000"
                maxLength={6}
                autoFocus
                className={`${inputClass} text-center font-mono text-base tracking-[0.5em]`}
              />
              <div className="mt-2 flex items-center justify-end text-xs">
                <button
                  type="button"
                  onClick={() => handleSendCode({ resend: true })}
                  disabled={resendIn > 0 || loading}
                  className="font-medium text-accent hover:underline underline-offset-4
                    disabled:cursor-not-allowed disabled:text-fg-subtle disabled:no-underline"
                >
                  {resendIn > 0
                    ? `Qayta yuborish (${resendIn}s)`
                    : "Kodni qayta yuborish"}
                </button>
              </div>
            </div>
          )}

          {/* Raqam band bo'lsa, foydalanuvchini boshi berk ko'chada qoldirmaymiz */}
          {accountExists && (
            <div className="mb-3.5 rounded-md border border-warning-border bg-warning-soft p-3">
              <div className="flex items-start gap-2.5 text-sm text-warning">
                <Icon name="warning" size={16} className="mt-0.5" />
                <p>
                  Bu raqam allaqachon ro'yxatdan o'tgan. Tizimga kiring yoki
                  parolni tiklang.
                </p>
              </div>

              <div className="mt-3 flex flex-wrap gap-2 pl-6">
                <Button
                  size="sm"
                  variant="primary"
                  onClick={() => switchMode("login", { keepPhone: true })}
                >
                  Tizimga kirish
                </Button>
                <Button
                  size="sm"
                  onClick={() => switchMode("forgot", { keepPhone: true })}
                >
                  Parolni tiklash
                </Button>
              </div>
            </div>
          )}

          {/* Parol maydonining tagida - rejimlar orasida o'tish havolalari */}
            <div className="mb-5 text-[0.8125rem] text-fg-muted">
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

            <Button type="submit" variant="primary" size="lg" full loading={loading}>
              {submitLabel}
            </Button>

            {(isRegister || isForgot) && (
              <p className="mt-3.5 text-center text-xs text-fg-subtle">
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
    </div>
  );
}
