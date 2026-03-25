import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { groupsApi } from "../../api/crmApi";
import { getAuthUserFromStorage } from "../../utils/authToken";
import StudentGroups from "./Groups";

const menuItems = [
  { key: "home", label: "Bosh sahifa", icon: "🏠" },
  { key: "groups", label: "Guruhlarim", icon: "👥" },
  { key: "settings", label: "Sozlamalar", icon: "⚙️" },
];

export default function StudentDashboardPage() {
  const navigate = useNavigate();
  const authUser = useMemo(() => getAuthUserFromStorage(), []);

  const [activeMenu, setActiveMenu] = useState("groups");
  const [groups, setGroups] = useState([]);
  const [groupsLoading, setGroupsLoading] = useState(false);
  const [selectedGroupId, setSelectedGroupId] = useState(null);
  const [lessonsByGroup, setLessonsByGroup] = useState({});
  const [lessonsLoading, setLessonsLoading] = useState(false);

  useEffect(() => {
    const loadGroups = async () => {
      try {
        setGroupsLoading(true);
        const result = await groupsApi.getAll();
        const list = Array.isArray(result?.data) ? result.data : [];
        setGroups(list);
      } catch {
        setGroups([]);
      } finally {
        setGroupsLoading(false);
      }
    };

    loadGroups();
  }, []);

  const loadLessons = async (groupId) => {
    if (!groupId) return;

    const key = String(groupId);
    if (Array.isArray(lessonsByGroup[key])) return;

    try {
      setLessonsLoading(true);
      const result = await groupsApi.getLessonsByGroup(groupId);
      setLessonsByGroup((prev) => ({
        ...prev,
        [key]: Array.isArray(result?.data) ? result.data : [],
      }));
    } catch {
      setLessonsByGroup((prev) => ({
        ...prev,
        [key]: [],
      }));
    } finally {
      setLessonsLoading(false);
    }
  };

  useEffect(() => {
    if (selectedGroupId) {
      loadLessons(selectedGroupId);
    }
  }, [selectedGroupId]);

  const handleLogout = () => {
    localStorage.removeItem("crm_access_token");
    navigate("/", { replace: true });
  };

  const selectedGroup = groups.find(
    (group) => Number(group.id) === Number(selectedGroupId),
  );

  return (
    <div className="min-h-screen bg-slate-100 flex">
      <aside className="w-72 bg-white border-r border-slate-200 p-5 flex flex-col gap-5">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Najot Ta'lim</h1>
          <p className="text-xs text-slate-500 mt-1">Student panel</p>
        </div>

        <nav className="space-y-2">
          {menuItems.map((item) => (
            <button
              key={item.key}
              onClick={() => setActiveMenu(item.key)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left cursor-pointer ${
                activeMenu === item.key
                  ? "bg-amber-100 text-amber-700"
                  : "text-slate-700 hover:bg-slate-100"
              }`}
            >
              <span>{item.icon}</span>
              <span className="font-medium">{item.label}</span>
            </button>
          ))}
        </nav>

        <button
          onClick={handleLogout}
          className="mt-auto rounded-xl bg-red-500 hover:bg-red-600 text-white py-2.5 cursor-pointer"
        >
          Chiqish
        </button>
      </aside>

      <main className="flex-1 p-6">
        {activeMenu === "home" && (
          <div className="rounded-2xl border border-slate-200 bg-white p-6">
            <h2 className="text-2xl font-bold text-slate-900">
              Salom, {authUser?.fullName || "Talaba"}
            </h2>
            <p className="text-slate-600 mt-2">
              Bu student uchun asosiy panel. Guruhlarim bo'limida darslaringizni
              ko'rishingiz mumkin.
            </p>
          </div>
        )}

        {activeMenu === "groups" &&
          (groupsLoading ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-6 text-slate-500">
              Guruhlar yuklanmoqda...
            </div>
          ) : (
            <StudentGroups
              groups={groups}
              selectedGroupId={selectedGroupId}
              lessonsByGroup={lessonsByGroup}
              lessonsLoading={lessonsLoading}
              onSelectGroup={(group) => {
                if (!group?.id) {
                  setSelectedGroupId(null);
                  return;
                }

                setSelectedGroupId(group.id);
                loadLessons(group.id);
              }}
              onClearSelection={() => setSelectedGroupId(null)}
              selectedGroup={selectedGroup}
            />
          ))}

        {activeMenu === "settings" && (
          <div className="rounded-2xl border border-slate-200 bg-white p-6">
            <h2 className="text-xl font-semibold text-slate-900">Sozlamalar</h2>
            <p className="text-slate-600 mt-2">
              Bu bo'lim keyingi bosqichda to'ldiriladi.
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
