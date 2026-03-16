import { useEffect, useMemo, useState } from "react";
import { roomsApi } from "../api/crmApi";

export default function RoomsPage({ theme, darkMode }) {
  const [showDrawer, setShowDrawer] = useState(false);
  const [editingRoomId, setEditingRoomId] = useState(null);

  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    capacity: "",
  });

  const loadRooms = async () => {
    try {
      setLoading(true);
      const result = await roomsApi.getAll();
      const list = Array.isArray(result?.data) ? result.data : [];
      setRooms(list);
    } catch (error) {
      setRooms([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRooms();
  }, []);

  const filteredRooms = useMemo(() => rooms, [rooms]);

  const resetForm = () => {
    setEditingRoomId(null);
    setFormData({
      name: "",
      capacity: "",
    });
  };

  const openAddDrawer = () => {
    setEditingRoomId(null);
    setFormData({
      name: "",
      capacity: "",
    });
    setShowDrawer(true);
  };

  const openEditDrawer = (room) => {
    setEditingRoomId(room.id);
    setFormData({
      name: room.name,
      capacity: room.capacity,
    });
    setShowDrawer(true);
  };

  const closeDrawer = () => {
    setShowDrawer(false);
    resetForm();
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSave = async () => {
    if (!formData.name.trim() || !formData.capacity.trim()) {
      alert("Xona nomi va sig‘imi kiritilishi kerak");
      return;
    }

    try {
      setSaving(true);
      const payload = {
        name: formData.name.trim(),
        capacity: Number(formData.capacity),
      };

      if (editingRoomId !== null) {
        await roomsApi.update(editingRoomId, payload);
      } else {
        await roomsApi.create(payload);
      }

      await loadRooms();
      closeDrawer();
    } catch (error) {
      alert(error?.response?.data?.message || "Xonani saqlashda xato");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await roomsApi.remove(id);
      await loadRooms();
    } catch (error) {
      alert(error?.response?.data?.message || "Xonani o'chirishda xato");
    }
  };

  return (
    <div className="space-y-6 w-full min-w-0 overflow-x-hidden">
      <div
        className={`${theme.card} border rounded-2xl p-3 sm:p-4 lg:p-5 shadow-sm overflow-hidden w-full min-w-0`}
      >
        <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4 mb-5 min-w-0">
          <div className="min-w-0">
            <h2
              className={`text-xl sm:text-2xl font-bold break-words ${theme.text}`}
            >
              Xonalar
            </h2>
            <p className={`text-sm mt-1 break-words ${theme.soft}`}>
              Jami {filteredRooms.length} ta xona
            </p>
          </div>

          <button
            onClick={openAddDrawer}
            className="bg-violet-600 hover:bg-violet-700 text-white px-5 py-3 rounded-xl font-medium shrink-0"
          >
            + Xonani qo‘shish
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {loading ? (
            <div
              className={`${theme.card} border rounded-2xl p-6 w-full text-center sm:col-span-2 xl:col-span-3 ${theme.soft}`}
            >
              Yuklanmoqda...
            </div>
          ) : filteredRooms.length > 0 ? (
            filteredRooms.map((room) => (
              <div
                key={room.id}
                className={`${theme.card} border rounded-2xl p-4 sm:p-5 shadow-sm min-h-[190px] w-full min-w-0`}
              >
                <div className="flex items-start justify-between gap-3 min-w-0 h-full">
                  <div className="min-w-0 flex-1">
                    <h3
                      className={`text-[17px] sm:text-[18px] font-bold break-words ${theme.text}`}
                    >
                      {room.name}
                    </h3>

                    <p className={`text-sm mt-3 break-words ${theme.soft}`}>
                      Sig‘imi: {room.capacity} ta
                    </p>

                    <p className={`text-sm mt-1 break-words ${theme.soft}`}>
                      Holati: {room.status || "ACTIVE"}
                    </p>
                  </div>

                  <div className="flex gap-2 shrink-0">
                    <button
                      onClick={() => handleDelete(room.id)}
                      className={`w-10 h-10 rounded-xl border flex items-center justify-center transition ${
                        darkMode
                          ? "border-slate-700 hover:bg-red-900/30"
                          : "border-slate-200 hover:bg-red-50"
                      }`}
                    >
                      🗑️
                    </button>

                    <button
                      onClick={() => openEditDrawer(room)}
                      className={`w-10 h-10 rounded-xl border flex items-center justify-center transition ${
                        darkMode
                          ? "border-slate-700 hover:bg-slate-800"
                          : "border-slate-200 hover:bg-slate-50"
                      }`}
                    >
                      ✏️
                    </button>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div
              className={`${theme.card} border rounded-2xl p-6 w-full text-center sm:col-span-2 xl:col-span-3 ${theme.soft}`}
            >
              Bu filialda xona yo‘q
            </div>
          )}
        </div>
      </div>

      {showDrawer && (
        <div className={`fixed inset-0 z-50 ${theme.overlay}`}>
          <div className="absolute inset-0" onClick={closeDrawer} />

          <div
            className={`absolute inset-y-0 right-0 w-full sm:max-w-[430px] shadow-2xl overflow-y-auto z-10 ${
              darkMode ? "bg-slate-900" : "bg-white"
            }`}
          >
            <div
              className={`p-4 sm:p-6 flex items-start justify-between gap-3 border-b ${
                darkMode ? "border-slate-800" : "border-slate-200"
              }`}
            >
              <h2 className={`text-lg sm:text-xl font-bold ${theme.text}`}>
                {editingRoomId !== null
                  ? "Xonani tahrirlash"
                  : "Xonani qo‘shish"}
              </h2>

              <button
                onClick={closeDrawer}
                className={`text-xl shrink-0 ${theme.soft}`}
              >
                ×
              </button>
            </div>

            <div className="p-4 sm:p-6 space-y-5">
              <div>
                <label
                  className={`block text-sm font-medium mb-2 ${theme.text}`}
                >
                  Nomi
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Xona nomi"
                  className={`w-full rounded-xl border px-4 py-3 outline-none min-w-0 ${theme.input}`}
                />
              </div>

              <div>
                <label
                  className={`block text-sm font-medium mb-2 ${theme.text}`}
                >
                  Sig‘imi
                </label>
                <input
                  type="number"
                  name="capacity"
                  value={formData.capacity}
                  onChange={handleChange}
                  placeholder="Masalan: 20"
                  className={`w-full rounded-xl border px-4 py-3 outline-none min-w-0 ${theme.input}`}
                />
              </div>
            </div>

            <div
              className={`p-4 sm:p-6 flex flex-col sm:flex-row justify-end gap-3 border-t ${
                darkMode ? "border-slate-800" : "border-slate-200"
              }`}
            >
              <button
                onClick={closeDrawer}
                className={`px-5 py-3 rounded-xl border ${
                  darkMode
                    ? "border-slate-700 text-slate-300"
                    : "border-slate-200 text-slate-600"
                }`}
              >
                Bekor qilish
              </button>

              <button
                onClick={handleSave}
                disabled={saving}
                className="px-5 py-3 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-medium"
              >
                {saving ? "Saqlanmoqda..." : "Saqlash"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
