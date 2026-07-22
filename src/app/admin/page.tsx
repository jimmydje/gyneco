"use client";

import { useState, useEffect, useCallback } from "react";
import { useI18n } from "@/lib/i18n";

type User = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  grade: string;
  specialite: string;
  workplace: string;
  phone: string | null;
  dateOfBirth: string;
  registeredAt: string;
};

type AddForm = {
  firstName: string;
  lastName: string;
  email: string;
  dateOfBirth: string;
  grade: string;
  specialite: string;
  workplace: string;
  phone: string;
};

const GRADES = [
  "Externe", "Interne", "Médecin généraliste",
  "Résident", "Gynécologue obstétricien", "Autre",
] as const;

const EMPTY_ADD: AddForm = {
  firstName: "", lastName: "", email: "", dateOfBirth: "",
  grade: "", specialite: "", workplace: "", phone: "",
};

export default function AdminPage() {
  const { t, lang, setLang } = useI18n();
  const [loggedIn, setLoggedIn] = useState(false);
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);

  const [users, setUsers] = useState<User[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);

  const [showAdd, setShowAdd] = useState(false);
  const [addForm, setAddForm] = useState<AddForm>(EMPTY_ADD);
  const [addError, setAddError] = useState("");
  const [addLoading, setAddLoading] = useState(false);
  const [sendEmail, setSendEmail] = useState(true);

  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  // ─── Program editing state ────────────────────────────────
  type Session = [string, string];
  type ProgDay = { day: string; subtitle: string; sessions: Session[] };
  type ProgData = { days: ProgDay[]; venue: string; contact: string; phone: string };

  const [showProgram, setShowProgram] = useState(false);
  const [program, setProgram] = useState<ProgData>({ days: [], venue: "", contact: "", phone: "" });
  const [progLoading, setProgLoading] = useState(false);
  const [progSaved, setProgSaved] = useState(false);
  const [progError, setProgError] = useState("");

  // ─── Fetch users ──────────────────────────────────────────
  const fetchUsers = useCallback(async () => {
    setLoadingUsers(true);
    try {
      const res = await fetch("/api/admin/users");
      if (res.status === 401) {
        setLoggedIn(false);
        return;
      }
      const data = await res.json();
      setUsers(data.users || []);
    } catch {
      /* ignore */
    } finally {
      setLoadingUsers(false);
    }
  }, []);

  useEffect(() => {
    if (loggedIn) fetchUsers();
  }, [loggedIn, fetchUsers]);

  // ─── Login ────────────────────────────────────────────────
  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoginError("");
    setLoginLoading(true);
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      if (!res.ok) {
        const d = await res.json();
        setLoginError(d.error || "Login failed.");
        return;
      }
      setLoggedIn(true);
    } catch {
      setLoginError("Connection error.");
    } finally {
      setLoginLoading(false);
    }
  }

  // ─── Logout ───────────────────────────────────────────────
  async function handleLogout() {
    await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "logout" }),
    });
    setLoggedIn(false);
    setUsers([]);
    setPassword("");
  }

  // ─── Delete ───────────────────────────────────────────────
  async function handleDelete(id: string) {
    setDeleteId(id);
    try {
      const res = await fetch(`/api/admin/users/${id}`, { method: "DELETE" });
      if (res.ok) {
        setUsers((prev) => prev.filter((u) => u.id !== id));
      }
    } catch {
      /* ignore */
    } finally {
      setDeleteId(null);
    }
  }

  // ─── Program ─────────────────────────────────────────────
  async function fetchProgram() {
    setProgLoading(true);
    try {
      const res = await fetch("/api/program");
      const data = await res.json();
      setProgram(data);
    } catch {
      /* ignore */
    } finally {
      setProgLoading(false);
    }
  }

  function updateDayField(index: number, field: "day" | "subtitle", value: string) {
    setProgram((prev) => {
      const days = [...prev.days];
      days[index] = { ...days[index], [field]: value };
      return { ...prev, days };
    });
  }

  function updateSession(dayIdx: number, sesIdx: number, col: 0 | 1, value: string) {
    setProgram((prev) => {
      const days = [...prev.days];
      const sessions = [...days[dayIdx].sessions] as Session[];
      sessions[sesIdx] = [...sessions[sesIdx]] as Session;
      sessions[sesIdx][col] = value;
      days[dayIdx] = { ...days[dayIdx], sessions };
      return { ...prev, days };
    });
  }

  function addSession(dayIdx: number) {
    setProgram((prev) => {
      const days = [...prev.days];
      days[dayIdx] = {
        ...days[dayIdx],
        sessions: [...days[dayIdx].sessions, ["00:00", t("newSession")] as Session],
      };
      return { ...prev, days };
    });
  }

  function removeSession(dayIdx: number, sesIdx: number) {
    setProgram((prev) => {
      const days = [...prev.days];
      days[dayIdx] = {
        ...days[dayIdx],
        sessions: days[dayIdx].sessions.filter((_, i) => i !== sesIdx),
      };
      return { ...prev, days };
    });
  }

  function addDay() {
    setProgram((prev) => ({
      ...prev,
      days: [...prev.days, { day: t("newDay"), subtitle: "", sessions: [["00:00", t("newSession")] as Session] }],
    }));
  }

  function removeDay(dayIdx: number) {
    setProgram((prev) => ({
      ...prev,
      days: prev.days.filter((_, i) => i !== dayIdx),
    }));
  }

  async function saveProgram() {
    setProgLoading(true);
    setProgSaved(false);
    setProgError("");
    try {
      const res = await fetch("/api/program", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(program),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({ error: "Save failed" }));
        setProgError(d.error || "Failed to save program.");
        return;
      }
      setProgSaved(true);
      setTimeout(() => setProgSaved(false), 3000);
      // Refresh to confirm
      fetchProgram();
    } catch {
      setProgError("Connection error.");
    } finally {
      setProgLoading(false);
    }
  }

  async function resetProgram() {
    if (!confirm(lang === "fr" ? "Réinitialiser le programme par défaut ?" : "Reset to default program?")) return;
    setProgLoading(true);
    setProgError("");
    try {
      const res = await fetch("/api/program", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ _reset: true }),
      });
      if (res.ok) {
        const data = await res.json();
        setProgram(data);
        setProgSaved(true);
        setTimeout(() => setProgSaved(false), 3000);
      }
    } catch {
      setProgError("Connection error.");
    } finally {
      setProgLoading(false);
    }
  }

  // ─── Add ──────────────────────────────────────────────────
  function updateAdd(field: keyof AddForm, value: string) {
    setAddForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setAddError("");
    setAddLoading(true);
    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...addForm, sendEmail }),
      });
      const data = await res.json();
      if (!res.ok) {
        setAddError(data.error || "Failed to add.");
        return;
      }
      setAddForm(EMPTY_ADD);
      setShowAdd(false);
      setSendEmail(true);
      fetchUsers();
    } catch {
      setAddError("Connection error.");
    } finally {
      setAddLoading(false);
    }
  }

  // ─── Filter ───────────────────────────────────────────────
  const filtered = users.filter(
    (u) =>
      !search ||
      u.firstName.toLowerCase().includes(search.toLowerCase()) ||
      u.lastName.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase()) ||
      u.grade.toLowerCase().includes(search.toLowerCase()) ||
      u.specialite.toLowerCase().includes(search.toLowerCase()) ||
      u.workplace.toLowerCase().includes(search.toLowerCase())
  );

  // ─── Login screen ─────────────────────────────────────────
  if (!loggedIn) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#faf4f5] via-[#e8dfe2] to-[#dce8f0] px-4 sm:px-6">
        <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden">
          <div className="text-center pt-8 sm:pt-10 px-6 sm:px-10">
            <div className="text-right -mt-2 mb-1">
              <button
                onClick={() => setLang(lang === "fr" ? "en" : "fr")}
                className="text-xs px-3 py-1.5 border border-border rounded-full hover:bg-primary-lighter transition-colors"
              >
                {lang === "fr" ? t("switchToLabel") : t("languageLabel")}
              </button>
            </div>
            <span className="text-3xl text-primary">♀</span>
            <h1 className="font-heading text-2xl font-bold mt-3">{t("adminLoginTitle")}</h1>
            <p className="text-sm text-muted mt-1">
              {t("appTitle")}
            </p>
          </div>
          <div className="px-6 sm:px-10 py-5 sm:py-7">
            {loginError && (
              <div className="bg-danger-light text-danger text-sm px-4 py-3 rounded-md mb-5">
                {loginError}
              </div>
            )}
            <form onSubmit={handleLogin} className="flex flex-col gap-4">
              <label className="flex flex-col gap-1.5">
                <span className="text-xs font-semibold">{t("adminPassword")}</span>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={t("adminPasswordPlaceholder")}
                  className="px-4 py-3 border border-border rounded-md text-sm focus:border-primary focus:ring-2 focus:ring-primary/10 outline-none"
                  required
                  autoFocus
                />
              </label>
              <button
                type="submit"
                disabled={loginLoading}
                className="w-full py-3.5 text-base font-medium bg-primary text-white rounded-md hover:bg-primary-hover disabled:opacity-60 transition-colors"
              >
                {loginLoading ? t("signingIn") : t("signIn")}
              </button>
              <a
                href="/"
                className="text-center text-xs text-muted hover:text-primary transition-colors"
              >
                {t("backToRegistration")}
              </a>
            </form>
          </div>
        </div>
      </div>
    );
  }

  // ─── Dashboard ────────────────────────────────────────────
  const stats = {
    total: users.length,
    externes: users.filter((u) => u.grade === "Externe").length,
    internes: users.filter((u) => u.grade === "Interne").length,
    residents: users.filter((u) => u.grade === "Résident").length,
    gynecologues: users.filter((u) => u.grade === "Gynécologue obstétricien").length,
  };

  return (
    <div className="min-h-screen bg-[#faf8f9]">
      {/* Header */}
      <header className="bg-white border-b border-border px-4 sm:px-6 py-3 sm:py-4 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2 sm:gap-3">
            <span className="text-xl sm:text-2xl text-primary">♀</span>
            <div>
              <h1 className="font-heading text-base sm:text-lg font-bold">{t("adminDashboard")}</h1>
              <p className="text-[11px] sm:text-xs text-muted line-clamp-1">
                {t("appTitle")}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto justify-between sm:justify-end">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setLang(lang === "fr" ? "en" : "fr")}
                className="text-[11px] sm:text-xs px-2 sm:px-3 py-1 sm:py-1.5 border border-border rounded-full hover:bg-primary-lighter transition-colors"
              >
                {lang === "fr" ? t("switchToLabel") : t("languageLabel")}
              </button>
              <a href="/" className="text-[11px] sm:text-xs text-muted hover:text-primary transition-colors hidden sm:inline">
                {t("registerPage")}
              </a>
            </div>
            <button
              onClick={handleLogout}
              className="text-[11px] sm:text-xs px-2 sm:px-3 py-1 sm:py-1.5 border border-border rounded-md hover:bg-[#faf4f5] transition-colors"
            >
              {t("logout")}
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4 mb-6 sm:mb-8">
          <div className="bg-white border border-border rounded-xl p-4">
            <p className="text-2xl font-bold text-primary">{stats.total}</p>
            <p className="text-xs text-muted mt-1">{t("totalRegistrants")}</p>
          </div>
          <div className="bg-white border border-border rounded-xl p-4">
            <p className="text-2xl font-bold text-secondary">{stats.externes}</p>
            <p className="text-xs text-muted mt-1">{t("externes")}</p>
          </div>
          <div className="bg-white border border-border rounded-xl p-4">
            <p className="text-2xl font-bold text-warning-dark">{stats.internes}</p>
            <p className="text-xs text-muted mt-1">{t("internes")}</p>
          </div>
          <div className="bg-white border border-border rounded-xl p-4">
            <p className="text-2xl font-bold text-success-dark">{stats.residents}</p>
            <p className="text-xs text-muted mt-1">{t("residents")}</p>
          </div>
          <div className="bg-white border border-border rounded-xl p-4">
            <p className="text-2xl font-bold text-primary">{stats.gynecologues}</p>
            <p className="text-xs text-muted mt-1">{t("gynecologues")}</p>
          </div>
        </div>

        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between mb-6">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t("search")}
            className="px-4 py-2.5 border border-border rounded-lg text-sm w-full sm:w-80 focus:border-primary focus:ring-2 focus:ring-primary/10 outline-none"
          />
          <button
            onClick={() => setShowAdd(!showAdd)}
            className="px-5 py-2.5 text-sm font-semibold bg-primary text-white rounded-lg hover:bg-primary-hover transition-colors flex items-center gap-2"
          >
            {showAdd ? t("cancelAdd") : t("addRegistrant")}
          </button>
        </div>

        {/* Add form */}
        {showAdd && (
          <div className="bg-white border border-border rounded-2xl p-6 mb-6 shadow-sm">
            <h2 className="font-heading text-lg font-bold mb-4">{t("addNewRegistrant")}</h2>
            {addError && (
              <div className="bg-danger-light text-danger text-sm px-4 py-3 rounded-md mb-5">
                {addError}
              </div>
            )}
            <form onSubmit={handleAdd} className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <label className="flex flex-col gap-1.5">
                  <span className="text-xs font-semibold">{t("firstName")} *</span>
                  <input
                    value={addForm.firstName}
                    onChange={(e) => updateAdd("firstName", e.target.value)}
                    placeholder={t("firstName")}
                    className="px-4 py-3 border border-border rounded-md text-sm focus:border-primary focus:ring-2 focus:ring-primary/10 outline-none"
                    required
                  />
                </label>
                <label className="flex flex-col gap-1.5">
                  <span className="text-xs font-semibold">{t("lastName")} *</span>
                  <input
                    value={addForm.lastName}
                    onChange={(e) => updateAdd("lastName", e.target.value)}
                    placeholder={t("lastName")}
                    className="px-4 py-3 border border-border rounded-md text-sm focus:border-primary focus:ring-2 focus:ring-primary/10 outline-none"
                    required
                  />
                </label>
              </div>
              <label className="flex flex-col gap-1.5">
                <span className="text-xs font-semibold">{t("email")} *</span>
                <input
                  type="email"
                  value={addForm.email}
                  onChange={(e) => updateAdd("email", e.target.value)}
                  placeholder="you@example.com"
                  className="px-4 py-3 border border-border rounded-md text-sm focus:border-primary focus:ring-2 focus:ring-primary/10 outline-none"
                  required
                />
              </label>
              <div className="grid sm:grid-cols-2 gap-4">
                <label className="flex flex-col gap-1.5">
                  <span className="text-xs font-semibold">{t("grade")} *</span>
                  <select
                    value={addForm.grade}
                    onChange={(e) => updateAdd("grade", e.target.value)}
                    className="px-4 py-3 border border-border rounded-md text-sm focus:border-primary focus:ring-2 focus:ring-primary/10 outline-none"
                    required
                  >
                    <option value="">{t("selectGrade")}</option>
                    {GRADES.map((g) => (
                      <option key={g} value={g}>{g}</option>
                    ))}
                  </select>
                </label>
                <label className="flex flex-col gap-1.5">
                  <span className="text-xs font-semibold">{t("specialite")}</span>
                  <input
                    value={addForm.specialite}
                    onChange={(e) => updateAdd("specialite", e.target.value)}
                    placeholder={t("specialitePlaceholder")}
                    className="px-4 py-3 border border-border rounded-md text-sm focus:border-primary focus:ring-2 focus:ring-primary/10 outline-none"
                  />
                </label>
              </div>
              <label className="flex flex-col gap-1.5">
                <span className="text-xs font-semibold">{t("workplace")} *</span>
                <input
                  value={addForm.workplace}
                  onChange={(e) => updateAdd("workplace", e.target.value)}
                  placeholder={t("workplacePlaceholder")}
                  className="px-4 py-3 border border-border rounded-md text-sm focus:border-primary focus:ring-2 focus:ring-primary/10 outline-none"
                  required
                />
              </label>
              <label className="flex flex-col gap-1.5">
                <span className="text-xs font-semibold">{t("phone")}</span>
                <input
                  type="tel"
                  value={addForm.phone}
                  onChange={(e) => updateAdd("phone", e.target.value)}
                  placeholder={t("phonePlaceholder")}
                  className="px-4 py-3 border border-border rounded-md text-sm focus:border-primary focus:ring-2 focus:ring-primary/10 outline-none"
                />
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={sendEmail}
                  onChange={(e) => setSendEmail(e.target.checked)}
                  className="accent-primary w-4 h-4"
                />
                <span className="text-sm text-muted">{t("sendEmailLabel")}</span>
              </label>
              <button
                type="submit"
                disabled={addLoading}
                className="w-full py-3 text-base font-medium bg-primary text-white rounded-md hover:bg-primary-hover disabled:opacity-60 transition-colors"
              >
                {addLoading ? t("adding") : t("addRegistrantBtn")}
              </button>
            </form>
          </div>
        )}

        {/* ─── Program Editor ────────────────────────────── */}
        <div className="mb-6">
          <button
            onClick={() => {
              if (!showProgram) fetchProgram();
              setShowProgram(!showProgram);
            }}
            className="px-5 py-2.5 text-sm font-semibold bg-secondary text-white rounded-lg hover:opacity-90 transition-colors flex items-center gap-2"
          >
            {showProgram ? t("closeEditor") : t("editProgram")}
          </button>
        </div>

        {showProgram && (
          <div className="bg-white border border-border rounded-2xl p-4 sm:p-6 mb-6 shadow-sm">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4 sm:mb-6">
              <h2 className="font-heading text-lg font-bold">{t("programEditor")}</h2>
              <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                <button
                  onClick={resetProgram}
                  className="text-xs px-2 py-1 text-muted hover:text-primary underline"
                >
                  {lang === "fr" ? "Réinitialiser" : "Reset"}
                </button>
                {progSaved && (
                  <span className="text-xs text-success font-semibold">{t("saved")}</span>
                )}
                {progError && (
                  <span className="text-xs text-danger font-semibold">{progError}</span>
                )}
                <button
                  onClick={saveProgram}
                  disabled={progLoading}
                  className="px-4 py-2 text-sm font-semibold bg-primary text-white rounded-lg hover:bg-primary-hover disabled:opacity-60 transition-colors"
                >
                  {progLoading ? t("saving") : t("saveProgram")}
                </button>
              </div>
            </div>

            {/* Venue, Contact & Phone */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 mb-4 sm:mb-6 pb-4 sm:pb-6 border-b border-border">
              <label className="flex flex-col gap-1.5">
                <span className="text-xs font-semibold">{t("venueField")}</span>
                <input
                  value={program.venue}
                  onChange={(e) => setProgram((p) => ({ ...p, venue: e.target.value }))}
                  placeholder={t("venuePlaceholder")}
                  className="px-4 py-3 border border-border rounded-md text-sm focus:border-primary focus:ring-2 focus:ring-primary/10 outline-none"
                />
              </label>
              <label className="flex flex-col gap-1.5">
                <span className="text-xs font-semibold">{t("contactField")}</span>
                <input
                  value={program.contact}
                  onChange={(e) => setProgram((p) => ({ ...p, contact: e.target.value }))}
                  placeholder={t("contactPlaceholder")}
                  className="px-4 py-3 border border-border rounded-md text-sm focus:border-primary focus:ring-2 focus:ring-primary/10 outline-none"
                />
              </label>
              <label className="flex flex-col gap-1.5">
                <span className="text-xs font-semibold">📞 Téléphone</span>
                <input
                  value={program.phone || ""}
                  onChange={(e) => setProgram((p) => ({ ...p, phone: e.target.value }))}
                  placeholder="038871324 / 038871678"
                  className="px-4 py-3 border border-border rounded-md text-sm focus:border-primary focus:ring-2 focus:ring-primary/10 outline-none"
                />
              </label>
            </div>

            {/* Days */}
            <div className="space-y-6">
              {program.days.map((day, di) => (
                <div
                  key={di}
                  className="border border-border rounded-xl p-3 sm:p-5 bg-[#fdfbfc]"
                >
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-xs font-semibold text-primary uppercase tracking-wider">
                      {t("day")} {di + 1}
                    </span>
                    <button
                      onClick={() => removeDay(di)}
                      className="text-xs text-danger hover:underline"
                    >
                      {t("removeDay")}
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3 mb-3 sm:mb-4">
                    <label className="flex flex-col gap-1">
                      <span className="text-[11px] font-semibold text-muted">{t("dayTitle")}</span>
                      <input
                        value={day.day}
                        onChange={(e) => updateDayField(di, "day", e.target.value)}
                        placeholder={t("dayTitlePlaceholder")}
                        className="px-3 py-2.5 border border-border rounded-md text-sm focus:border-primary focus:ring-2 focus:ring-primary/10 outline-none"
                      />
                    </label>
                    <label className="flex flex-col gap-1">
                      <span className="text-[11px] font-semibold text-muted">{t("daySubtitle")}</span>
                      <input
                        value={day.subtitle}
                        onChange={(e) => updateDayField(di, "subtitle", e.target.value)}
                        placeholder={t("subtitlePlaceholder")}
                        className="px-3 py-2.5 border border-border rounded-md text-sm focus:border-primary focus:ring-2 focus:ring-primary/10 outline-none"
                      />
                    </label>
                  </div>

                  {/* Sessions */}
                  <p className="text-[11px] font-semibold text-muted mb-2">{t("sessions")}</p>
                  <div className="space-y-1.5 sm:space-y-2">
                    {day.sessions.map(([time, title], si) => (
                      <div key={si} className="flex flex-col sm:flex-row items-stretch sm:items-center gap-1.5 sm:gap-2">
                        <div className="flex items-center gap-1.5 sm:gap-2 flex-1">
                          <input
                            value={time}
                            onChange={(e) => updateSession(di, si, 0, e.target.value)}
                            placeholder="HH:MM"
                            className="px-2 sm:px-3 py-2 border border-border rounded-md text-sm w-14 sm:w-20 focus:border-primary focus:ring-2 focus:ring-primary/10 outline-none font-mono shrink-0"
                          />
                          <input
                            value={title}
                            onChange={(e) => updateSession(di, si, 1, e.target.value)}
                            placeholder={t("sessionPlaceholder")}
                            className="px-2 sm:px-3 py-2 border border-border rounded-md text-sm flex-1 min-w-0 focus:border-primary focus:ring-2 focus:ring-primary/10 outline-none"
                          />
                        </div>
                        <button
                          onClick={() => removeSession(di, si)}
                          className="text-muted hover:text-danger transition-colors shrink-0 text-lg leading-none px-2 py-1 self-end sm:self-center border border-border rounded-md sm:border-0"
                          title={t("removeSession")}
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                  <button
                    onClick={() => addSession(di)}
                    className="mt-3 text-xs text-secondary hover:underline"
                  >
                    {t("addSession")}
                  </button>
                </div>
              ))}
            </div>

            <button
              onClick={addDay}
              className="mt-4 text-sm text-secondary font-medium hover:underline"
            >
              {t("addDay")}
            </button>
          </div>
        )}

        {/* Users — Card view on mobile, table on desktop */}
        {loadingUsers ? (
          <div className="text-center py-16 text-muted">{t("loadingRegistrants")}</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 bg-white border border-border rounded-2xl">
            <p className="text-muted">{t("noRegistrants")}</p>
            {search && (
              <button
                onClick={() => setSearch("")}
                className="text-sm text-primary mt-2 hover:underline"
              >
                {t("clearSearch")}
              </button>
            )}
          </div>
        ) : (
          <>
            {/* Mobile cards */}
            <div className="lg:hidden space-y-3">
              {filtered.map((user) => (
                <div
                  key={user.id}
                  className="bg-white border border-border rounded-xl p-4 shadow-sm"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="font-semibold text-sm">
                        {user.firstName} {user.lastName}
                      </p>
                      <p className="text-xs text-muted">{user.email}</p>
                    </div>
                    <span className="inline-block px-2 py-0.5 bg-primary-lighter text-primary text-[11px] font-medium rounded-full shrink-0">
                      {user.grade}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-muted mb-3">
                    {user.specialite && (
                      <p><span className="font-medium text-foreground">{t("specialiteCol")}:</span> {user.specialite}</p>
                    )}
                    <p><span className="font-medium text-foreground">{t("workplaceCol")}:</span> {user.workplace}</p>
                    {user.phone && (
                      <p><span className="font-medium text-foreground">{t("phoneCol")}:</span> {user.phone}</p>
                    )}
                    <p className="col-span-2">
                      <span className="font-medium text-foreground">{t("registered")}:</span>{" "}
                      {new Date(user.registeredAt).toLocaleDateString(lang === "fr" ? "fr-FR" : "en-US", {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                  <button
                    onClick={() => handleDelete(user.id)}
                    disabled={deleteId === user.id}
                    className="w-full text-xs py-2 text-danger border border-danger/20 rounded-md hover:bg-danger-light disabled:opacity-40 transition-colors"
                  >
                    {deleteId === user.id ? t("deleting") : t("delete")}
                  </button>
                </div>
              ))}
            </div>

            {/* Desktop table */}
            <div className="hidden lg:block bg-white border border-border rounded-2xl overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-[#faf4f5] text-left">
                      <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-primary">
                        {t("name")}
                      </th>
                      <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-primary">
                        {t("emailCol")}
                      </th>
                      <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-primary">
                        {t("gradeCol")}
                      </th>
                      <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-primary">
                        {t("specialiteCol")}
                      </th>
                      <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-primary">
                        {t("workplaceCol")}
                      </th>
                      <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-primary">
                        {t("phoneCol")}
                      </th>
                      <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-primary">
                        {t("registered")}
                      </th>
                      <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-primary w-20">
                        {t("action")}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#f3eff0]">
                    {filtered.map((user) => (
                      <tr key={user.id} className="hover:bg-[#fdfbfc] transition-colors">
                        <td className="px-5 py-3.5 font-medium">
                          {user.firstName} {user.lastName}
                        </td>
                        <td className="px-5 py-3.5 text-muted">{user.email}</td>
                        <td className="px-5 py-3.5">
                          <span className="inline-block px-2 py-0.5 bg-primary-lighter text-primary text-xs font-medium rounded-full">
                            {user.grade}
                          </span>
                        </td>
                        <td className="px-5 py-3.5 text-muted">
                          {user.specialite || "—"}
                        </td>
                        <td className="px-5 py-3.5 text-muted">
                          {user.workplace}
                        </td>
                        <td className="px-5 py-3.5 text-muted">
                          {user.phone || "—"}
                        </td>
                        <td className="px-5 py-3.5 text-muted text-xs">
                          {new Date(user.registeredAt).toLocaleDateString(lang === "fr" ? "fr-FR" : "en-US", {
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </td>
                        <td className="px-5 py-3.5">
                          <button
                            onClick={() => handleDelete(user.id)}
                            disabled={deleteId === user.id}
                            className="text-xs px-2.5 py-1.5 text-danger border border-danger/20 rounded-md hover:bg-danger-light disabled:opacity-40 transition-colors"
                          >
                            {deleteId === user.id ? t("deleting") : t("delete")}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

        {/* Footer info */}
        <p className="text-xs text-muted mt-4 text-center">
          {t("showing")} {filtered.length} {t("of")} {users.length}{" "}
          {users.length !== 1 ? t("registrants") : t("registrant")}
        </p>
      </main>
    </div>
  );
}
