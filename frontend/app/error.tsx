"use client";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex h-full min-h-[400px] items-center justify-center">
      <div className="text-center px-6">
        <div className="text-4xl mb-4">⚡</div>
        <h2 className="text-lg font-bold text-[#e2e8f0] mb-2">Ошибка загрузки страницы</h2>
        <p className="text-sm text-[#64748b] mb-6">{error.message ?? "Попробуйте обновить"}</p>
        <button
          onClick={reset}
          className="bg-[#6c63ff] hover:bg-[#5b53ee] text-white font-semibold px-6 py-2.5 rounded-lg text-sm transition-colors"
        >
          Обновить
        </button>
      </div>
    </div>
  );
}
