import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

export type PublicLang = "EN" | "SO";

const dict = {
  EN: {
    "nav.home": "HOME",
    "nav.courses": "COURSES",
    "nav.studyGuide": "STUDY GUIDE",
    "nav.faq": "FAQ",
    "nav.about": "ABOUT",
    "nav.contact": "CONTACT",
    "nav.register": "Register",
    "nav.signIn": "Sign In",
    "nav.dashboard": "Dashboard",
    "nav.menu": "Open menu",
    "nav.close": "Close menu",
    "lang.label": "Language",
    "lang.en": "English",
    "lang.so": "Somali",
    "auth.signIn": "Sign In",
    "auth.signInSub": "Enter your credentials to continue learning",
    "auth.email": "Email address",
    "auth.password": "Password",
    "auth.forgot": "Forgot password?",
    "auth.noAccount": "Don't have an account?",
    "auth.register": "Register",
    "auth.brandLine": "learing tutor system",
    "auth.create": "Create your account",
    "auth.createSub": "Join thousands of learners and start learning smarter with AI.",
    "auth.fullName": "Full name",
    "auth.confirm": "Confirm password",
    "auth.terms": "I agree to the terms and conditions",
    "auth.signUp": "Sign up",
    "auth.haveAccount": "Already have an account?",
    "auth.logIn": "Log in",
    "faq.title": "Frequently asked questions",
    "faq.sub": "Clear answers about courses, quizzes, and the AI Tutor in Interactive Ai learing tutor system.",
    "faq.q1": "How do I start learning?",
    "faq.a1": "Create an account, open Courses, and enroll in a published course. Complete lessons in order, then use quizzes to check what you remember.",
    "faq.q2": "What does the AI Tutor do?",
    "faq.a2": "The AI Tutor explains concepts in plain language, uses your current lesson, and helps when you get stuck — without replacing your own practice.",
    "faq.q3": "Are quizzes required?",
    "faq.a3": "Quizzes are the fastest way to turn reading into skill. Take them after a lesson, review mistakes, then try a short follow-up session.",
    "faq.q4": "Who is this platform for?",
    "faq.a4": "Students who want structured courses and an AI study partner, and administrators who manage courses, lessons, and progress.",
    "faq.q5": "How do I get help?",
    "faq.a5": "Use the Contact page for the team, or open the AI Tutor after you sign in if a concept is unclear during a lesson.",
    "about.title": "About Interactive Ai learing tutor system",
    "about.body":
      "A modern education platform: structured courses, interactive quizzes, student progress analytics, and a personal AI tutor — with a professional admin console for managing students and content.",
  },
  SO: {
    "nav.home": "GURI",
    "nav.courses": "KOORSOOYIN",
    "nav.studyGuide": "HAGAHA WAXBARASHO",
    "nav.faq": "SU'AALO",
    "nav.about": "NAGU SAABSAN",
    "nav.contact": "XIRIIR",
    "nav.register": "Isdiiwaangeli",
    "nav.signIn": "Gal",
    "nav.dashboard": "Dashboard",
    "nav.menu": "Fur liiska",
    "nav.close": "Xir liiska",
    "lang.label": "Luuqadda",
    "lang.en": "Ingiriisi",
    "lang.so": "Soomaali",
    "auth.signIn": "Gal",
    "auth.signInSub": "Geli xogtaada si aad u sii wadato waxbarashada",
    "auth.email": "Cinwaanka iimaylka",
    "auth.password": "Furaha sirta",
    "auth.forgot": "Ma illowday furaha?",
    "auth.noAccount": "Ma lihid akoon?",
    "auth.register": "Isdiiwaangeli",
    "auth.brandLine": "learing tutor system",
    "auth.create": "Samee akoonkaaga",
    "auth.createSub": "Ku biir arday badan oo ku baro si caqli badan oo AI ah.",
    "auth.fullName": "Magaca buuxa",
    "auth.confirm": "Xaqiiji furaha",
    "auth.terms": "Waan aqbalay shuruudaha iyo xeerarka",
    "auth.signUp": "Isdiiwaangeli",
    "auth.haveAccount": "Hore ma u leedahay akoon?",
    "auth.logIn": "Gal",
    "faq.title": "Su'aalaha inta badan la isweydiiyo",
    "faq.sub": "Jawaabo cad oo ku saabsan koorsooyinka, imtixaannada, iyo AI Tutor ee Interactive Ai learing tutor system.",
    "faq.q1": "Sidee ku bilaabaa waxbarashada?",
    "faq.a1": "Samee akoon, fur Koorsooyinka, oo iska diiwaangeli koorso la daabacay. Dhamee casharrada si nidaamsan, kadib isticmaal imtixaannada si aad u hubiso waxa aad xasuusato.",
    "faq.q2": "Maxay qabataa AI Tutor?",
    "faq.a2": "AI Tutor waxay u sharaxdaa fikradaha luuqad fudud, waxay isticmaashaa casharkaaga hadda, waxayna kaa caawisaa marka aad ku xayirmato — iyada oo aan beddelin tababarkaaga.",
    "faq.q3": "Imtixaannadu ma qasab baa?",
    "faq.a3": "Imtixaannadu waa dariiqa ugu dhaqsaha badan ee akhriska looga dhigo xirfad. Qaado ka dib cashar, eeg khaladaadka, kadib samee fadhiga gaaban ee xiga.",
    "faq.q4": "Yaa loogu talagalay madalkan?",
    "faq.a4": "Ardayda doonaya koorsooyin nidaamsan iyo wehel waxbarasho oo AI ah, iyo maamulayaasha maaraynaya koorsooyinka, casharrada, iyo horumarka.",
    "faq.q5": "Sidee caawimo u helaa?",
    "faq.a5": "Isticmaal bogga Xiriirka kooxda, ama fur AI Tutor ka dib marka aad gasho haddii fikrad ku caddaan cashar dhexdiisa.",
    "about.title": "Ku saabsan Interactive Ai learing tutor system",
    "about.body":
      "Madal waxbarasho casri ah: koorsooyin nidaamsan, imtixaanno isdhexgal ah, falanqayn horumar arday, iyo AI tutor gaar ah — iyo console maamul oo xirfad leh oo loogu talagalay ardayda iyo nuxurka.",
  },
} as const;

export type I18nKey = keyof typeof dict.EN;

type I18nValue = {
  lang: PublicLang;
  setLang: (lang: PublicLang) => void;
  t: (key: I18nKey) => string;
};

const I18nContext = createContext<I18nValue | null>(null);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<PublicLang>(() => {
    try {
      return localStorage.getItem("publicLang") === "SO" ? "SO" : "EN";
    } catch {
      return "EN";
    }
  });

  useEffect(() => {
    document.documentElement.lang = lang === "SO" ? "so" : "en";
    localStorage.setItem("publicLang", lang);
  }, [lang]);

  const value = useMemo<I18nValue>(
    () => ({
      lang,
      setLang: setLangState,
      t: (key) => dict[lang][key] ?? dict.EN[key],
    }),
    [lang],
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used within I18nProvider");
  return ctx;
}
