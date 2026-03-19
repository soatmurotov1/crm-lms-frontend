import { useState } from "react";

const homeworks = [
  {
    id: 1,
    title: "crm continue backend finish",
    total: 15,
    submitted: 11,
    checked: 0,
    assignedAt: "10 Mart, 2026 09:30",
    deadline: "11 Mart, 2026 01:30",
    lessonDate: "09 Mart, 2026",
  },
  {
    id: 2,
    title: "crm project continue",
    total: 15,
    submitted: 11,
    checked: 0,
    assignedAt: "04 Mart, 2026 21:39",
    deadline: "05 Mart, 2026 13:39",
    lessonDate: "04 Mart, 2026",
  },
  {
    id: 3,
    title: "React continue, nested route, NavLink",
    total: 15,
    submitted: 12,
    checked: 0,
    assignedAt: "25 Fev, 2026 23:10",
    deadline: "26 Fev, 2026 15:10",
    lessonDate: "25 Fev, 2026",
  },
  {
    id: 4,
    title: "React+vite+tailwind and props, list keys, conditional rendering",
    total: 15,
    submitted: 0,
    checked: 2,
    assignedAt: "18 Fev, 2026 20:54",
    deadline: "19 Fev, 2026 12:54",
    lessonDate: "17 Fev, 2026",
  },
];

export default function GroupHomeworkPage() {
  const [activeMainTab, setActiveMainTab] = useState("malumotlar");
  const [activeLessonTab, setActiveLessonTab] = useState("uyga-vazifa");

  return (
    <div className="min-h-screen bg-[#f6f8f7] flex">
      {/* Sidebar */}
      <aside className="w-[240px] bg-white border-r border-gray-200 min-h-screen">
        <div className="px-5 py-4 border-b border-gray-100">
          <h2 className="text-[18px] font-semibold text-gray-800">Guruhlar</h2>
        </div>

        <nav className="p-3">
          <button className="w-full text-left px-4 py-3 rounded-xl bg-emerald-50 text-emerald-600 font-medium">
            Guruhlar
          </button>
        </nav>
      </aside>

      {/* Content */}
      <main className="flex-1 p-6">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          {/* Top */}
          <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button className="text-xl text-gray-500 hover:text-black">‹</button>
              <div className="flex items-center gap-3">
                <h1 className="text-[26px] font-semibold text-gray-900">
                  Bootcamp Full Stack (NodeJS+ReactJS) N25
                </h1>
                <span className="px-3 py-1 rounded-full text-sm bg-green-100 text-green-700">
                  Aktiv
                </span>
              </div>
            </div>

            <button className="px-4 py-2 rounded-xl border border-gray-200 text-sm text-gray-700 hover:bg-gray-50">
              Statistika
            </button>
          </div>

          {/* Main tabs */}
          <div className="px-6 pt-4 border-b border-gray-100">
            <div className="flex gap-8">
              <button
                onClick={() => setActiveMainTab("malumotlar")}
                className={`pb-3 text-sm font-medium border-b-2 ${
                  activeMainTab === "malumotlar"
                    ? "border-emerald-500 text-emerald-600"
                    : "border-transparent text-gray-500"
                }`}
              >
                Ma&apos;lumotlar
              </button>

              <button
                onClick={() => setActiveMainTab("guruh-darsliklari")}
                className={`pb-3 text-sm font-medium border-b-2 ${
                  activeMainTab === "guruh-darsliklari"
                    ? "border-emerald-500 text-emerald-600"
                    : "border-transparent text-gray-500"
                }`}
              >
                Guruh darsliklari
              </button>
            </div>
          </div>

          {/* Page body */}
          {activeMainTab === "malumotlar" ? (
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-3">
                Ma&apos;lumotlar
              </h3>
              <div className="rounded-2xl border border-gray-200 p-5 bg-gray-50">
                <p className="text-gray-600">
                  Bu yerda guruh haqida ma&apos;lumotlar chiqadi.
                </p>
              </div>
            </div>
          ) : (
            <div className="p-6">
              {/* Only one lesson subtab */}
              <div className="flex items-center justify-between mb-5">
                <div className="flex gap-3">
                  <button
                    onClick={() => setActiveLessonTab("uyga-vazifa")}
                    className={`px-5 py-2 rounded-full text-sm font-medium ${
                      activeLessonTab === "uyga-vazifa"
                        ? "bg-white border-2 border-pink-300 text-gray-900"
                        : "bg-gray-100 text-gray-500"
                    }`}
                  >
                    Uyga vazifa
                  </button>
                </div>

                <button className="px-5 py-2.5 rounded-xl bg-emerald-500 text-white text-sm font-medium hover:bg-emerald-600">
                  Uyga vazifa qo&apos;shish
                </button>
              </div>

              {/* Table */}
              <div className="overflow-x-auto">
                <table className="w-full min-w-[900px]">
                  <thead>
                    <tr className="text-left text-sm text-gray-500 border-b border-gray-100">
                      <th className="py-3 px-3 w-[50px]">#</th>
                      <th className="py-3 px-3">Mavzu</th>
                      <th className="py-3 px-3 text-center">👤</th>
                      <th className="py-3 px-3 text-center">⏱</th>
                      <th className="py-3 px-3 text-center">🟢</th>
                      <th className="py-3 px-3">Berilgan vaqt</th>
                      <th className="py-3 px-3">Tugash vaqti</th>
                      <th className="py-3 px-3">Dars sanasi</th>
                    </tr>
                  </thead>

                  <tbody>
                    {homeworks.map((item) => (
                      <tr
                        key={item.id}
                        className="border-b border-gray-100 hover:bg-gray-50"
                      >
                        <td className="py-4 px-3 text-sm text-gray-700">
                          {item.id}
                        </td>

                        <td className="py-4 px-3">
                          <div
                            className={`rounded-md px-3 py-2 text-sm ${
                              item.id <= 3
                                ? "bg-[#ff7b57] text-white"
                                : "text-gray-800"
                            }`}
                          >
                            {item.title}
                          </div>
                        </td>

                        <td className="py-4 px-3 text-center text-sm text-gray-700">
                          {item.total}
                        </td>
                        <td className="py-4 px-3 text-center text-sm text-gray-700">
                          {item.submitted}
                        </td>
                        <td className="py-4 px-3 text-center text-sm text-gray-700">
                          {item.checked}
                        </td>
                        <td className="py-4 px-3 text-sm text-gray-700">
                          {item.assignedAt}
                        </td>
                        <td className="py-4 px-3 text-sm text-gray-700">
                          {item.deadline}
                        </td>
                        <td className="py-4 px-3 text-sm text-gray-700">
                          {item.lessonDate}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}