import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { authApi } from "../../api/crmApi";
import { parseAuthToken } from "../../utils/authToken";

export default function LoginPage() {
  const navigate = useNavigate();

  const [login, setLogin] = useState("");
  const [password, setPassword] = useState("");
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

      <div className="flex flex-col items-center justify-center bg-[#f5f5fa] px-6">
        <h1 className="text-5xl font-semibold text-gray-500 mb-12">
          Najot Talim
        </h1>

        <div className="w-full max-w-115 bg-white rounded-3xl shadow-lg p-10">
          <h2 className="text-4xl font-bold mb-6">Tizimga kirish</h2>

          <div className="mb-6">
            <label className="block mb-2 text-lg font-medium">Login</label>
            <input
              type="text"
              value={login}
              onChange={(e) => setLogin(e.target.value)}
              placeholder="Loginni kiriting"
              className="w-full border border-gray-300 rounded-2xl px-5 py-4 outline-none focus:border-green-500"
            />
          </div>

          <div className="mb-8">
            <label className="block mb-2 text-lg font-medium">Parol</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Parolni kiriting"
              className="w-full border border-gray-300 rounded-2xl px-5 py-4 outline-none focus:border-green-500"
            />
          </div>

          <button
            type="button"
            onClick={handleLogin}
            disabled={loading}
            className="w-full bg-emerald-500 hover:bg-emerald-600 disabled:opacity-60 text-white py-4 rounded-2xl text-2xl font-semibold cursor-pointer"
          >
            {loading ? "Kirilmoqda..." : "Kirish"}
          </button>
        </div>
      </div>
    </div>
  );
}
