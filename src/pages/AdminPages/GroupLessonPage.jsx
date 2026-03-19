import { useMemo, useState } from "react";

const lessonTabs = ["Uyga vazifa", "Videolar", "Imtihonlar", "Jurnal"];
const topicTypes = ["O‘quv reja bo‘yicha", "Boshqa"];

const defaultLessons = [
  {
    id: 1,
    topic: "crm continue backend finish",
    students: 15,
    submitted: 11,
    checked: 0,
    assignedAt: "10 Mart, 2026 09:30",
    deadline: "11 Mart, 2026 01:30",
    lessonDate: "09 Mart, 2026",
    color: "bg-orange-400",
  },
  {
    id: 2,
    topic: "crm project continue",
    students: 15,
    submitted: 11,
    checked: 0,
    assignedAt: "04 Mart, 2026 13:39",
    deadline: "05 Mart, 2026",
    lessonDate: "04 Mart, 2026",
    color: "bg-orange-400",
  },
  {
    id: 3,
    topic: "React continue, nested route, NavLink",
    students: 15,
    submitted: 12,
    checked: 0,
    assignedAt: "25 Fev, 2026 23:10",
    deadline: "26 Fev, 2026 15:10",
    lessonDate: "25 Fev, 2026",
    color: "bg-orange-400",
  },
  {
    id: 4,
    topic: "React+vite+tailwind and props, list keys, conditional rendering",
    students: 15,
    submitted: 0,
    checked: 2,
    assignedAt: "18 Fev, 2026 20:54",
    deadline: "19 Fev, 2026 12:54",
    lessonDate: "17 Fev, 2026",
    color: "bg-slate-200",
  },
  {
    id: 5,
    topic: "React Hooks",
    students: 15,
    submitted: 0,
    checked: 2,
    assignedAt: "18 Fev, 2026 20:53",
    deadline: "19 Fev, 2026 12:53",
    lessonDate: "18 Fev, 2026",
    color: "bg-slate-200",
  },
  {
    id: 6,
    topic: "React",
    students: 15,
    submitted: 0,
    checked: 2,
    assignedAt: "16 Fev, 2026 21:14",
    deadline: "17 Fev, 2026 13:14",
    lessonDate: "16 Fev, 2026",
    color: "bg-slate-200",
  },
];

function LessonModal({ open, onClose, darkMode, onSave }) {
  const [topicType, setTopicType] = useState("Boshqa");
  const [topic, setTopic] = useState("");

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      <div className="absolute left-1/2 top-1/2 w-[95%] max-w-5xl -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-white shadow-2xl overflow-hidden">
        <div className="px-5 sm:px-7 py-5 border-b border-slate-200 flex items-center justify-between gap-4">
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900">
            Yo‘qlama va mavzu kiritish
          </h2>

          <button
            onClick={onClose}
            className="w-10 h-10 rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-50"
          >
            ✕
          </button>
        </div>

        <div className="p-5 sm:p-7">
          <div className="flex flex-col sm:flex-row sm:items-center gap-5 sm:gap-8">
            {topicTypes.map((item) => (
              <label
                key={item}
                className={`flex items-center gap-3 text-sm sm:text-base cursor-pointer ${
                  topicType === item ? "text-emerald-500 font-medium" : "text-slate-400"
                }`}
              >
                <input
                  type="radio"
                  name="topicType"
                  checked={topicType === item}
                  onChange={() => setTopicType(item)}
                  className="w-4 h-4"
                />
                {item}
              </label>
            ))}
          </div>

          <div className="mt-10 max-w-xl">
            <label className="block text-sm font-semibold text-slate-800 mb-2">
              <span className="text-red-500 mr-1">*</span>Mavzu
            </label>

            <input
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="CRM frontend"
              className="w-full h-12 rounded-xl border border-slate-300 px-4 outline-none focus:border-emerald-500"
            />
          </div>
        </div>

        <div className="px-5 sm:px-7 py-4 border-t border-slate-200 flex flex-col-reverse sm:flex-row justify-end gap-3">
          <button
            onClick={onClose}
            className="px-5 py-3 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50"
          >
            Bekor qilish
          </button>

          <button
            onClick={() => {
              if (!topic.trim()) return;
              onSave(topic.trim());
              setTopic("");
              setTopicType("Boshqa");
            }}
            className="px-5 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-medium"
          >
            Saqlash
          </button>
        </div>
      </div>
    </div>
  );
}

export default function GroupLessonsPage() {
  const [darkMode] = useState(false);
  const [activeTopTab, setActiveTopTab] = useState("Guruh darsliklari");
  const [activeInnerTab, setActiveInnerTab] = useState("Uyga vazifa");
  const [showLessonModal, setShowLessonModal] = useState(false);
  const [lessons, setLessons] = useState(defaultLessons);

  const stats = useMemo(() => {
    return {
      totalStudents: lessons.reduce((a, b) => a + b.students, 0),
      totalSubmitted: lessons.reduce((a, b) => a + b.submitted, 0),
      totalChecked: lessons.reduce((a, b) => a + b.checked, 0),
    };
  }, [lessons]);

  const addLesson = (topic) => {
    const newLesson = {
      id: Date.now(),
      topic,
      students: 15,
      submitted: 0,
      checked: 0,
      assignedAt: "Bugun 10:00",
      deadline: "Ertaga 23:59",
      lessonDate: "Bugun",
      color: "bg-orange-400",
    };

    setLessons((prev) => [newLesson, ...prev]);
    setShowLessonModal(false);
  };

  return (
    <div className="min-h-screen w-full bg-slate-50 p-2 sm:p-4 lg:p-6 overflow-x-hidden">
      <div className="w-full max-w-[1600px] mx-auto rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="px-4 sm:px-6 lg:px-8 py-4 border-b border-slate-200 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="min-w-0">
            <div className="flex items-center gap-3 flex-wrap">
              <button className="w-9 h-9 rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-50">
                ←
              </button>

              <h1 className="text-lg sm:text-2xl font-bold text-slate-900 break-words">
                Bootcamp Full Stack (NodeJS+ReactJS) N25
              </h1>

              <span className="px-2.5 py-1 rounded-lg bg-emerald-100 text-emerald-600 text-xs font-semibold">
                Aktiv
              </span>
            </div>
          </div>

          <button className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 shrink-0">
            📊 Statistika
          </button>
        </div>

        <div className="px-4 sm:px-6 lg:px-8 pt-4 border-b border-slate-200">
          <div className="flex flex-wrap gap-4 sm:gap-8">
            {["Ma’lumotlar", "Guruh darsliklari", "Akademik davomat"].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTopTab(tab)}
                className={`pb-4 text-sm sm:text-base border-b-2 transition ${
                  activeTopTab === tab
                    ? "border-emerald-500 text-emerald-600 font-semibold"
                    : "border-transparent text-slate-500"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        <div className="px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4">
            <div className="flex flex-col md:flex-row md:items-center gap-4 md:gap-8 min-w-0">
              <h2 className="text-base font-semibold text-slate-900 shrink-0">
                Guruh darsliklari
              </h2>

              <div className="flex flex-wrap gap-2 sm:gap-3 min-w-0">
                {lessonTabs.map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveInnerTab(tab)}
                    className={`px-4 py-2 rounded-full text-sm border transition ${
                      activeInnerTab === tab
                        ? "border-pink-300 text-slate-900 shadow-sm"
                        : "border-transparent text-slate-500 hover:border-slate-200"
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={() => setShowLessonModal(true)}
              className="px-5 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-medium shrink-0"
            >
              Uyga vazifa qo‘shish
            </button>
          </div>

          <div className="mt-5 grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="rounded-2xl border border-slate-200 p-4">
              <p className="text-sm text-slate-500">Jami o‘quvchi</p>
              <p className="text-2xl font-bold text-slate-900 mt-2">
                {stats.totalStudents}
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 p-4">
              <p className="text-sm text-slate-500">Topshirganlar</p>
              <p className="text-2xl font-bold text-slate-900 mt-2">
                {stats.totalSubmitted}
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 p-4">
              <p className="text-sm text-slate-500">Tekshirilgan</p>
              <p className="text-2xl font-bold text-slate-900 mt-2">
                {stats.totalChecked}
              </p>
            </div>
          </div>

          <div className="mt-5 hidden xl:block rounded-2xl border border-slate-200 overflow-hidden">
            <table className="w-full text-sm table-fixed">
              <thead className="bg-slate-50">
                <tr className="text-slate-500">
                  <th className="text-left px-4 py-4 w-[50px]">#</th>
                  <th className="text-left px-4 py-4">Mavzu</th>
                  <th className="text-center px-3 py-4 w-[70px]">👤</th>
                  <th className="text-center px-3 py-4 w-[70px]">⏰</th>
                  <th className="text-center px-3 py-4 w-[70px]">✔</th>
                  <th className="text-left px-4 py-4 w-[150px]">Berilgan vaqt</th>
                  <th className="text-left px-4 py-4 w-[150px]">Tugash vaqti</th>
                  <th className="text-left px-4 py-4 w-[130px]">Dars sanasi</th>
                  <th className="text-right px-4 py-4 w-[60px]"></th>
                </tr>
              </thead>

              <tbody>
                {lessons.map((item, index) => (
                  <tr key={item.id} className="border-t border-slate-100 hover:bg-slate-50/80">
                    <td className="px-4 py-4 text-slate-700">{index + 1}</td>

                    <td className="px-4 py-4">
                      <div
                        className={`w-full rounded-lg px-3 py-1.5 text-white text-sm truncate ${
                          item.color === "bg-slate-200" ? "bg-slate-200 text-slate-700" : item.color
                        }`}
                        title={item.topic}
                      >
                        {item.topic}
                      </div>
                    </td>

                    <td className="px-3 py-4 text-center text-slate-700">{item.students}</td>
                    <td className="px-3 py-4 text-center text-slate-700">{item.submitted}</td>
                    <td className="px-3 py-4 text-center text-slate-700">{item.checked}</td>
                    <td className="px-4 py-4 text-slate-700">{item.assignedAt}</td>
                    <td className="px-4 py-4 text-slate-700">{item.deadline}</td>
                    <td className="px-4 py-4 text-slate-700">{item.lessonDate}</td>
                    <td className="px-4 py-4 text-right text-slate-400">⋮</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-5 grid grid-cols-1 lg:grid-cols-2 gap-4 xl:hidden">
            {lessons.map((item, index) => (
              <div
                key={item.id}
                className="rounded-2xl border border-slate-200 p-4 bg-white"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-xs text-slate-400 mb-2">#{index + 1}</p>
                    <div
                      className={`rounded-lg px-3 py-2 text-sm break-words ${
                        item.color === "bg-slate-200"
                          ? "bg-slate-200 text-slate-700"
                          : `${item.color} text-white`
                      }`}
                    >
                      {item.topic}
                    </div>
                  </div>

                  <button className="w-9 h-9 rounded-xl border border-slate-200 text-slate-400 shrink-0">
                    ⋮
                  </button>
                </div>

                <div className="mt-4 grid grid-cols-3 gap-3 text-center">
                  <div className="rounded-xl bg-slate-50 p-3">
                    <p className="text-xs text-slate-400">O‘quvchi</p>
                    <p className="font-semibold text-slate-800 mt-1">{item.students}</p>
                  </div>

                  <div className="rounded-xl bg-slate-50 p-3">
                    <p className="text-xs text-slate-400">Topshirgan</p>
                    <p className="font-semibold text-slate-800 mt-1">{item.submitted}</p>
                  </div>

                  <div className="rounded-xl bg-slate-50 p-3">
                    <p className="text-xs text-slate-400">Tekshirildi</p>
                    <p className="font-semibold text-slate-800 mt-1">{item.checked}</p>
                  </div>
                </div>

                <div className="mt-4 space-y-2 text-sm text-slate-700">
                  <div>
                    <span className="font-medium">Berilgan vaqt:</span> {item.assignedAt}
                  </div>
                  <div>
                    <span className="font-medium">Tugash vaqti:</span> {item.deadline}
                  </div>
                  <div>
                    <span className="font-medium">Dars sanasi:</span> {item.lessonDate}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <LessonModal
        open={showLessonModal}
        onClose={() => setShowLessonModal(false)}
        darkMode={darkMode}
        onSave={addLesson}
      />
    </div>
  );
}