// Login paints before i18next loads, so keep this critical-path copy small.
const LOGIN_LANGS = ['uz', 'ru', 'en'] as const;
export type LoginLang = (typeof LOGIN_LANGS)[number];

export type LoginCopy = {
  appTitle: string;
  themeDark: string;
  themeLight: string;
  required: string;
  showPassword: string;
  hidePassword: string;
  workspaceLabel: string;
  workspaceTitle: string;
  workspaceDescription: string;
  formDescription: string;
  title: string;
  emailLabel: string;
  emailPlaceholder: string;
  passwordLabel: string;
  passwordPlaceholder: string;
  submit: string;
  submitting: string;
  success: string;
  error: string;
  rateLimit: string;
  networkError: string;
  companyInactive: string;
  tabStaff: string;
  tabStudent: string;
  phoneLabel: string;
  phonePlaceholder: string;
  studentDescription: string;
  studentError: string;
  studentClosed: string;
};

const copy: Record<LoginLang, LoginCopy> = {
  uz: {
    appTitle: 'EduLMS',
    themeDark: 'Tungi rejim',
    themeLight: "Yorug' rejim",
    required: 'Majburiy',
    showPassword: "Parolni ko'rsatish",
    hidePassword: 'Parolni yashirish',
    workspaceLabel: "Ta'lim boshqaruv platformasi (LMS)",
    workspaceTitle: "O'quv markazingiz. Bitta tizimda.",
    workspaceDescription:
      'Kurslar, darslar, topshiriqlar, testlar va o‘quvchilar progressi — barchasi bir joyda.',
    formDescription: 'Davom etish uchun hisobingizga kiring.',
    title: 'Tizimga kirish',
    emailLabel: 'Email',
    emailPlaceholder: 'Email manzilingiz',
    passwordLabel: 'Parol',
    passwordPlaceholder: 'Parolingiz',
    submit: 'Kirish',
    submitting: 'Kirilmoqda...',
    success: 'Tizimga muvaffaqiyatli kirdingiz!',
    error: "Email yoki parol noto'g'ri",
    rateLimit: "Ko'p urinishlar. Iltimos 1 daqiqa kuting.",
    networkError: "Server bilan ulanish yo'q.",
    companyInactive:
      "Kompaniyangiz hali faollashtirilmagan. Administrator bilan bog'laning.",
    tabStaff: 'Xodim',
    tabStudent: "O'quvchi",
    phoneLabel: 'Telefon raqam',
    phonePlaceholder: '+998 90 123 45 67',
    studentDescription:
      "O'quvchi kabinetiga kiring. Parolni o'quv markazingiz beradi.",
    studentError: 'Telefon raqam yoki parol xato',
    studentClosed: "O'quvchi kabineti vaqtincha yopilgan.",
  },
  ru: {
    appTitle: 'EduLMS',
    themeDark: 'Тёмная тема',
    themeLight: 'Светлая тема',
    required: 'Обязательно',
    showPassword: 'Показать пароль',
    hidePassword: 'Скрыть пароль',
    workspaceLabel: 'Платформа управления обучением (LMS)',
    workspaceTitle: 'Ваш учебный центр. Одна система.',
    workspaceDescription:
      'Курсы, уроки, задания, тесты и прогресс учеников — всё в одном месте.',
    formDescription: 'Войдите в свой аккаунт, чтобы продолжить.',
    title: 'Вход в систему',
    emailLabel: 'Email',
    emailPlaceholder: 'Ваш email',
    passwordLabel: 'Пароль',
    passwordPlaceholder: 'Ваш пароль',
    submit: 'Войти',
    submitting: 'Вход...',
    success: 'Вы успешно вошли!',
    error: 'Неверный email или пароль',
    rateLimit: 'Слишком много попыток. Подождите 1 минуту.',
    networkError: 'Не удалось подключиться к серверу.',
    companyInactive:
      'Ваша компания ещё не активирована. Свяжитесь с администратором.',
    tabStaff: 'Сотрудник',
    tabStudent: 'Ученик',
    phoneLabel: 'Номер телефона',
    phonePlaceholder: '+998 90 123 45 67',
    studentDescription:
      'Вход в кабинет ученика. Пароль выдаёт ваш учебный центр.',
    studentError: 'Неверный телефон или пароль',
    studentClosed: 'Кабинет ученика временно закрыт.',
  },
  en: {
    appTitle: 'EduLMS',
    themeDark: 'Dark mode',
    themeLight: 'Light mode',
    required: 'Required',
    showPassword: 'Show password',
    hidePassword: 'Hide password',
    workspaceLabel: 'Learning management platform',
    workspaceTitle: 'Your education center. One workspace.',
    workspaceDescription:
      'Courses, lessons, assignments, tests and student progress — all in one place.',
    formDescription: 'Sign in to your account to continue.',
    title: 'Sign in',
    emailLabel: 'Email',
    emailPlaceholder: 'Your email address',
    passwordLabel: 'Password',
    passwordPlaceholder: 'Your password',
    submit: 'Sign in',
    submitting: 'Signing in...',
    success: 'Successfully signed in!',
    error: 'Invalid email or password',
    rateLimit: 'Too many attempts. Please wait 1 minute.',
    networkError: 'Unable to connect to the server.',
    companyInactive:
      'Your company is not activated yet. Contact your administrator.',
    tabStaff: 'Staff',
    tabStudent: 'Student',
    phoneLabel: 'Phone number',
    phonePlaceholder: '+998 90 123 45 67',
    studentDescription:
      'Sign in to the student portal. Your center gives you the password.',
    studentError: 'Wrong phone number or password',
    studentClosed: 'The student portal is temporarily closed.',
  },
};

export const readLoginLang = (): LoginLang => {
  try {
    const language = window.localStorage.getItem('lang')?.slice(0, 2);
    if (language && (LOGIN_LANGS as readonly string[]).includes(language)) {
      return language as LoginLang;
    }
  } catch {
    // localStorage can throw in private browsing; Uzbek is the product default.
  }
  return 'uz';
};

export const getLoginCopy = (lang: LoginLang = readLoginLang()) => copy[lang];
