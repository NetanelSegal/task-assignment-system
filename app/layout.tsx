import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import { StoreProvider } from "@/lib/store";
import { Nav } from "@/components/Nav";
import { AuthGate } from "@/components/AuthGate";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Interview Tasks",
  description:
    "Task assignment system for interviewers across open positions — with skill- and workload-aware assignment suggestions.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${geistSans.variable} h-full antialiased`}>
      <body className="min-h-full bg-slate-50 text-slate-900">
        <StoreProvider>
          <Nav />
          <main className="mx-auto max-w-6xl px-4 py-6">
            <AuthGate>{children}</AuthGate>
          </main>
        </StoreProvider>
      </body>
    </html>
  );
}
