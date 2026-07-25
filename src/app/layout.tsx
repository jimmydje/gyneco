import type { Metadata } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import "./globals.css";
import { I18nProvider } from "@/lib/i18n";

export const dynamic = "force-dynamic";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});
const playfairDisplay = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "4th Annaba Gynecology & Obstetrics Day",
  description:
    "Register for the 4th Annaba Gynecology & Obstetrics Day. October 15–17, 2026.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="fr"
      className={`${inter.variable} ${playfairDisplay.variable} h-full antialiased`}
    >
      <body className="min-h-full relative">
        {/* Full-screen background image */}
        <div
          className="fixed inset-0 z-0 bg-fixed-mobile-fix"
          style={{
            backgroundImage: `url('/fond.jpg')`,
            backgroundSize: "cover",
            backgroundPosition: "center center",
            backgroundRepeat: "no-repeat",
            backgroundAttachment: "fixed",
          }}
        />
        <div className="relative z-10">
          <I18nProvider>{children}</I18nProvider>
        </div>
      </body>
    </html>
  );
}
