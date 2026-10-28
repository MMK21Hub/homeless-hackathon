import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Alpha Refold",
  description: "Protein structural refolding research platform.",
  icons: {
    icon: "/favicon.png",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="light no-scrollbar">
      <body className="bg-slate-50 text-slate-900 min-h-screen overflow-x-hidden no-scrollbar selection:bg-blue-600 selection:text-white">
        {children}
      </body>
    </html>
  );
}