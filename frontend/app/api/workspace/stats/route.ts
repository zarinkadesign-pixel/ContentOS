import { NextResponse } from "next/server";
import { getTasks, getTimeSessions } from "@/lib/kv";

function isoDate(d: Date) { return d.toISOString().slice(0, 10); }

export async function GET() {
  const [tasks, sessions] = await Promise.all([getTasks(), getTimeSessions()]);

  const today    = new Date();
  const todayStr = isoDate(today);

  // Week boundaries (Mon–Sun)
  const dayOfWeek   = (today.getDay() + 6) % 7; // 0=Mon
  const weekStart   = new Date(today); weekStart.setDate(today.getDate() - dayOfWeek);
  const weekEnd     = new Date(weekStart); weekEnd.setDate(weekStart.getDate() + 6);
  const weekStartStr = isoDate(weekStart);
  const weekEndStr   = isoDate(weekEnd);

  // Month boundaries
  const monthStartStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-01`;
  const monthEndDate  = new Date(today.getFullYear(), today.getMonth() + 1, 0);
  const monthEndStr   = isoDate(monthEndDate);

  // ── Task stats ───────────────────────────────────────────────────────────────
  const todayTasks = tasks.filter((t) => t.period === "day" || t.due_date === todayStr);
  const weekTasks  = tasks.filter((t) => t.period === "week" || (t.due_date >= weekStartStr && t.due_date <= weekEndStr));
  const monthTasks = tasks.filter((t) => t.period === "month" || (t.due_date >= monthStartStr && t.due_date <= monthEndStr));

  function stats(arr: any[]) {
    const total  = arr.length;
    const done   = arr.filter((t) => t.status === "done").length;
    const onTime = arr.filter((t) => t.status === "done" && t.completed_at && t.completed_at.slice(0, 10) <= t.due_date).length;
    return {
      total,
      done,
      todo:       arr.filter((t) => t.status === "todo").length,
      in_progress: arr.filter((t) => t.status === "in_progress").length,
      completion_pct: total ? Math.round(done / total * 100) : 0,
      on_time_pct:    done  ? Math.round(onTime / done * 100) : 100,
    };
  }

  // ── Time stats ───────────────────────────────────────────────────────────────
  const todaySessions = sessions.filter((s) => s.start.slice(0, 10) === todayStr);
  const weekSessions  = sessions.filter((s) => s.start.slice(0, 10) >= weekStartStr && s.start.slice(0, 10) <= weekEndStr);

  const minutesToday = todaySessions.reduce((s: number, x: any) => s + x.duration, 0);
  const minutesWeek  = weekSessions.reduce((s: number, x: any) => s + x.duration, 0);

  // ── Weekly completion chart (last 4 weeks) ───────────────────────────────────
  const weeklyChart: { week: string; completion: number; on_time: number }[] = [];
  for (let w = 3; w >= 0; w--) {
    const wStart = new Date(weekStart); wStart.setDate(wStart.getDate() - w * 7);
    const wEnd   = new Date(wStart);    wEnd.setDate(wStart.getDate() + 6);
    const ws = isoDate(wStart);
    const we = isoDate(wEnd);
    const wTasks = tasks.filter((t) => t.due_date >= ws && t.due_date <= we);
    const wDone  = wTasks.filter((t) => t.status === "done").length;
    const wOnTime = wTasks.filter((t) => t.status === "done" && t.completed_at && t.completed_at.slice(0, 10) <= t.due_date).length;
    weeklyChart.push({
      week: `${wStart.getDate()}.${String(wStart.getMonth() + 1).padStart(2, "0")}`,
      completion: wTasks.length ? Math.round(wDone / wTasks.length * 100) : 0,
      on_time:    wDone         ? Math.round(wOnTime / wDone * 100) : 100,
    });
  }

  return NextResponse.json({
    today:   { ...stats(todayTasks),  minutes: minutesToday, hours: +(minutesToday / 60).toFixed(1) },
    week:    { ...stats(weekTasks),   minutes: minutesWeek,  hours: +(minutesWeek  / 60).toFixed(1) },
    month:   stats(monthTasks),
    weekly_chart: weeklyChart,
    recent_sessions: sessions.slice(-5).reverse(),
  });
}
