import { useEffect, useState } from "react";
import StudentGroups from "./Groups";

export default function StudentDashboard({ onClose }) {
  const [activeTab, setActiveTab] = useState("home");
  const [groups, setGroups] = useState([]);
  const [groupsLoading, setGroupsLoading] = useState(false);

  const navigationItems = [
    { key: "home", label: "Bosh sahifa", icon: "🏠" },
    { key: "groups", label: "Guruhlarim", icon: "👥" },
    { key: "settings", label: "Sozlamalar", icon: "⚙️" },
  ];

  const renderContent = () => {
    if (activeTab === "groups") {
      return <StudentGroups groups={groups} />;
    }

    if (activeTab === "settings") {
      return (
        <div className="text-slate-600">
          <h2 className="text-xl font-semibold mb-4">Sozlamalar</h2>
          <p>Sozlamalar tez orada qo'shiladi</p>
        </div>
      );
    }

    return (
      <div className="mt-6 rounded-2xl border border-green-200 bg-green-50 p-6">
        <div className="flex items-center gap-3">
          <span className="text-3xl">✅</span>
          <div>
            <p className="font-semibold text-green-900">
              Uyga vazifangiz muvaffaqiyatli yuborildi!
            </p>
            <p className="text-sm text-green-700 mt-1">
              O'qituvchi tez orada tekshirib, bahoni beradi.
            </p>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-slate-100 z-50 flex overflow-hidden">
      {/* Sidebar */}
      <div className="w-56 bg-white border-r border-slate-200 overflow-y-auto">
        <div className="p-4 border-b border-slate-200">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-white font-bold text-lg">
              A
            </div>
            <div>
              <p className="font-semibold text-slate-900">Abduloshim</p>
              <p className="text-xs text-slate-500">Talaba</p>
            </div>
          </div>
        </div>

        <nav className="space-y-1 p-3">
          {navigationItems.map((item) => (
            <button
              key={item.key}
              onClick={() => setActiveTab(item.key)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition ${
                activeTab === item.key
                  ? "bg-amber-50 text-amber-700 border border-amber-200"
                  : "text-slate-700 hover:bg-slate-50"
              }`}
            >
              <span className="text-lg">{item.icon}</span>
              <span>{item.label}</span>
            </button>
          ))}
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-slate-200 p-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-slate-900">
            {activeTab === "home" && "Bosh sahifa"}
            {activeTab === "groups" && "Guruhlarim"}
            {activeTab === "settings" && "Sozlamalar"}
          </h1>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-slate-100 transition"
          >
            ✕
          </button>
        </div>

        <div className="p-6 max-w-6xl">{renderContent()}</div>
      </div>
    </div>
  );
}
