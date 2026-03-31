import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { authApi } from "../../api/crmApi";
import { parseAuthToken } from "../../utils/authToken";

export default function LoginPage() {
  const navigate = useNavigate();

  const [login, setLogin] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
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

  const handleLogin = async () => {
    if (!login || !password) {
      alert("Login va parolni kiriting");
      return;
    }

    try {
      setLoading(true);
      const payload = {
        email: login,
        password,
      };

      let result = null;

      try {
        result = await authApi.loginAdmin(payload);
      } catch {
        try {
          result = await authApi.loginTeacher(payload);
        } catch {
          result = await authApi.loginStudent(payload);
        }
      }

      if (!result?.accessToken) {
        throw new Error("Token kelmadi");
      }

      localStorage.setItem("crm_access_token", result.accessToken);
      showToast("success", "Tizimga muvaffaqiyatli kirdingiz");

      const authUser = parseAuthToken(result.accessToken);
      const role = String(authUser?.role || "").toUpperCase();
      const targetPath =
        role === "STUDENT" ? "/student/dashboard" : "/dashboard";

      setTimeout(() => {
        navigate(targetPath);
      }, 800);
    } catch (error) {
      showToast(
        "error",
        error?.response?.data?.message || "Login yoki parol noto'g'ri",
      );
    } finally {
      setLoading(false);
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
          src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?q=80&w=1600&auto=format&fit=crop"
          alt="office"
          className="w-full h-full object-cover"
        />
      </div>

      <div className="flex flex-col items-center justify-center bg-[#f5f5fa] px-4 sm:px-6 py-8 sm:py-0 min-h-screen">
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-semibold text-gray-500 mb-8 sm:mb-12">
          Najot Talim
        </h1>

        <div className="w-full max-w-sm sm:max-w-md lg:max-w-115 bg-white rounded-2xl sm:rounded-3xl shadow-lg p-6 sm:p-8 md:p-10">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-4 sm:mb-6">
            Tizimga kirish
          </h2>

          <div className="mb-4 sm:mb-6">
            <label className="block mb-2 text-sm sm:text-base md:text-lg font-medium">
              Login
            </label>
            <input
              type="text"
              value={login}
              onChange={(e) => setLogin(e.target.value)}
              placeholder="Loginni kiriting"
              className="w-full border border-gray-300 rounded-xl sm:rounded-2xl px-3 sm:px-5 py-2.5 sm:py-4 text-sm sm:text-base outline-none focus:border-green-500 focus:ring-2 focus:ring-green-200 transition"
            />
          </div>

          <div className="mb-6 sm:mb-8">
            <label className="block mb-2 text-sm sm:text-base md:text-lg font-medium">
              Parol
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Parolni kiriting"
                className="w-full border border-gray-300 rounded-xl sm:rounded-2xl px-3 sm:px-5 py-2.5 sm:py-4 pr-10 sm:pr-12 text-sm sm:text-base outline-none focus:border-green-500 focus:ring-2 focus:ring-green-200 transition"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-2.5 sm:right-3 top-1/2 transform -translate-y-1/2 text-gray-600 hover:text-gray-800 flex items-center justify-center p-2 sm:p-2.5 bg-gray-100 hover:bg-gray-200 rounded-full transition-colors cursor-pointer"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? (
                  <svg
                    className="w-5 h-5 sm:w-5 sm:h-5"
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
                    className="w-5 h-5 sm:w-5 sm:h-5"
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
            </div>
          </div>

          <button
            type="button"
            onClick={handleLogin}
            disabled={loading}
            className="w-full bg-emerald-500 hover:bg-emerald-600 disabled:opacity-60 text-white py-2.5 sm:py-4 rounded-xl sm:rounded-2xl text-base sm:text-xl md:text-2xl font-semibold cursor-pointer transition active:scale-95"
          >
            {loading ? "Kirilmoqda..." : "Kirish"}
          </button>
        </div>
      </div>
    </div>
  );
}
