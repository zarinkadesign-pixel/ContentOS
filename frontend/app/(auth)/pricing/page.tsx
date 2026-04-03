import Link from "next/link";
import { Zap, Globe, Clapperboard, CheckCircle, ArrowLeft } from "lucide-react";

const HUB_FEATURES = [
  "AI-дашборд с аналитикой и KPI",
  "CRM для клиентов и лидов",
  "Финансовый учёт и отчёты",
  "AI-команда для автоматизации",
  "Планировщик задач и тайм-трекер",
  "Канбан-доска",
  "Шаблоны отчётов",
  "Email-уведомления",
];

const STUDIO_FEATURES = [
  "AI-генерация постов и сценариев",
  "Контент-план на месяц вперёд",
  "Адаптация под все соцсети",
  "Анализ конкурентов и аудитории",
  "Медиабиблиотека шаблонов",
  "Планировщик публикаций",
  "Reels и Stories сценарии",
  "Экспорт в PDF / Google Docs",
];

export default function PricingPage() {
  return (
    <div className="flex-1 overflow-y-auto bg-[#0d1126] text-[#e2e8f0]">
      {/* Nav */}
      <nav className="border-b border-[#1a1f3a] bg-[#080d1e]">
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-[#64748b] hover:text-[#e2e8f0] transition-colors">
            <ArrowLeft size={14} />
            <span className="text-sm">На главную</span>
          </Link>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-[#6c63ff] flex items-center justify-center">
              <Zap size={14} className="text-white" />
            </div>
            <span className="font-bold text-[#e2e8f0] text-sm">ContentOS</span>
          </div>
          <Link href="/login" className="text-sm text-[#64748b] hover:text-[#e2e8f0] transition-colors">Войти</Link>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-6 py-16">
        <div className="text-center mb-14">
          <h1 className="text-4xl font-bold text-[#e2e8f0] mb-3">Тарифы ContentOS</h1>
          <p className="text-[#64748b] text-lg">Выберите план под ваш бизнес</p>
        </div>

        {/* Main plan cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
          {/* Hub */}
          <div className="bg-[#0d1527] border border-[#1a1f3a] rounded-2xl p-8 flex flex-col">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-[#6c63ff]/15 flex items-center justify-center">
                <Globe size={20} className="text-[#6c63ff]" />
              </div>
              <div>
                <h2 className="font-bold text-[#e2e8f0] text-xl">ContentOS Хаб</h2>
                <p className="text-sm text-[#64748b]">Для управления продюсерским бизнесом</p>
              </div>
            </div>

            <ul className="space-y-3 flex-1 mb-8">
              {HUB_FEATURES.map((f) => (
                <li key={f} className="flex items-start gap-3 text-sm text-[#64748b]">
                  <CheckCircle size={15} className="text-[#6c63ff] shrink-0 mt-0.5" />
                  {f}
                </li>
              ))}
            </ul>

            <div className="space-y-3 pt-6 border-t border-[#1a1f3a]">
              <div className="flex items-center justify-between p-4 bg-[#080d1e] rounded-xl border border-[#1a1f3a]">
                <div>
                  <p className="text-xs text-[#64748b]">Ежемесячно</p>
                  <p className="text-xl font-bold text-[#e2e8f0]">$29 <span className="text-sm font-normal text-[#64748b]">/ мес</span></p>
                </div>
                <Link href="/register?plan=hub_monthly" className="bg-[#6c63ff] hover:bg-[#5b53ee] text-white text-sm px-5 py-2 rounded-lg font-medium transition-colors">
                  Выбрать
                </Link>
              </div>
              <div className="flex items-center justify-between p-4 bg-[#080d1e] rounded-xl border border-[#6c63ff]/20 relative overflow-hidden">
                <div className="absolute top-0 right-0 bg-green-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-bl-lg">ВЫГОДНО</div>
                <div>
                  <p className="text-xs text-[#64748b]">Ежегодно · экономия $99</p>
                  <p className="text-xl font-bold text-[#e2e8f0]">$249 <span className="text-sm font-normal text-[#64748b]">/ год</span></p>
                </div>
                <Link href="/register?plan=hub_yearly" className="bg-[#6c63ff] hover:bg-[#5b53ee] text-white text-sm px-5 py-2 rounded-lg font-medium transition-colors">
                  Выбрать
                </Link>
              </div>
            </div>
          </div>

          {/* Studio */}
          <div className="bg-[#0d1527] border border-[#1a1f3a] rounded-2xl p-8 flex flex-col">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-[#a78bfa]/15 flex items-center justify-center">
                <Clapperboard size={20} className="text-[#a78bfa]" />
              </div>
              <div>
                <h2 className="font-bold text-[#e2e8f0] text-xl">ContentOS Студия</h2>
                <p className="text-sm text-[#64748b]">Для создателей контента</p>
              </div>
            </div>

            <ul className="space-y-3 flex-1 mb-8">
              {STUDIO_FEATURES.map((f) => (
                <li key={f} className="flex items-start gap-3 text-sm text-[#64748b]">
                  <CheckCircle size={15} className="text-[#a78bfa] shrink-0 mt-0.5" />
                  {f}
                </li>
              ))}
            </ul>

            <div className="space-y-3 pt-6 border-t border-[#1a1f3a]">
              <div className="flex items-center justify-between p-4 bg-[#080d1e] rounded-xl border border-[#1a1f3a]">
                <div>
                  <p className="text-xs text-[#64748b]">Ежемесячно</p>
                  <p className="text-xl font-bold text-[#e2e8f0]">$15 <span className="text-sm font-normal text-[#64748b]">/ мес</span></p>
                </div>
                <Link href="/register?plan=studio_monthly" className="bg-[#a78bfa] hover:bg-[#9470f0] text-white text-sm px-5 py-2 rounded-lg font-medium transition-colors">
                  Выбрать
                </Link>
              </div>
              <div className="flex items-center justify-between p-4 bg-[#080d1e] rounded-xl border border-[#a78bfa]/20 relative overflow-hidden">
                <div className="absolute top-0 right-0 bg-green-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-bl-lg">ВЫГОДНО</div>
                <div>
                  <p className="text-xs text-[#64748b]">Ежегодно · экономия $51</p>
                  <p className="text-xl font-bold text-[#e2e8f0]">$129 <span className="text-sm font-normal text-[#64748b]">/ год</span></p>
                </div>
                <Link href="/register?plan=studio_yearly" className="bg-[#a78bfa] hover:bg-[#9470f0] text-white text-sm px-5 py-2 rounded-lg font-medium transition-colors">
                  Выбрать
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* FAQ note */}
        <div className="text-center bg-[#0d1527] border border-[#1a1f3a] rounded-2xl p-8">
          <h3 className="font-semibold text-[#e2e8f0] mb-2">Остались вопросы?</h3>
          <p className="text-sm text-[#64748b] mb-4">Все тарифы включают 7 дней пробного периода. Отмена в любой момент.</p>
          <p className="text-xs text-[#64748b]">По вопросам оплаты и партнёрства: <span className="text-[#6c63ff]">hello@amai.media</span></p>
        </div>
      </div>
    </div>
  );
}
