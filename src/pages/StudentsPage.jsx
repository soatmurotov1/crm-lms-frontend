import { useEffect, useState } from "react";
import { studentsApi } from "../api/crmApi";

export default function StudentsPage() {
  const [openModal, setOpenModal] = useState(false);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: "",
    birth_date: "",
    photo: null,
  });

  const loadStudents = async () => {
    try {
      setLoading(true);
      setError("");
      const result = await studentsApi.getAll();
      const list = Array.isArray(result?.data) ? result.data : [];
      setStudents([...list].sort((a, b) => Number(a.id) - Number(b.id)));
    } catch (apiError) {
      setError(
        apiError?.response?.data?.message || "Studentlarni olishda xato",
      );
      setStudents([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStudents();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files?.[0] || null;
    setFormData((prev) => ({ ...prev, photo: file }));
  };

  const handleCreateStudent = async () => {
    if (
      !formData.fullName.trim() ||
      !formData.email.trim() ||
      !formData.password.trim() ||
      !formData.birth_date
    ) {
      alert("Majburiy maydonlarni to'ldiring");
      return;
    }

    try {
      setSaving(true);
      await studentsApi.create({
        fullName: formData.fullName.trim(),
        email: formData.email.trim(),
        password: formData.password,
        birth_date: formData.birth_date,
        photo: formData.photo,
      });
      setOpenModal(false);
      setFormData({
        fullName: "",
        email: "",
        password: "",
        birth_date: "",
        photo: null,
      });
      await loadStudents();
    } catch (apiError) {
      alert(apiError?.response?.data?.message || "Talaba qo'shishda xato");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      {/* HEADER */}
      <div className="flex justify-between mb-6">
        <h2 className="text-2xl font-bold">O'quvchilar</h2>

        <button
          onClick={() => setOpenModal(true)}
          className="bg-purple-500 text-white px-4 py-2 rounded-lg"
        >
          + Talaba qo'shish
        </button>
      </div>

      {/* TABLE */}
      <div className="bg-white rounded-xl shadow overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-100">
            <tr className="text-left">
              <th className="p-4">#</th>
              <th className="p-4">Rasm</th>
              <th className="p-4">Ism</th>
              <th className="p-4">Guruh</th>
              <th className="p-4">Telefon</th>
            </tr>
          </thead>

          <tbody>
            {loading ? (
              <tr className="border-t">
                <td className="p-4" colSpan={5}>
                  Yuklanmoqda...
                </td>
              </tr>
            ) : (
              students.map((s) => (
                <tr key={s.id} className="border-t">
                  <td className="p-4">{s.id}</td>
                  <td className="p-4">
                    {s.photo ? (
                      <img
                        src={s.photo}
                        alt={s.fullName}
                        className="w-10 h-10 rounded-full object-cover border"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-slate-100 border flex items-center justify-center text-xs text-slate-600">
                        Rasm yo'q
                      </div>
                    )}
                  </td>
                  <td className="p-4">{s.fullName}</td>
                  <td className="p-4">-</td>
                  <td className="p-4">{s.email}</td>
                </tr>
              ))
            )}

            {!loading && !students.length && (
              <tr className="border-t">
                <td className="p-4" colSpan={5}>
                  {error || "Ma'lumot topilmadi"}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* MODAL */}
      {openModal && (
        <div className="fixed top-0 right-0 h-full w-[400px] bg-white shadow-2xl p-6">
          <h3 className="text-xl font-bold mb-6">Talaba qo'shish</h3>

          <input
            type="text"
            name="fullName"
            value={formData.fullName}
            onChange={handleChange}
            placeholder="Talaba FIO"
            className="border w-full p-3 rounded-lg mb-4"
          />

          <input
            type="text"
            name="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="Mail"
            className="border w-full p-3 rounded-lg mb-4"
          />

          <input
            type="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            placeholder="Parol"
            className="border w-full p-3 rounded-lg mb-4"
          />

          <input
            type="date"
            name="birth_date"
            value={formData.birth_date}
            onChange={handleChange}
            className="border w-full p-3 rounded-lg mb-4"
          />

          <input
            type="file"
            accept="image/*"
            onChange={handlePhotoChange}
            className="border w-full p-3 rounded-lg mb-4"
          />

          <div className="flex justify-end gap-3 mt-6">
            <button
              onClick={() => setOpenModal(false)}
              className="px-4 py-2 border rounded-lg"
            >
              Bekor qilish
            </button>

            <button
              disabled={saving}
              onClick={handleCreateStudent}
              className="px-4 py-2 bg-purple-500 text-white rounded-lg disabled:opacity-60"
            >
              {saving ? "Saqlanmoqda..." : "Saqlash"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
