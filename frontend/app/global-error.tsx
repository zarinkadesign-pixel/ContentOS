"use client";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="ru">
      <body className="flex h-screen items-center justify-center bg-[#0d1126]">
        <div className="text-center px-6">
          <div className="text-5xl mb-4">⚡</div>
          <h2 className="text-xl font-bold text-[#e2e8f0] mb-2">Что-то пошло не так</h2>
          <p className="text-sm text-[#64748b] mb-6">{error.message ?? "Неизвестная ошибка"}</p>
          <button
            onClick={reset}
            className="bg-[#6c63ff] hover:bg-[#5b53ee] text-white font-semibold px-6 py-2.5 rounded-lg text-sm transition-colors"
          >
            Попробовать снова
          </button>
        </div>
      </body>
    </html>
  );
}
