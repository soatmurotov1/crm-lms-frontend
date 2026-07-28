import { lazy, Suspense, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import PanelLayout from "../../components/layout/PanelLayout";
import Card from "../../components/ui/Card";
import ChartFallback from "../../components/ui/ChartFallback";
import ListCard from "../../components/ui/ListCard";
import PlaceholderSection from "../../components/ui/PlaceholderSection";
import SectionHeader from "../../components/ui/SectionHeader";
import StatCard from "../../components/ui/StatCard";
import NotificationsSection from "../../components/notifications/NotificationsSection";
import PaymentsPage from "../AdminPages/PaymentsPage";
import EmployeesPage from "../AdminPages/XodimlarPage";
import OrganizationsPage from "./OrganizationsPage";
import PlansPage from "./PlansPage";
import SupportPage from "./SupportPage";
import {
  groupsApi,
  organizationsApi,
  paymentsApi,
  studentsApi,
  subscriptionsApi,
  supportApi,
  teachersApi,
  usersApi,
} from "../../api/crmApi";
import { formatUzDate } from "../../utils/date";
import { getAuthUserFromStorage } from "../../utils/authToken";
import { useTheme } from "../../theme/themeContext";

const RevenueLineChart = lazy(
  () => import("../../components/charts/RevenueLineChart"),
);
const DonutChart = lazy(() => import("../../components/charts/DonutChart"));

const MENU_ITEMS = [
  {
    key: "dashboard",
    label: "Boshqaruv paneli",
    shortLabel: "Asosiy",
    icon: "🏠",
  },
  { key: "organizations", label: "Tashkilotlar", icon: "🏢" },
  {
    key: "users",
    label: "Foydalanuvchilar",
    shortLabel: "Userlar",
    icon: "👥",
  },
  {
    key: "plans",
    label: "Tariflar va obunalar",
    shortLabel: "Tariflar",
    icon: "💎",
  },
  { key: "payments", label: "To'lovlar", icon: "💳" },
  { key: "reports", label: "Hisobotlar", icon: "📊" },
  { key: "settings", label: "Tizim sozlamalari", icon: "⚙️" },
  { key: "notifications", label: "Xabarnomalar", icon: "🔔" },
  { key: "support", label: "Qo'llab-quvvatlash", icon: "🛟" },
];

const formatUzs = (value) =>
  `${new Intl.NumberFormat("uz-UZ").format(Number(value || 0))} so'm`;

const formatNumber = (value) =>
  new Intl.NumberFormat("uz-UZ").format(Number(value || 0));

const toList = (result) =>
  result?.status === "fulfilled" && Array.isArray(result.value?.data)
    ? result.value.data
    : [];

export default function SuperAdminDashboard({ initialMenu = "dashboard" }) {
  const navigate = useNavigate();
  const { theme, darkMode } = useTheme();
  const [activeMenu, setActiveMenu] = useState(initialMenu);
  const [loading, setLoading] = useState(true);

  const [students, setStudents] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [users, setUsers] = useState([]);
  const [groups, setGroups] = useState([]);
  const [revenueMonths, setRevenueMonths] = useState([]);
  const [monthlyPayments, setMonthlyPayments] = useState([]);
  const [organizations, setOrganizations] = useState([]);
  const [subscriptions, setSubscriptions] = useState([]);
  const [subscriptionSummary, setSubscriptionSummary] = useState(null);
  const [supportSummary, setSupportSummary] = useState(null);

  const authUser = useMemo(() => getAuthUserFromStorage(), []);

  useEffect(() => {
    setActiveMenu(initialMenu);
  }, [initialMenu]);

  useEffect(() => {
    let isMounted = true;
    const now = new Date();

    const loadAll = async () => {
      setLoading(true);

      const [
        studentsRes,
        teachersRes,
        usersRes,
        groupsRes,
        yearlyRes,
        monthlyRes,
        organizationsRes,
        subscriptionsRes,
        subscriptionSummaryRes,
        supportSummaryRes,
      ] = await Promise.allSettled([
        studentsApi.getAll(),
        teachersApi.getAll(),
        usersApi.getAll(),
        groupsApi.getAll("ALL"),
        paymentsApi.getYearlySummary({ year: now.getFullYear() }),
        paymentsApi.getMonthlyList({
          year: now.getFullYear(),
          month: now.getMonth() + 1,
        }),
        organizationsApi.getAll("ALL"),
        subscriptionsApi.getAll(),
        subscriptionsApi.getSummary(),
        supportApi.getSummary(),
      ]);

      if (!isMounted) return;

      const groupList = toList(groupsRes);

      setStudents(toList(studentsRes));
      setTeachers(toList(teachersRes));
      setUsers(toList(usersRes));
      setGroups(groupList);
      setOrganizations(toList(organizationsRes));
      setSubscriptions(toList(subscriptionsRes));

      if (subscriptionSummaryRes.status === "fulfilled") {
        setSubscriptionSummary(subscriptionSummaryRes.value?.data ?? null);
      }

      if (supportSummaryRes.status === "fulfilled") {
        setSupportSummary(supportSummaryRes.value?.data ?? null);
      }

      if (yearlyRes.status === "fulfilled") {
        const payload = yearlyRes.value?.data ?? yearlyRes.value ?? {};
        setRevenueMonths(Array.isArray(payload?.months) ? payload.months : []);
      }

      if (monthlyRes.status === "fulfilled") {
        const payload = monthlyRes.value;
        setMonthlyPayments(
          Array.isArray(payload)
            ? payload
            : Array.isArray(payload?.data)
              ? payload.data
              : [],
        );
      }

      setLoading(false);
    };

    loadAll();
    return () => {
      isMounted = false;
    };
  }, []);

  const totalRevenue = useMemo(
    () =>
      revenueMonths.reduce((sum, month) => sum + Number(month?.paid || 0), 0),
    [revenueMonths],
  );

  const activeGroups = useMemo(
    () => groups.filter((group) => group.status === "ACTIVE"),
    [groups],
  );

  const totalUsers = users.length + teachers.length + students.length;

  const pendingPayments = useMemo(
    () => monthlyPayments.filter((item) => item.status === "PENDING"),
    [monthlyPayments],
  );

  const canceledPayments = useMemo(
    () => monthlyPayments.filter((item) => item.status === "CANCELED"),
    [monthlyPayments],
  );

  // Tariflar bo'yicha taqsimot — har bir tarifga tegishli obunalar soni.
  const planSlices = useMemo(() => {
    const byPlan = {};

    subscriptions.forEach((subscription) => {
      const planName = subscription.plan?.name;
      if (!planName) return;
      byPlan[planName] = (byPlan[planName] || 0) + 1;
    });

    return Object.entries(byPlan)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [subscriptions]);

  const activeSubscriptions = useMemo(
    () =>
      subscriptions.filter(
        (subscription) => subscription.status === "ACTIVE",
      ),
    [subscriptions],
  );

  const subscriptionItems = useMemo(
    () =>
      activeSubscriptions.map((subscription) => ({
        id: subscription.id,
        title: subscription.organization?.name || "Tashkilot",
        meta: `${subscription.plan?.name || "Tarif"} · ${formatUzs(
          subscription.amount,
        )} · ${formatUzDate(subscription.endDate)} gacha`,
        badge: "Faol",
        tone: "emerald",
        icon: "💎",
      })),
    [activeSubscriptions],
  );

  const organizationItems = useMemo(
    () =>
      organizations.map((organization) => ({
        id: organization.id,
        title: organization.name,
        meta: `${
          organization.activeSubscription?.plan?.name || "Obuna yo'q"
        } · ${formatNumber(
          organization._count?.subscriptions || 0,
        )} obuna · ${organization.phone || "Telefon yo'q"}`,
        badge: organization.status === "ACTIVE" ? "Faol" : "Nofaol",
        tone: organization.status === "ACTIVE" ? "violet" : "slate",
        icon: "🏢",
      })),
    [organizations],
  );

  const handleLogout = () => {
    localStorage.removeItem("crm_access_token");
    navigate("/", { replace: true });
  };

  const renderOverview = () => (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5 mb-8">
        <StatCard
          icon="🏢"
          tone="violet"
          label="Jami tashkilotlar"
          value={
            loading
              ? "..."
              : formatNumber(
                  subscriptionSummary?.organizations ?? organizations.length,
                )
          }
        />
        <StatCard
          icon="💎"
          tone="blue"
          label="Faol obunalar"
          value={
            loading
              ? "..."
              : formatNumber(
                  subscriptionSummary?.ACTIVE ?? activeSubscriptions.length,
                )
          }
          deltaLabel={
            subscriptionSummary?.expiringSoon
              ? `${formatNumber(subscriptionSummary.expiringSoon)} tasi 7 kunda tugaydi`
              : undefined
          }
        />
        <StatCard
          icon="🛟"
          tone="amber"
          label="Ochiq murojaatlar"
          value={loading ? "..." : formatNumber(supportSummary?.OPEN ?? 0)}
          deltaLabel={
            supportSummary?.total
              ? `Jami ${formatNumber(supportSummary.total)} ta`
              : undefined
          }
        />
        <StatCard
          icon="💰"
          tone="emerald"
          label="Jami daromad"
          value={loading ? "..." : formatUzs(totalRevenue)}
          deltaLabel={`${new Date().getFullYear()}-yil`}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-8">
        <StatCard
          icon="👥"
          tone="blue"
          label="Jami foydalanuvchilar"
          value={loading ? "..." : formatNumber(totalUsers)}
        />
        <StatCard
          icon="🎓"
          tone="emerald"
          label="Jami o'quvchilar"
          value={loading ? "..." : formatNumber(students.length)}
        />
        <StatCard
          icon="📚"
          tone="violet"
          label="Faol guruhlar"
          value={loading ? "..." : formatNumber(activeGroups.length)}
        />
      </div>

      <div className="grid gap-5 xl:grid-cols-3 mb-8">
        <Card className="xl:col-span-2">
          <SectionHeader
            title="Daromad statistikasi"
            subtitle={`${new Date().getFullYear()}-yil, oylar kesimida`}
          />
          <Suspense fallback={<ChartFallback height={260} />}>
            <RevenueLineChart months={revenueMonths} />
          </Suspense>
        </Card>

        <Card>
          <SectionHeader
            title="Tariflar bo'yicha taqsimot"
            subtitle="Tarif kesimida obunalar soni"
          />
          <Suspense fallback={<ChartFallback height={220} />}>
            <DonutChart
              slices={planSlices}
              emptyText="Obuna topilmadi"
              formatValue={(value) => `${formatNumber(value)} ta`}
            />
          </Suspense>
        </Card>
      </div>

      <div className="grid gap-5 md:grid-cols-2">
        <ListCard
          title="Tashkilotlar"
          subtitle="Tizimga ulangan o'quv markazlari"
          items={organizationItems}
          loading={loading}
          emptyText="Tashkilot qo'shilmagan"
          maxHeight={280}
        />

        <ListCard
          title="Faol obunalar"
          subtitle="Tashkilotlarning amaldagi tarif obunalari"
          items={subscriptionItems}
          loading={loading}
          emptyText="Faol obuna yo'q"
          maxHeight={280}
        />

        <ListCard
          title="Kutilayotgan to'lovlar"
          subtitle="Joriy oy — tasdiqlanishi kutilmoqda"
          items={pendingPayments.map((item, index) => ({
            id: item.paymentId || `${item.studentId}-${item.groupId}-${index}`,
            title: item.studentName,
            meta: `${item.groupName} · ${formatUzs(item.amount)}`,
            badge: "Kutilmoqda",
            tone: "amber",
            icon: "⏳",
          }))}
          loading={loading}
          emptyText="Kutilayotgan to'lov yo'q"
          maxHeight={280}
        />

        <ListCard
          title="Bekor qilingan obunalar"
          subtitle="Joriy oyda bekor qilingan to'lovlar"
          items={canceledPayments.map((item, index) => ({
            id: item.paymentId || `${item.studentId}-${item.groupId}-${index}`,
            title: item.studentName,
            meta: `${item.groupName} · ${formatUzs(item.amount)}`,
            badge: "Bekor qilingan",
            tone: "rose",
            icon: "🚫",
          }))}
          loading={loading}
          emptyText="Bekor qilingan obuna yo'q"
          maxHeight={280}
        />
      </div>
    </>
  );

  const renderReports = () => (
    <div className="space-y-5">
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
        <StatCard
          icon="💰"
          tone="emerald"
          label="Yillik daromad"
          value={formatUzs(totalRevenue)}
        />
        <StatCard
          icon="📚"
          tone="violet"
          label="Faol guruhlar"
          value={formatNumber(activeGroups.length)}
        />
        <StatCard
          icon="🎓"
          tone="blue"
          label="O'quvchilar"
          value={formatNumber(students.length)}
        />
        <StatCard
          icon="👨‍🏫"
          tone="amber"
          label="O'qituvchilar"
          value={formatNumber(teachers.length)}
        />
      </div>

      <Card>
        <SectionHeader
          title="Daromad statistikasi"
          subtitle={`${new Date().getFullYear()}-yil, oylar kesimida`}
        />
        <Suspense fallback={<ChartFallback height={260} />}>
          <RevenueLineChart months={revenueMonths} />
        </Suspense>
      </Card>

      <Card>
        <SectionHeader
          title="Tariflar bo'yicha taqsimot"
          subtitle="Kurs (tarif) bo'yicha obunachi o'quvchilar"
        />
        <Suspense fallback={<ChartFallback height={220} />}>
          <DonutChart
            slices={planSlices}
            emptyText="Obunachi o'quvchilar topilmadi"
            formatValue={(value) => `${formatNumber(value)} ta`}
          />
        </Suspense>
      </Card>
    </div>
  );

  const renderContent = () => {
    if (activeMenu === "dashboard") return renderOverview();

    if (activeMenu === "organizations") return <OrganizationsPage />;

    if (activeMenu === "users") {
      return <EmployeesPage theme={theme} darkMode={darkMode} />;
    }

    if (activeMenu === "plans") return <PlansPage />;

    if (activeMenu === "payments") {
      return <PaymentsPage theme={theme} darkMode={darkMode} />;
    }

    if (activeMenu === "reports") return renderReports();

    if (activeMenu === "settings") {
      return (
        <PlaceholderSection
          icon="⚙️"
          title="Tizim sozlamalari"
          description="Butun platforma uchun umumiy sozlamalar bo'limi."
          points={[
            "Tashkilot nomi, logotipi va aloqa ma'lumotlari",
            "SMS provayderi va xabarnoma shablonlari",
            "To'lov tizimlari (Payme, Click) kalitlari",
            "Rollar va ruxsatlar matritsasi",
          ]}
          note="Backend'da settings endpointlari qo'shilganda shu bo'lim real ma'lumot bilan to'ldiriladi."
        />
      );
    }

    if (activeMenu === "notifications") {
      return (
        <NotificationsSection
          canSend
          canViewAll
          canDelete
          groups={groups}
          subtitle="Tizim bo'ylab xabarnomalarni yuborish va tarixi"
        />
      );
    }

    if (activeMenu === "support") return <SupportPage />;

    return null;
  };

  return (
    <PanelLayout
      brand="EduCenter"
      menuItems={MENU_ITEMS}
      activeKey={activeMenu}
      onSelect={setActiveMenu}
      greeting="Xush kelibsiz, Super Admin"
      subtitle={MENU_ITEMS.find((item) => item.key === activeMenu)?.label}
      user={authUser}
      roleLabel="SUPERADMIN"
      onLogout={handleLogout}
    >
      {renderContent()}
    </PanelLayout>
  );
}
