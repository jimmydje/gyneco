"use client";

import { useState, useEffect } from "react";
import { useI18n } from "@/lib/i18n";

const GRADES = [
  "Externe", "Interne", "Médecin généraliste",
  "Résident", "Gynécologue obstétricien", "Autre",
] as const;

type FormData = {
  firstName: string;
  lastName: string;
  email: string;
  dateOfBirth: string;
  grade: string;
  specialite: string;
  workplace: string;
  phone: string;
};

type ProgramDay = {
  day: string;
  subtitle: string;
  sessions: [string, string][];
};

type ProgramData = {
  days: ProgramDay[];
  venue: string;
  contact: string;
};

const EMPTY: FormData = {
  firstName: "", lastName: "", email: "", dateOfBirth: "",
  grade: "", specialite: "", workplace: "", phone: "",
};

export default function HomePage() {
  const { t, lang, setLang } = useI18n();
  const [form, setForm] = useState<FormData>(EMPTY);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [registered, setRegistered] = useState(false);
  const [program, setProgram] = useState<ProgramData | null>(null);

  // Fetch the program when registration completes
  useEffect(() => {
    if (registered && !program) {
      fetch("/api/program")
        .then((r) => r.json())
        .then(setProgram)
        .catch(() => {});
    }
  }, [registered, program]);

  function update(field: keyof FormData, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, lang }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Registration failed.");
        return;
      }

      setRegistered(true);
    } catch {
      setError("Unable to connect. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  if (registered) {
    const days = program?.days ?? [];
    const venue = program?.venue ?? "";
    const contact = program?.contact ?? "";
    const phone = (program as { phone?: string })?.phone ?? "";

    return (
      <div
        className="min-h-screen py-10 px-4 relative"
        style={{
          backgroundImage: `url('https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=1920&q=80')`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundAttachment: "fixed",
        }}
      >
        {/* Overlay */}
        <div className="absolute inset-0 bg-white/90" />
        <div className="max-w-2xl mx-auto relative z-10">
          {/* Language switcher */}
          <div className="text-right mb-4">
            <button
              onClick={() => setLang(lang === "fr" ? "en" : "fr")}
              className="text-xs px-3 py-1.5 border border-border rounded-full hover:bg-primary-lighter transition-colors"
            >
              {lang === "fr" ? t("switchToLabel") : t("languageLabel")}
            </button>
          </div>

          <div className="text-center mb-10">
            <span className="text-4xl">♀</span>
            <h1 className="font-heading text-3xl font-bold mt-3">
              {t("appTitle")}
            </h1>
            <p className="text-sm text-muted mt-2">
              {t("thankYou", { name: form.firstName })} {t("confirmationSent", { email: form.email })}
            </p>
            <div className="inline-block mt-4 px-4 py-2 bg-success-light text-success-dark rounded-full text-sm font-semibold">
              {t("confirmed")}
            </div>
          </div>

          <h2 className="font-heading text-2xl font-bold text-center mb-8">
            {t("conferenceProgram")}
          </h2>

          {days.length === 0 && (
            <p className="text-center text-muted py-8">
              {program ? (lang === "fr" ? "Le programme sera annoncé prochainement." : "The program will be announced soon.") : t("loadingProgram")}
            </p>
          )}

          <div className="space-y-6">
            {days.map((day) => (
              <div
                key={day.day}
                className="bg-white border border-border rounded-2xl p-6 shadow-sm"
              >
                <div className="mb-4">
                  <span className="text-xs font-semibold text-primary uppercase tracking-wider">
                    {day.day}
                  </span>
                  <p className="text-sm text-muted mt-0.5">{day.subtitle}</p>
                </div>
                <ul className="divide-y divide-[#f3eff0]">
                  {day.sessions.map(([time, title]) => (
                    <li key={time + title} className="flex gap-3 py-2.5 text-sm">
                      <time className="font-semibold text-primary min-w-[52px] text-xs">
                        {time}
                      </time>
                      <span>{title}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          {venue && (
            <div className="mt-10 text-center bg-white/95 backdrop-blur border border-border rounded-2xl p-6">
              <h3 className="font-heading text-lg font-semibold mb-1">{t("venue")}</h3>
              <p className="text-sm text-muted">{venue}</p>
              {phone && (
                <p className="text-sm text-primary font-semibold mt-2">
                  📞 {phone}
                </p>
              )}
              {contact && (
                <p className="text-xs text-muted mt-2">
                  ✉️ {contact}
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }

  // Registration form
  return (
    <div
      className="min-h-screen flex items-center justify-center px-6 py-16 relative"
      style={{
        backgroundImage: `url('https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=1920&q=80')`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundAttachment: "fixed",
      }}
    >
      {/* Overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#faf4f5]/95 via-[#e8dfe2]/95 to-[#dce8f0]/95" />
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden relative z-10">
        <div className="text-center pt-10 px-10">
          {/* Language switcher */}
          <div className="text-right -mt-2 mb-1">
            <button
              onClick={() => setLang(lang === "fr" ? "en" : "fr")}
              className="text-xs px-3 py-1.5 border border-border rounded-full hover:bg-primary-lighter transition-colors"
            >
              {lang === "fr" ? t("switchToLabel") : t("languageLabel")}
            </button>
          </div>
          <span className="text-3xl text-primary">♀</span>
          <h1 className="font-heading text-2xl font-bold mt-3">
            {t("registerTitle")}
          </h1>
          <p className="text-sm text-muted mt-1">
            {t("appSubtitle")}
          </p>
          <p className="text-sm text-primary font-medium mt-3">
            {t("registerPrompt")}
          </p>
        </div>

        <div className="px-10 py-7">
          {error && (
            <div className="bg-danger-light text-danger text-sm px-4 py-3 rounded-md mb-5">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <label className="flex flex-col gap-1.5">
                <span className="text-xs font-semibold">{t("firstName")}</span>
                <input
                  value={form.firstName}
                  onChange={(e) => update("firstName", e.target.value)}
                  placeholder={t("firstName")}
                  className="px-4 py-3 border border-border rounded-md text-sm focus:border-primary focus:ring-2 focus:ring-primary/10 outline-none"
                  required
                />
              </label>
              <label className="flex flex-col gap-1.5">
                <span className="text-xs font-semibold">{t("lastName")}</span>
                <input
                  value={form.lastName}
                  onChange={(e) => update("lastName", e.target.value)}
                  placeholder={t("lastName")}
                  className="px-4 py-3 border border-border rounded-md text-sm focus:border-primary focus:ring-2 focus:ring-primary/10 outline-none"
                  required
                />
              </label>
            </div>

            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-semibold">{t("email")}</span>
              <input
                type="email"
                value={form.email}
                onChange={(e) => update("email", e.target.value)}
                placeholder="you@example.com"
                className="px-4 py-3 border border-border rounded-md text-sm focus:border-primary focus:ring-2 focus:ring-primary/10 outline-none"
                required
              />
            </label>

            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-semibold">{t("dateOfBirth")}</span>
              <input
                type="date"
                value={form.dateOfBirth}
                onChange={(e) => update("dateOfBirth", e.target.value)}
                className="px-4 py-3 border border-border rounded-md text-sm focus:border-primary focus:ring-2 focus:ring-primary/10 outline-none"
                required
              />
            </label>

            <div className="grid sm:grid-cols-2 gap-4">
              <label className="flex flex-col gap-1.5">
                <span className="text-xs font-semibold">{t("grade")}</span>
                <select
                  value={form.grade}
                  onChange={(e) => update("grade", e.target.value)}
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
                  value={form.specialite}
                  onChange={(e) => update("specialite", e.target.value)}
                  placeholder={t("specialitePlaceholder")}
                  className="px-4 py-3 border border-border rounded-md text-sm focus:border-primary focus:ring-2 focus:ring-primary/10 outline-none"
                />
              </label>
            </div>

            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-semibold">{t("workplace")}</span>
              <input
                value={form.workplace}
                onChange={(e) => update("workplace", e.target.value)}
                placeholder={t("workplacePlaceholder")}
                className="px-4 py-3 border border-border rounded-md text-sm focus:border-primary focus:ring-2 focus:ring-primary/10 outline-none"
                required
              />
            </label>

            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-semibold">{t("phone")}</span>
              <input
                type="tel"
                value={form.phone}
                onChange={(e) => update("phone", e.target.value)}
                placeholder={t("phonePlaceholder")}
                className="px-4 py-3 border border-border rounded-md text-sm focus:border-primary focus:ring-2 focus:ring-primary/10 outline-none"
              />
            </label>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 text-base font-medium bg-primary text-white rounded-md hover:bg-primary-hover disabled:opacity-60 transition-colors"
            >
              {loading ? t("registering") : t("registerBtn")}
            </button>
          </form>

          <div className="mt-5 pt-4 border-t border-border text-center">
            <a
              href="/admin"
              className="text-xs text-muted hover:text-primary transition-colors"
            >
              {t("adminLogin")}
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
