import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { groupsApi, studentsApi } from "../../api/crmApi";
import StudentGroups from "./components/StudentGroups";
import StudentHome from "./components/StudentHome";
import StudentSettings from "./components/StudentSettings";
import StudentSidebar from "./components/StudentSidebar";
import "./StudentDashboard.css";

const MENU_PATHS = {
  home: "/student/dashboard",
  groups: "/student/groups",
  settings: "/student/settings",
};

const normalizeList = (value) => (Array.isArray(value) ? value : []);

export default function StudentDashboardPage({ initialMenu = "home" }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [activeMenu, setActiveMenu] = useState(initialMenu);
  const [profile, setProfile] = useState(null);
  const [groups, setGroups] = useState([]);
  const [groupsLoading, setGroupsLoading] = useState(false);
  const [lessons, setLessons] = useState([]);
  const [lessonsLoading, setLessonsLoading] = useState(false);
  const [lessonVideos, setLessonVideos] = useState([]);
  const [selectedGroupId, setSelectedGroupId] = useState(null);
  const [selectedLessonId, setSelectedLessonId] = useState(null);
  const [homeworksByLesson, setHomeworksByLesson] = useState({});
  const [homeworksLoading, setHomeworksLoading] = useState(false);

  useEffect(() => {
    if (location.pathname.includes("/student/groups")) {
      setActiveMenu("groups");
      return;
    }
    if (location.pathname.includes("/student/settings")) {
      setActiveMenu("settings");
      return;
    }
    setActiveMenu("home");
  }, [location.pathname]);

  useEffect(() => {
    let isMounted = true;
    const loadProfileAndGroups = async () => {
      setGroupsLoading(true);
      const [profileRes, groupsRes] = await Promise.allSettled([
        studentsApi.getMyProfile(),
        groupsApi.getAll(),
      ]);

      if (isMounted) {
        const profileData =
          profileRes.status === "fulfilled" ? profileRes.value?.data : null;
        setProfile(profileData || null);

        const groupList =
          groupsRes.status === "fulfilled"
            ? normalizeList(groupsRes.value?.data)
            : [];
        setGroups(groupList);
        setSelectedGroupId((prev) => prev ?? groupList[0]?.id ?? null);
        setGroupsLoading(false);
      }
    };

    loadProfileAndGroups();
    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    let isMounted = true;
    const loadGroupContent = async () => {
      if (!selectedGroupId) {
        setLessons([]);
        setLessonVideos([]);
        return;
      }

      setLessonsLoading(true);
      const [lessonsRes, videosRes] = await Promise.allSettled([
        groupsApi.getLessonsByGroup(selectedGroupId),
        studentsApi.getMyGroupLessonVideo(selectedGroupId),
      ]);

      if (isMounted) {
        const nextLessons =
          lessonsRes.status === "fulfilled"
            ? normalizeList(lessonsRes.value?.data)
            : [];
        setLessons(nextLessons);
        setSelectedLessonId((prev) => {
          if (prev && nextLessons.some((lesson) => lesson?.id === prev)) {
            return prev;
          }
          return nextLessons[0]?.id ?? null;
        });

        const nextVideos =
          videosRes.status === "fulfilled"
            ? normalizeList(videosRes.value?.data)
            : [];
        setLessonVideos(nextVideos);
        setLessonsLoading(false);
      }
    };

    loadGroupContent();
    return () => {
      isMounted = false;
    };
  }, [selectedGroupId]);

  useEffect(() => {
    let isMounted = true;
    const loadHomeworks = async () => {
      if (!selectedGroupId || lessons.length === 0) {
        setHomeworksByLesson({});
        return;
      }

      setHomeworksLoading(true);
      const results = await Promise.allSettled(
        lessons.map((lesson) =>
          studentsApi
            .getMyGroupHomework(selectedGroupId, lesson.id)
            .then((res) => res?.data || null),
        ),
      );

      if (isMounted) {
        const nextMap = {};
        results.forEach((result, index) => {
          const lessonId = lessons[index]?.id;
          if (!lessonId) return;
          nextMap[lessonId] =
            result.status === "fulfilled" ? result.value : null;
        });
        setHomeworksByLesson(nextMap);
        setHomeworksLoading(false);
      }
    };

    loadHomeworks();
    return () => {
      isMounted = false;
    };
  }, [selectedGroupId, lessons]);

  const selectedGroup = useMemo(
    () => groups.find((group) => group?.id === selectedGroupId) || null,
    [groups, selectedGroupId],
  );

  const selectedLesson = useMemo(
    () => lessons.find((lesson) => lesson?.id === selectedLessonId) || null,
    [lessons, selectedLessonId],
  );

  const videoCountByLesson = useMemo(() => {
    return lessonVideos.reduce((acc, item) => {
      const lessonId = item?.lesson?.id;
      if (!lessonId) return acc;
      acc[lessonId] = (acc[lessonId] || 0) + 1;
      return acc;
    }, {});
  }, [lessonVideos]);

  const handleMenuChange = (menu) => {
    setActiveMenu(menu);
    navigate(MENU_PATHS[menu] || MENU_PATHS.home);
  };

  return (
    <div className="student-dashboard">
      <StudentSidebar activeMenu={activeMenu} onSelect={handleMenuChange} />
      <main className="student-main">
        {activeMenu === "home" && (
          <StudentHome
            groups={groups}
            lessons={lessons}
            selectedGroup={selectedGroup}
            groupsLoading={groupsLoading}
            lessonsLoading={lessonsLoading}
          />
        )}
        {activeMenu === "groups" && (
          <StudentGroups
            groups={groups}
            groupsLoading={groupsLoading}
            selectedGroupId={selectedGroupId}
            onSelectGroup={setSelectedGroupId}
            lessons={lessons}
            lessonsLoading={lessonsLoading}
            selectedLessonId={selectedLessonId}
            onSelectLesson={setSelectedLessonId}
            selectedLesson={selectedLesson}
            videoCountByLesson={videoCountByLesson}
            lessonVideos={lessonVideos}
            homeworksByLesson={homeworksByLesson}
            homeworksLoading={homeworksLoading}
          />
        )}
        {activeMenu === "settings" && <StudentSettings profile={profile} />}
      </main>
    </div>
  );
}
