import { useEffect, useMemo, useState } from "react";
import { groupsApi, teachersApi } from "../../api/crmApi";
import { getAuthUserFromStorage } from "../../utils/authToken";
import { formatUzDate } from "../../utils/date";
import { getInitials } from "../StudentPages/studentDashboardUtils";
import StudentSettings from "../StudentPages/components/StudentSettings";
import PasswordModal from "../StudentPages/components/PasswordModal";
import "../StudentPages/StudentDashboard.css";

const validatePassword = (form) => {
  const errors = {};
  if (!form.current) {
    errors.current = "Amaldagi parolni kiriting";
  }
  if (!form.next) {
    errors.next = "Yangi parolni kiriting";
  } else if (String(form.next).length < 8) {
    errors.next = "Parol kamida 8 ta belgidan iborat bo'lsin";
  }
  if (!form.confirm) {
    errors.confirm = "Parolni tasdiqlang";
  } else if (form.confirm !== form.next) {
    errors.confirm = "Parollar mos emas";
  }
  return errors;
};

export default function TeacherSettings({ darkMode = false }) {
  const authUser = useMemo(() => getAuthUserFromStorage(), []);
  const [profile, setProfile] = useState(null);
  const [primaryGroupName, setPrimaryGroupName] = useState("-");
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    current: "",
    next: "",
    confirm: "",
  });
  const [passwordErrors, setPasswordErrors] = useState({});
  const [showPassword, setShowPassword] = useState({
    current: false,
    next: false,
    confirm: false,
  });
  const [passwordSaving, setPasswordSaving] = useState(false);

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const [profileResult, groupsResult] = await Promise.allSettled([
          teachersApi.getMyProfile(),
          groupsApi.getAll({ status: "ALL" }),
        ]);

        const profileData =
          profileResult.status === "fulfilled"
            ? profileResult.value?.data || profileResult.value
            : null;
        const groupsList =
          groupsResult.status === "fulfilled" &&
          Array.isArray(groupsResult.value?.data)
            ? groupsResult.value.data
            : [];

        setProfile(profileData || authUser || null);
        setPrimaryGroupName(groupsList[0]?.name || "-");
      } catch {
        setProfile(authUser || null);
        setPrimaryGroupName("-");
      }
    };

    loadProfile();
  }, [authUser]);

  const handlePasswordChange = (field, value) => {
    setPasswordForm((prev) => {
      const next = { ...prev, [field]: value };
      setPasswordErrors(validatePassword(next));
      return next;
    });
  };

  const handlePasswordSave = async () => {
    const errors = validatePassword(passwordForm);
    setPasswordErrors(errors);
    if (Object.keys(errors).length > 0) return;

    setPasswordSaving(true);
    try {
      await teachersApi.changeMyPassword({
        oldPassword: passwordForm.current,
        newPassword: passwordForm.next,
      });
      setShowPasswordModal(false);
      setPasswordForm({ current: "", next: "", confirm: "" });
      setPasswordErrors({});
    } catch {
      setPasswordErrors((prev) => ({
        ...prev,
        current: "Parolni yangilab bo'lmadi",
      }));
    } finally {
      setPasswordSaving(false);
    }
  };

  const profileName = profile?.fullName || authUser?.fullName || "O'qituvchi";
  const profileEmail = profile?.email || authUser?.email || "-";

  return (
    <>
      <StudentSettings
        profileName={profileName}
        profileEmail={profileEmail}
        profile={profile}
        primaryGroupName={primaryGroupName}
        identityMode="full"
        fullNameLabel="Full name"
        contactLabel="Email"
        contactValue={profileEmail}
        darkMode={darkMode}
        onOpenPassword={() => setShowPasswordModal(true)}
        formatDate={formatUzDate}
        getInitials={getInitials}
        roleLabel="Teacher"
      />
      {showPasswordModal && (
        <PasswordModal
          form={passwordForm}
          errors={passwordErrors}
          showPassword={showPassword}
          onClose={() => setShowPasswordModal(false)}
          onChange={handlePasswordChange}
          onToggle={(field) =>
            setShowPassword((prev) => ({ ...prev, [field]: !prev[field] }))
          }
          onSubmit={handlePasswordSave}
          saving={passwordSaving}
        />
      )}
    </>
  );
}
