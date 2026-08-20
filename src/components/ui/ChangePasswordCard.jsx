import { useState } from "react";
import Alert from "./Alert";
import Button from "./Button";
import Card from "./Card";
import Field from "./Field";
import PasswordInput from "./PasswordInput";
import SectionHeader from "./SectionHeader";

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

      <form onSubmit={handleSubmit} className="space-y-4 max-w-sm">
        <Field label="Amaldagi parol">
          {(id) => (
            <PasswordInput
              id={id}
              name="current"
              value={form.current}
              onChange={handleChange}
              autoComplete="current-password"
              placeholder="Amaldagi parol"
            />
          )}
        </Field>

        <Field label="Yangi parol">
          {(id) => (
            <PasswordInput
              id={id}
              name="next"
              value={form.next}
              onChange={handleChange}
              placeholder="Kamida 8 ta belgi"
            />
          )}
        </Field>

        <Field label="Yangi parolni tasdiqlang">
          {(id) => (
            <PasswordInput
              id={id}
              name="confirm"
              value={form.confirm}
              onChange={handleChange}
              placeholder="Parolni qayta kiriting"
            />
          )}
        </Field>

        {error && <Alert tone="danger">{error}</Alert>}
        {success && <Alert tone="success">{success}</Alert>}

        <Button type="submit" variant="primary" loading={saving}>
          {saving ? "Saqlanmoqda..." : "Parolni saqlash"}
        </Button>
      </form>
    </Card>
  );
}
