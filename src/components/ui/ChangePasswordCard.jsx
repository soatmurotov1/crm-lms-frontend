import { useState } from "react";
import Card from "./Card";
import PasswordInput from "./PasswordInput";
import SectionHeader from "./SectionHeader";
import { useTheme } from "../../theme/themeContext";

const EMPTY_FORM = { current: "", next: "", confirm: "" };

/**
 * Barcha panellar uchun umumiy "Parolni o'zgartirish" bloki.
 *
 * O'quvchi va o'qituvchi sozlamalarida bu ish `PasswordModal` orqali qilinadi,
 * admin/superadmin sozlamalarida esa alohida oyna kerak emas — shu kartaning
 * o'zi yetarli. Backend qoidasi bilan bir xil: yangi parol kamida 8 ta belgi.
 */
export default function ChangePasswordCard({
  onSubmit,
  title = "Parolni o'zgartirish",
  subtitle = "Yangi parol kamida 8 ta belgidan iborat bo'lsin",
}) {
  const { theme } = useTheme();

  const [form, setForm] = useState(EMPTY_FORM);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [saving, setSaving] = useState(false);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setError("");
    setSuccess("");
  };

  const validate = () => {
    if (!form.current.trim()) return "Amaldagi parolni kiriting";
    if (!form.next.trim()) return "Yangi parolni kiriting";
    if (form.next.trim().length < 8)
      return "Yangi parol kamida 8 ta belgidan iborat bo'lsin";
    if (form.next.trim() === form.current.trim())
      return "Yangi parol amaldagisidan farq qilishi kerak";
    if (form.next.trim() !== form.confirm.trim()) return "Parollar mos emas";
    return "";
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const validationError = validate();
    if (validationError) {
      setSuccess("");
      setError(validationError);
      return;
    }

    try {
      setSaving(true);
      await onSubmit({
        oldPassword: form.current.trim(),
        newPassword: form.next.trim(),
      });
      setForm(EMPTY_FORM);
      setError("");
      setSuccess("Parol muvaffaqiyatli yangilandi");
    } catch (err) {
      setSuccess("");
      setError(
        err?.response?.data?.message || "Parolni yangilab bo'lmadi",
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card>
      <SectionHeader title={title} subtitle={subtitle} />

      <form onSubmit={handleSubmit} className="space-y-4 max-w-md">
        <div>
          <label className={`block text-sm font-medium mb-2 ${theme.text}`}>
            Amaldagi parol
          </label>
          <PasswordInput
            name="current"
            value={form.current}
            onChange={handleChange}
            autoComplete="current-password"
            placeholder="Amaldagi parol"
          />
        </div>

        <div>
          <label className={`block text-sm font-medium mb-2 ${theme.text}`}>
            Yangi parol
          </label>
          <PasswordInput
            name="next"
            value={form.next}
            onChange={handleChange}
            placeholder="Kamida 8 ta belgi"
          />
        </div>

        <div>
          <label className={`block text-sm font-medium mb-2 ${theme.text}`}>
            Yangi parolni tasdiqlang
          </label>
          <PasswordInput
            name="confirm"
            value={form.confirm}
            onChange={handleChange}
            placeholder="Parolni qayta kiriting"
          />
        </div>

        {error && <p className="text-sm text-rose-500">{error}</p>}
        {success && <p className="text-sm text-emerald-500">{success}</p>}

        <button
          type="submit"
          disabled={saving}
          className="px-5 py-3 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-medium disabled:opacity-60"
        >
          {saving ? "Saqlanmoqda..." : "Parolni saqlash"}
        </button>
      </form>
    </Card>
  );
}
