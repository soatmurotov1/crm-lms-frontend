import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { authApi } from "../../api/crmApi";
import PhoneInput from "../../components/ui/PhoneInput";
import { parseAuthToken } from "../../utils/authToken";
import { PHONE_ERROR_MESSAGE, isValidPhone, normalizePhone } from "../../utils/phone";

/** `.env` dagi admin raqami: shu raqam bilan kirilsa admin panel ochiladi. */
const ADMIN_PHONE = normalizePhone(import.meta.env.VITE_ADMIN_PHONE);

const isAdminPhone = (value) =>
  Boolean(ADMIN_PHONE) && normalizePhone(value) === ADMIN_PHONE;

const inputClass =
  "w-full border border-gray-300 rounded-xl sm:rounded-2xl px-3 sm:px-5 py-2.5 sm:py-4 text-sm sm:text-base outline-none focus:border-green-500 focus:ring-2 focus:ring-green-200 transition";

const labelClass = "block mb-2 text-sm sm:text-base md:text-lg font-medium";

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

export default function LoginPage() {
  const navigate = useNavigate();

  const [mode, setMode] = useState("login");
  const [login, setLogin] = useState("");
  const [password, setPassword] = useState("");
  const [registerForm, setRegisterForm] = useState(emptyRegisterForm);
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

  const getRequestErrorMessage = (error, fallback) => {
    if (!navigator.onLine) {
      return "Internet muammosi: internetga ulanmagansiz";
    }

    if (!error?.response) {
      return "Backendga ulanib bo'lmadi. Serverni tekshiring";
    }

    const message = error?.response?.data?.message;
    return (Array.isArray(message) ? message[0] : message) || fallback;
  };

  /** Token olingandan keyingi umumiy qadam: saqlash va rolga qarab yo'naltirish. */
  const applyAccessToken = (accessToken, successMessage) => {
    localStorage.setItem("crm_access_token", accessToken);
    showToast("success", successMessage);

    const role = String(parseAuthToken(accessToken)?.role || "").toUpperCase();
    const targetPath =
      role === "STUDENT"
        ? "/student/dashboard"
        : role === "TEACHER"
          ? "/teacher"
          : "/dashboard";

    setTimeout(() => {
      navigate(targetPath);
    }, 800);
  };

  const switchMode = (nextMode) => {
    setMode(nextMode);
    setPassword("");
    setShowPassword(false);
    setShowConfirmPassword(false);
    setRegisterForm(emptyRegisterForm);
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

      applyAccessToken(result.accessToken, "Tizimga muvaffaqiyatli kirdingiz");
    } catch (error) {
      showToast(
        "error",
        getRequestErrorMessage(error, "Telefon raqami yoki parol noto'g'ri"),
      );
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async () => {
    const fullName = registerForm.fullName.trim();

    if (
      !fullName ||
      !login ||
      !registerForm.birth_date ||
      !registerForm.password
    ) {
      showToast("error", "Barcha maydonlarni to'ldiring");
      return;
    }

    if (!isValidPhone(login)) {
      showToast("error", PHONE_ERROR_MESSAGE);
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
      const result = await authApi.register({
        fullName,
        phone: normalizePhone(login),
        birth_date: registerForm.birth_date,
        password: registerForm.password,
      });

      if (!result?.accessToken) {
        throw new Error("Token kelmadi");
      }

      applyAccessToken(result.accessToken, "Ro'yxatdan o'tdingiz");
    } catch (error) {
      showToast(
        "error",
        getRequestErrorMessage(error, "Ro'yxatdan o'tishda xato"),
      );
    } finally {
      setLoading(false);
    }
  };

  const isRegister = mode === "register";

  const handleSubmit = (e) => {
    e.preventDefault();
    if (loading) return;
    if (isRegister) {
      handleRegister();
    } else {
      handleLogin();
    }
  };

  return (
    <div className="min-h-screen grid md:grid-cols-2">
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

      <div className="hidden md:block">
        <img
          src="/login-bg.jpg"
          alt="EduCenter o'quv xonasi"
          className="w-full h-full object-cover"
        />
      </div>

      <div className="flex flex-col items-center justify-center bg-[#f5f5fa] px-4 sm:px-6 py-8 sm:py-10 min-h-screen">
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-semibold text-gray-500 mb-8 sm:mb-10">
          EduCenter
        </h1>

        <form
          onSubmit={handleSubmit}
          className="w-full max-w-sm sm:max-w-md lg:max-w-115 bg-white rounded-2xl sm:rounded-3xl shadow-lg p-6 sm:p-8 md:p-10"
        >
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-4 sm:mb-6">
            {isRegister ? "Ro'yxatdan o'tish" : "Tizimga kirish"}
          </h2>

          {isRegister && (
            <div className="mb-4 sm:mb-5">
              <label className={labelClass}>Ismingiz</label>
              <input
                type="text"
                name="fullName"
                autoComplete="name"
                value={registerForm.fullName}
                onChange={handleRegisterChange}
                placeholder="Ism Familiya"
                className={inputClass}
              />
            </div>
          )}

          <div className="mb-4 sm:mb-5">
            <label className={labelClass}>
              {isRegister ? "Telefon raqamingiz" : "Telefon raqami"}
            </label>
            <PhoneInput
              name="phone"
              autoComplete="tel"
              value={login}
              onChange={(e) => setLogin(e.target.value)}
              className={inputClass}
            />
          </div>

          {isRegister && (
            <div className="mb-4 sm:mb-5">
              <label className={labelClass}>Tug'ilgan sana</label>
              <input
                type="date"
                name="birth_date"
                value={registerForm.birth_date}
                onChange={handleRegisterChange}
                max={new Date().toISOString().slice(0, 10)}
                className={inputClass}
              />
            </div>
          )}

          <div className={isRegister ? "mb-4 sm:mb-5" : "mb-4"}>
            <label className={labelClass}>Parol</label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                autoComplete={isRegister ? "new-password" : "current-password"}
                value={isRegister ? registerForm.password : password}
                onChange={(e) =>
                  isRegister
                    ? handleRegisterChange(e)
                    : setPassword(e.target.value)
                }
                placeholder={
                  isRegister ? "Kamida 6 ta belgi" : "Parolni kiriting"
                }
                className={`${inputClass} pr-12`}
              />
              <PasswordToggle
                visible={showPassword}
                onToggle={() => setShowPassword((prev) => !prev)}
              />
            </div>
          </div>

          {isRegister && (
            <div className="mb-4 sm:mb-5">
              <label className={labelClass}>Parolni tasdiqlang</label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  name="confirmPassword"
                  autoComplete="new-password"
                  value={registerForm.confirmPassword}
                  onChange={handleRegisterChange}
                  placeholder="Parolni qayta kiriting"
                  className={`${inputClass} pr-12`}
                />
                <PasswordToggle
                  visible={showConfirmPassword}
                  onToggle={() => setShowConfirmPassword((prev) => !prev)}
                />
              </div>
            </div>
          )}

          {/* Parol maydonining tagida - ro'yxatdan o'tish / kirishga qaytish */}
          <div className="mb-6 text-sm sm:text-base text-gray-600">
            {isRegister ? (
              <span>
                Hisobingiz bormi?{" "}
                <button
                  type="button"
                  onClick={() => switchMode("login")}
                  className="text-emerald-600 hover:text-emerald-700 font-semibold underline underline-offset-2 cursor-pointer"
                >
                  Tizimga kirish
                </button>
              </span>
            ) : (
              <span>
                Ro'yxatdan o'tmaganmisiz?{" "}
                <button
                  type="button"
                  onClick={() => switchMode("register")}
                  className="text-emerald-600 hover:text-emerald-700 font-semibold underline underline-offset-2 cursor-pointer"
                >
                  Ro'yxatdan o'tish
                </button>
              </span>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-emerald-500 hover:bg-emerald-600 disabled:opacity-60 text-white py-2.5 sm:py-4 rounded-xl sm:rounded-2xl text-base sm:text-xl md:text-2xl font-semibold cursor-pointer transition active:scale-95"
          >
            {loading
              ? "Tekshirilmoqda..."
              : isRegister
                ? "Ro'yxatdan o'tish"
                : "Kirish"}
          </button>

          {isRegister && (
            <p className="mt-4 text-xs sm:text-sm text-gray-500 text-center">
              Ro'yxatdan o'tgan foydalanuvchi avtomatik ravishda{" "}
              <span className="font-medium">talaba</span> hisobiga ega bo'ladi.
            </p>
          )}
        </form>
      </div>
    </div>
  );
}
