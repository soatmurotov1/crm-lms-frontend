import { useMemo, useState } from "react";

const initialStudents = [
  {
    id: 1,
    fullName: "Bekmirzayev Behruz",
    group: "IELTS",
    phone: "+998935640914",
    birthDate: "01.01.1970",
    createdAt: "09.03.2026 16:50",
  },
  {
    id: 2,
    fullName: "Toirov Behruz",
    group: "IELTS",
    phone: "+998945578900",
    birthDate: "01.01.1970",
    createdAt: "09.03.2026 16:50",
  },
  {
    id: 3,
    fullName: "Elif Shavkatova",
    group: "IELTS",
    phone: "+998945577900",
    birthDate: "01.01.1970",
    createdAt: "09.03.2026 16:50",
  },
  {
    id: 4,
    fullName: "Odina Sobirjonova",
    group: "IELTS",
    phone: "+998973278389",
    birthDate: "01.01.1970",
    createdAt: "09.03.2026 16:50",
  },
  {
    id: 5,
    fullName: "Yaxyobek O'ktamov",
    group: "IELTS",
    phone: "+998940792882",
    birthDate: "01.01.1970",
    createdAt: "09.03.2026 16:50",
  },
  {
    id: 6,
    fullName: "Abduvohidova Zuhra",
    group: "IELTS",
    phone: "+998876456550",
    birthDate: "01.01.1970",
    createdAt: "09.03.2026 16:50",
  },
  {
    id: 7,
    fullName: "Abduvohidova Fotima",
    group: "IELTS",
    phone: "+998876456551",
    birthDate: "01.01.1970",
    createdAt: "09.03.2026 16:50",
  },
  {
    id: 8,
    fullName: "Omonqulov Otabek",
    group: "IELTS",
    phone: "+998970252076",
    birthDate: "01.01.1970",
    createdAt: "09.03.2026 16:50",
  },
];

export default function StudentsPage({ theme, darkMode }) {
  const [students, setStudents] = useState(() => {
    const saved = localStorage.getItem("crm_students");
    return saved ? JSON.parse(saved) : initialStudents;
  });

  const [showDrawer, setShowDrawer] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedGroup, setSelectedGroup] = useState("");
  const [editingStudentId, setEditingStudentId] = useState(null);

  const [formData, setFormData] = useState({
    phone: "",
    email: "",
    fullName: "",
    birthDate: "",
    group: "",
    gender: "Erkak",
    image: "",
  });

  const groups = ["IELTS", "Frontend", "Backend", "Math", "SAT"];

  const filteredStudents = useMemo(() => {
    return students.filter((student) => {
      const matchesSearch =
        student.fullName.toLowerCase().includes(search.toLowerCase()) ||
        student.phone.includes(search);

      const matchesGroup = selectedGroup
        ? student.group === selectedGroup
        : true;

      return matchesSearch && matchesGroup;
    });
  }, [students, search, selectedGroup]);

  const resetForm = () => {
    setEditingStudentId(null);
    setFormData({
      phone: "",
      email: "",
      fullName: "",
      birthDate: "",
      group: "",
      gender: "Erkak",
      image: "",
    });
  };

  const openAddDrawer = () => {
    resetForm();
    setShowDrawer(true);
  };

  const openEditDrawer = (student) => {
    setEditingStudentId(student.id);
    setFormData({
      phone: student.phone || "",
      email: student.email || "",
      fullName: student.fullName || "",
      birthDate:
        student.birthDate && student.birthDate.includes(".")
          ? ""
          : student.birthDate || "",
      group: student.group || "",
      gender: student.gender || "Erkak",
      image: student.image || "",
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

  const handleSaveStudent = () => {
    if (!formData.fullName.trim() || !formData.phone.trim()) return;

    if (editingStudentId) {
      const updated = students.map((student) =>
        student.id === editingStudentId
          ? {
              ...student,
              fullName: formData.fullName,
              phone: formData.phone,
              email: formData.email,
              birthDate: formData.birthDate || student.birthDate || "-",
              group: formData.group || "Guruh yo'q",
              gender: formData.gender,
              image: formData.image,
            }
          : student
      );
      setStudents(updated);
      localStorage.setItem("crm_students", JSON.stringify(updated));
    } else {
      const newStudent = {
        id: Date.now(),
        fullName: formData.fullName,
        phone: formData.phone,
        email: formData.email,
        birthDate: formData.birthDate || "-",
        group: formData.group || "Guruh yo'q",
        gender: formData.gender,
        image: formData.image,
        createdAt: new Date().toLocaleString(),
      };

      const updated = [newStudent, ...students];
      setStudents(updated);
      localStorage.setItem("crm_students", JSON.stringify(updated));
    }

    closeDrawer();
  };

  const handleDeleteStudent = (id) => {
    const updated = students.filter((student) => student.id !== id);
    setStudents(updated);
    localStorage.setItem("crm_students", JSON.stringify(updated));
  };

  return (
    <div className="space-y-6 min-w-0">
      <div className={`${theme.card} border rounded-2xl p-5 shadow-sm`}>
        <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4 mb-5">
          <div>
            <h2 className={`text-2xl md:text-3xl font-bold ${theme.text}`}>
              O‘quvchilar
            </h2>
            <div className="flex gap-4 mt-4 text-sm">
              <button className="px-4 py-2 rounded-xl bg-violet-100 text-violet-700 font-medium">
                Faol o‘quvchilar
              </button>
              <button className={`px-4 py-2 rounded-xl border ${theme.input}`}>
                Arxiv
              </button>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <button className="bg-violet-500 hover:bg-violet-600 text-white px-4 py-3 rounded-xl font-medium whitespace-nowrap">
              Exceldan ma'lumot qo‘shish
            </button>

            <button
              onClick={openAddDrawer}
              className="bg-violet-600 hover:bg-violet-700 text-white px-4 py-3 rounded-xl font-medium whitespace-nowrap"
            >
              + Talaba qo‘shish
            </button>
          </div>
        </div>

        <div className="flex flex-col xl:flex-row gap-3 mb-5">
          <input
            type="text"
            placeholder="Ism, familiya yoki telefon"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className={`w-full xl:w-[320px] rounded-xl border px-4 py-3 outline-none ${theme.input}`}
          />

          <input
            type="text"
            placeholder="+998 90 123 45 67"
            className={`w-full xl:w-[220px] rounded-xl border px-4 py-3 outline-none ${theme.input}`}
          />

          <select
            value={selectedGroup}
            onChange={(e) => setSelectedGroup(e.target.value)}
            className={`w-full xl:w-[220px] rounded-xl border px-4 py-3 outline-none ${theme.input}`}
          >
            <option value="">Barcha guruhlar</option>
            {groups.map((group) => (
              <option key={group} value={group}>
                {group}
              </option>
            ))}
          </select>

          <button
            onClick={() => {
              setSearch("");
              setSelectedGroup("");
            }}
            className={`px-4 py-3 rounded-xl border whitespace-nowrap ${theme.topBtn}`}
          >
            Tozalash
          </button>
        </div>

        <div className="overflow-x-auto rounded-2xl border border-slate-200">
          <table className="w-full min-w-[980px] text-sm">
            <thead className={darkMode ? "bg-slate-800" : "bg-slate-50"}>
              <tr>
                <th className={`text-left px-4 py-3 ${theme.text}`}>#</th>
                <th className={`text-left px-4 py-3 ${theme.text}`}>Nomi</th>
                <th className={`text-left px-4 py-3 ${theme.text}`}>Guruh</th>
                <th className={`text-left px-4 py-3 ${theme.text}`}>Telefon</th>
                <th className={`text-left px-4 py-3 ${theme.text}`}>
                  Tug‘ilgan sana
                </th>
                <th className={`text-left px-4 py-3 ${theme.text}`}>
                  Yaratilgan sana
                </th>
                <th className={`text-right px-4 py-3 ${theme.text}`}>Amal</th>
              </tr>
            </thead>

            <tbody>
              {filteredStudents.length > 0 ? (
                filteredStudents.map((student, index) => (
                  <tr
                    key={student.id}
                    className={`border-t ${theme.rowBorder} ${
                      darkMode ? "hover:bg-slate-800/70" : "hover:bg-slate-50"
                    }`}
                  >
                    <td className={`px-4 py-4 ${theme.text}`}>{index + 1}</td>

                    <td className={`px-4 py-4 ${theme.text}`}>
                      <div className="flex items-center gap-3 min-w-[220px]">
                        <div className="w-9 h-9 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center font-semibold">
                          {student.fullName?.charAt(0) || "T"}
                        </div>
                        <span className="font-medium">{student.fullName}</span>
                      </div>
                    </td>

                    <td className={`px-4 py-4 ${theme.text}`}>{student.group}</td>
                    <td className={`px-4 py-4 ${theme.text}`}>{student.phone}</td>
                    <td className={`px-4 py-4 ${theme.text}`}>{student.birthDate}</td>
                    <td className={`px-4 py-4 ${theme.text}`}>{student.createdAt}</td>

                    <td className="px-4 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          className="w-9 h-9 rounded-lg border border-slate-200 hover:bg-slate-100"
                          title="Ko‘rish"
                        >
                          👁️
                        </button>

                        <button
                          onClick={() => openEditDrawer(student)}
                          className="w-9 h-9 rounded-lg border border-slate-200 hover:bg-slate-100"
                          title="Tahrirlash"
                        >
                          ✏️
                        </button>

                        <button
                          onClick={() => handleDeleteStudent(student.id)}
                          className="w-9 h-9 rounded-lg border border-slate-200 hover:bg-red-50"
                          title="O‘chirish"
                        >
                          🗑️
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan="7"
                    className={`px-4 py-10 text-center ${theme.soft}`}
                  >
                    Talaba topilmadi
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-5">
          <select
            className={`rounded-xl border px-4 py-2 outline-none ${theme.input}`}
            defaultValue="10"
          >
            <option value="10">10</option>
            <option value="20">20</option>
            <option value="50">50</option>
          </select>

          <div className="flex items-center gap-2">
            <button className={`w-9 h-9 rounded-lg border ${theme.topBtn}`}>
              1
            </button>
            <button className={`w-9 h-9 rounded-lg border ${theme.topBtn}`}>
              2
            </button>
            <button className={`w-9 h-9 rounded-lg border ${theme.topBtn}`}>
              3
            </button>
            <button className={`w-9 h-9 rounded-lg border ${theme.topBtn}`}>
              4
            </button>
          </div>
        </div>
      </div>

      {showDrawer && (
        <div className={`fixed inset-0 z-50 ${theme.overlay}`}>
          <div
            onClick={closeDrawer}
            className="absolute inset-0"
          />

          <div
            className={`absolute inset-y-0 right-0 w-full max-w-[420px] border-l shadow-2xl overflow-y-auto ${
              darkMode ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"
            }`}
          >
            <div className={`p-6 border-b flex items-center justify-between ${
              darkMode ? "border-slate-800" : "border-slate-200"
            }`}>
              <div>
                <h2 className={`text-xl font-bold ${theme.text}`}>
                  {editingStudentId ? "Talabani tahrirlash" : "Talaba qo‘shish"}
                </h2>
                <p className={`text-sm mt-1 ${theme.soft}`}>
                  Bu yerda siz yangi talaba qo‘shishingiz mumkin
                </p>
              </div>

              <button
                onClick={closeDrawer}
                className={`text-xl ${theme.soft}`}
              >
                ×
              </button>
            </div>

            <div className="p-6 space-y-5">
              <div>
                <label className={`block text-sm font-medium mb-2 ${theme.text}`}>
                  Telefon raqam
                </label>
                <input
                  type="text"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="+998 __ ___ __ __"
                  className={`w-full rounded-xl border px-4 py-3 outline-none ${theme.input}`}
                />
              </div>

              <div>
                <label className={`block text-sm font-medium mb-2 ${theme.text}`}>
                  Mail
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="Elektron pochtani kiriting"
                  className={`w-full rounded-xl border px-4 py-3 outline-none ${theme.input}`}
                />
              </div>

              <div>
                <label className={`block text-sm font-medium mb-2 ${theme.text}`}>
                  Talaba FIO
                </label>
                <input
                  type="text"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleChange}
                  placeholder="Ma'lumotni kiriting"
                  className={`w-full rounded-xl border px-4 py-3 outline-none ${theme.input}`}
                />
              </div>

              <div>
                <label className={`block text-sm font-medium mb-2 ${theme.text}`}>
                  Tug‘ilgan sana
                </label>
                <input
                  type="date"
                  name="birthDate"
                  value={formData.birthDate}
                  onChange={handleChange}
                  className={`w-full rounded-xl border px-4 py-3 outline-none ${theme.input}`}
                />
              </div>

              <div>
                <label className={`block text-sm font-medium mb-2 ${theme.text}`}>
                  Guruhlar
                </label>
                <select
                  name="group"
                  value={formData.group}
                  onChange={handleChange}
                  className={`w-full rounded-xl border px-4 py-3 outline-none ${theme.input}`}
                >
                  <option value="">Guruh tanlang</option>
                  {groups.map((group) => (
                    <option key={group} value={group}>
                      {group}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className={`block text-sm font-medium mb-2 ${theme.text}`}>
                  Jinsi
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() =>
                      setFormData((prev) => ({ ...prev, gender: "Erkak" }))
                    }
                    className={`rounded-xl px-4 py-3 border font-medium ${
                      formData.gender === "Erkak"
                        ? "bg-violet-600 text-white border-violet-600"
                        : theme.input
                    }`}
                  >
                    Erkak
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      setFormData((prev) => ({ ...prev, gender: "Ayol" }))
                    }
                    className={`rounded-xl px-4 py-3 border font-medium ${
                      formData.gender === "Ayol"
                        ? "bg-violet-600 text-white border-violet-600"
                        : theme.input
                    }`}
                  >
                    Ayol
                  </button>
                </div>
              </div>

              <div>
                <label className={`block text-sm font-medium mb-2 ${theme.text}`}>
                  Surati
                </label>
                <div className={`rounded-2xl border-2 border-dashed p-8 text-center ${theme.input}`}>
                  <p className={theme.soft}>Click to upload or drag and drop</p>
                  <p className={`text-xs mt-2 ${theme.soft}`}>
                    JPG or PNG
                  </p>
                </div>
              </div>
            </div>

            <div className={`p-6 border-t flex justify-end gap-3 ${
              darkMode ? "border-slate-800" : "border-slate-200"
            }`}>
              <button
                onClick={closeDrawer}
                className={`px-5 py-3 rounded-xl border ${theme.topBtn}`}
              >
                Bekor qilish
              </button>

              <button
                onClick={handleSaveStudent}
                className="px-5 py-3 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-medium"
              >
                Saqlash
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}