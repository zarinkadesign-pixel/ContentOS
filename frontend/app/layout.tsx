import type { Metadata } from "next";
import "./globals.css";
import BugReporter from "@/components/BugReporter";

export const metadata: Metadata = {
  title: "ContentOS — Producer Center",
  description: "AI-powered content production system",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru">
      <body className="flex h-screen bg-bg">
        <BugReporter />
        {children}
      </body>
    </html>
  );
}
