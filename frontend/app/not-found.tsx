import Link from "next/link";
import { Zap } from "lucide-react";

export default function NotFound() {
  return (
    <div className="flex h-screen items-center justify-center bg-[#0d1126]">
      <div className="text-center px-6">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-[#6c63ff]/15 mb-6">
          <Zap size={28} className="text-[#6c63ff]" />
        </div>
        <h1 className="text-6xl font-black text-[#6c63ff] mb-3">404</h1>
        <h2 className="text-xl font-bold text-[#e2e8f0] mb-2">Страница не найдена</h2>
        <p className="text-sm text-[#64748b] mb-8">Такой страницы не существует</p>
        <Link
          href="/"
          className="bg-[#6c63ff] hover:bg-[#5b53ee] text-white font-semibold px-6 py-2.5 rounded-lg text-sm transition-colors"
        >
          На главную
        </Link>
      </div>
    </div>
  );
}
