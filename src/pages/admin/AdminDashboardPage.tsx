import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { adminService } from '../../services/adminService';
import {
  Users,
  Repeat,
  Leaf,
  ShieldAlert,
  BarChart3,
  Layers,
  MessageSquare,
  FileText,
  Calendar,
  Sparkles,
  Settings,
  Bell,
  CheckCircle,
  XCircle,
  Eye,
  ArrowLeft,
  Filter,
  ShieldCheck,
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
  Activity,
  Package,
} from 'lucide-react';

export const AdminDashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { showToast } = useApp();

  const [activeSidebarItem, setActiveSidebarItem] = useState<string>('overview');

  const sidebarMenuItems = [
    { id: 'overview', label: 'Genel Bakış', icon: BarChart3 },
    { id: 'users', label: 'Kullanıcılar', icon: Users },
    { id: 'listings', label: 'İlanlar', icon: Package },
    { id: 'trades', label: 'Takaslar', icon: Repeat },
    { id: 'loops', label: "Loop'lar", icon: Layers },
    { id: 'messages', label: 'Mesajlar', icon: MessageSquare },
    { id: 'reports', label: 'Raporlar', icon: ShieldAlert, badge: '23' },
    { id: 'events', label: 'Etkinlikler', icon: Calendar },
    { id: 'community', label: 'Topluluk', icon: Users },
    { id: 'content', label: 'İçerikler', icon: FileText },
    { id: 'svs', label: 'SVS & Etki', icon: Leaf },
    { id: 'notifications', label: 'Bildirimler', icon: Bell },
    { id: 'settings', label: 'Ayarlar', icon: Settings },
  ];

  const kpis = [
    {
      id: 'total_users',
      title: 'Toplam Kullanıcı',
      value: '24.580',
      change: '+12.4%',
      isPositive: true,
      icon: Users,
    },
    {
      id: 'active_users',
      title: 'Aktif Kullanıcı',
      value: '8.941',
      change: '+0.7%',
      isPositive: true,
      icon: Activity,
    },
    {
      id: 'completed_trades',
      title: 'Tamamlanan Takas',
      value: '15.247',
      change: '+115.3%',
      isPositive: true,
      icon: Repeat,
    },
    {
      id: 'total_loops',
      title: 'Toplam Loop',
      value: '1.892',
      change: '+11.2%',
      isPositive: true,
      icon: Layers,
    },
    {
      id: 'svs_impact',
      title: 'Toplam SVS Etkisi',
      value: '18.247 kg',
      change: '+19.1%',
      isPositive: true,
      icon: Leaf,
    },
    {
      id: 'pending_reports',
      title: 'Bekleyen Rapor',
      value: '23',
      change: '-4.3%',
      isPositive: false,
      icon: ShieldAlert,
    },
  ];

  const recentActivities = [
    {
      id: 'act-1',
      user: 'Aslı T. & Mehmet K.',
      action: 'Takas tamamlandı (Canon EOS 200D ⇄ Bianchi Bisiklet)',
      time: '2 dakika önce',
      badge: '+8.6 kg CO₂e',
    },
    {
      id: 'act-2',
      user: 'Zeynep B.',
      action: 'Yeni döngüsel Loop başlattı (3 Katılımcı)',
      time: '14 dakika önce',
      badge: 'Loop Aktif',
    },
    {
      id: 'act-3',
      user: 'Kerem D.',
      action: 'Mystery Swap kutusu açtı (Retro Klavye kazandı)',
      time: '32 dakika önce',
      badge: 'Mystery Swap',
    },
    {
      id: 'act-4',
      user: 'Kadıköy Takas Buluşması',
      action: '18 yeni kullanıcı etkinliğe kayıt oldu',
      time: '1 saat önce',
      badge: 'Etkinlik RSVP',
    },
  ];

  const categoryDistribution = [
    { name: 'Elektronik', percent: 28, color: 'bg-emerald-500' },
    { name: 'Ev & Yaşam', percent: 22, color: 'bg-teal-500' },
    { name: 'Spor & Outdoor', percent: 18, color: 'bg-amber-500' },
    { name: 'Moda & Giyim', percent: 16, color: 'bg-cyan-500' },
    { name: 'Hobi & Sanat', percent: 9, color: 'bg-rose-400' },
    { name: 'Diğer', percent: 7, color: 'bg-stone-500' },
  ];

  return (
    <div className="min-h-screen bg-[#0f172a] text-slate-100 flex flex-col md:flex-row pb-24 md:pb-0">
      {/* 13-Item Dark Sidebar Matching Screen 20 */}
      <aside className="w-full md:w-64 bg-[#0b1120] border-r border-slate-800/80 flex flex-col shrink-0">
        {/* Brand Header */}
        <div className="p-5 border-b border-slate-800/80 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-emerald-500 shadow-md shadow-emerald-500/50 animate-pulse" />
              <span className="text-base font-black text-white tracking-wider uppercase font-display">
                Swaloop
              </span>
            </div>
            <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-widest block mt-0.5">
              Admin & Moderasyon
            </span>
          </div>

          <button
            type="button"
            onClick={() => navigate('/kesfet')}
            className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white text-xs flex items-center gap-1 transition-colors"
            title="Kullanıcı Görünümüne Dön"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
        </div>

        {/* 13 Menu Items Navigation */}
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto max-h-[calc(100vh-140px)]">
          {sidebarMenuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeSidebarItem === item.id;

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveSidebarItem(item.id)}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  isActive
                    ? 'bg-emerald-700/30 text-emerald-300 border border-emerald-500/40 shadow-xs'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-emerald-400' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span className="px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 text-[10px] font-bold border border-rose-500/30">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* User mode switcher in sidebar footer */}
        <div className="p-3 border-t border-slate-800/80">
          <button
            type="button"
            onClick={() => navigate('/kesfet')}
            className="w-full py-2.5 rounded-xl bg-emerald-800 hover:bg-emerald-700 text-white text-xs font-bold transition-colors flex items-center justify-center gap-1.5"
          >
            <span>Kullanıcı Moduna Geç</span>
            <ArrowLeft className="w-3.5 h-3.5 rotate-180" />
          </button>
        </div>
      </aside>

      {/* Main Dashboard Area Matching Screen 20 */}
      <main className="flex-1 p-4 md:p-6 space-y-6 overflow-y-auto">
        {/* Top bar info */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-800">
          <div>
            <h1 className="text-xl font-black text-white font-display">Yönetim & Canlı Metrikler</h1>
            <p className="text-xs text-slate-400">Canlı platform takas trafiği ve güvenlik denetimi</p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400 bg-slate-800/80 px-3 py-1.5 rounded-xl border border-slate-700">
              📅 Mayıs 2024 (Gerçek Zamanlı)
            </span>
          </div>
        </div>

        {/* 6 Metric KPI Cards Matching Screen 20 Top Row */}
        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
          {kpis.map((kpi) => {
            const Icon = kpi.icon;
            return (
              <div
                key={kpi.id}
                className="p-4 rounded-2xl bg-[#1e293b]/80 border border-slate-700/70 shadow-xs space-y-2 hover:border-emerald-500/50 transition-colors"
              >
                <div className="flex items-center justify-between text-slate-400 text-xs">
                  <span className="truncate text-[11px] font-medium">{kpi.title}</span>
                  <Icon className="w-4 h-4 text-slate-400" />
                </div>
                <div className="text-xl font-black text-white tracking-tight">{kpi.value}</div>
                <div className="flex items-center gap-1 text-[11px] font-bold">
                  {kpi.isPositive ? (
                    <span className="text-emerald-400 flex items-center gap-0.5">
                      <ArrowUpRight className="w-3 h-3" />
                      {kpi.change}
                    </span>
                  ) : (
                    <span className="text-rose-400 flex items-center gap-0.5">
                      <ArrowDownRight className="w-3 h-3" />
                      {kpi.change}
                    </span>
                  )}
                  <span className="text-slate-400 text-[10px] font-normal">geçen aya göre</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Charts & Analytics Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Takas İstatistikleri Line Chart (2 Cols) */}
          <div className="lg:col-span-2 p-5 rounded-3xl bg-[#1e293b]/90 border border-slate-700/70 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-white">Takas İstatistikleri</h3>
                <span className="text-xs text-slate-400">Yeni Takaslar vs Tamamlananlar</span>
              </div>
              <div className="flex items-center gap-3 text-xs">
                <span className="flex items-center gap-1 text-emerald-400 font-semibold">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                  Yeni Takaslar
                </span>
                <span className="flex items-center gap-1 text-teal-400 font-semibold">
                  <span className="w-2.5 h-2.5 rounded-full bg-teal-400" />
                  Tamamlananlar
                </span>
              </div>
            </div>

            {/* Custom SVG Line Chart matching mockup timeline points: 1 May, 8 May, 15 May, 22 May, 29 May */}
            <div className="h-44 w-full pt-4">
              <svg viewBox="0 0 500 160" className="w-full h-full overflow-visible">
                {/* Horizontal Grid lines */}
                <line x1="0" y1="30" x2="500" y2="30" stroke="#334155" strokeDasharray="3 3" strokeWidth="1" />
                <line x1="0" y1="80" x2="500" y2="80" stroke="#334155" strokeDasharray="3 3" strokeWidth="1" />
                <line x1="0" y1="130" x2="500" y2="130" stroke="#334155" strokeDasharray="3 3" strokeWidth="1" />

                {/* Line 1: Yeni Takaslar */}
                <polyline
                  fill="none"
                  stroke="#10b981"
                  strokeWidth="3"
                  points="20,120 120,85 240,65 360,40 480,25"
                />
                {/* Line 2: Tamamlananlar */}
                <polyline
                  fill="none"
                  stroke="#2dd4bf"
                  strokeWidth="3"
                  points="20,135 120,110 240,90 360,65 480,45"
                />

                {/* Data points */}
                <circle cx="20" cy="120" r="4" fill="#10b981" />
                <circle cx="120" cy="85" r="4" fill="#10b981" />
                <circle cx="240" cy="65" r="4" fill="#10b981" />
                <circle cx="360" cy="40" r="4" fill="#10b981" />
                <circle cx="480" cy="25" r="4" fill="#10b981" />
              </svg>
            </div>

            {/* X-axis labels */}
            <div className="flex justify-between text-[11px] text-slate-400 pt-1 border-t border-slate-700/60">
              <span>01 May</span>
              <span>08 May</span>
              <span>15 May</span>
              <span>22 May</span>
              <span>29 May</span>
            </div>
          </div>

          {/* Kategorilere Göre İlanlar Donut Breakdown (1 Col) */}
          <div className="p-5 rounded-3xl bg-[#1e293b]/90 border border-slate-700/70 space-y-4 flex flex-col justify-between">
            <div>
              <h3 className="text-sm font-bold text-white">Kategorilere Göre İlanlar</h3>
              <span className="text-xs text-slate-400">Aktif ilan dağılımı</span>
            </div>

            {/* Categories list with progress bars */}
            <div className="space-y-2.5">
              {categoryDistribution.map((cat) => (
                <div key={cat.name} className="space-y-1">
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-slate-300">{cat.name}</span>
                    <span className="text-emerald-400 font-bold">%{cat.percent}</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                    <div
                      className={`h-full ${cat.color} rounded-full`}
                      style={{ width: `${cat.percent}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="text-[10px] text-slate-400 text-center pt-2 border-t border-slate-700/60">
              Toplam 38.420 aktif takas ilanı analiz edildi
            </div>
          </div>
        </div>

        {/* Live Stream Activities & Quick Moderation Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Son Aktiviteler (2 Cols) */}
          <div className="lg:col-span-2 p-5 rounded-3xl bg-[#1e293b]/90 border border-slate-700/70 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Activity className="w-4 h-4 text-emerald-400" />
                <span>Canlı Platform Hareketleri</span>
              </h3>
              <span className="text-[11px] text-emerald-400 font-bold">Canlı Akış</span>
            </div>

            <div className="divide-y divide-slate-800">
              {recentActivities.map((act) => (
                <div key={act.id} className="py-3 flex items-center justify-between gap-3">
                  <div>
                    <span className="text-xs font-bold text-slate-200 block">{act.user}</span>
                    <span className="text-xs text-slate-400">{act.action}</span>
                    <span className="text-[10px] text-slate-500 block mt-0.5">{act.time}</span>
                  </div>
                  <span className="px-2.5 py-1 rounded-full bg-emerald-950/80 text-emerald-300 text-[10px] font-bold border border-emerald-800/80 whitespace-nowrap">
                    {act.badge}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Hızlı İşlemler (1 Col) */}
          <div className="p-5 rounded-3xl bg-[#1e293b]/90 border border-slate-700/70 space-y-3 flex flex-col justify-between">
            <h3 className="text-sm font-bold text-white">Hızlı Moderasyon İşlemleri</h3>

            <div className="space-y-2">
              <button
                type="button"
                onClick={() => {
                  setActiveSidebarItem('reports');
                  showToast('Raporlar Listelendi', '23 bekleyen şikayet inceleniyor.', 'info');
                }}
                className="w-full py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-rose-300 border border-rose-500/20 text-left flex items-center justify-between"
              >
                <span>Şüpheli İlanları İncele (23)</span>
                <ShieldAlert className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={() => {
                  setActiveSidebarItem('events');
                  showToast('Etkinlik Yönetimi', 'Onay bekleyen etkinlikler hazır.', 'info');
                }}
                className="w-full py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-teal-300 border border-teal-500/20 text-left flex items-center justify-between"
              >
                <span>Takas Buluşması Onayla</span>
                <Calendar className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={() => {
                  showToast('SVS Raporu İndirildi', 'Mayıs 2024 karbon tasarrufu dışa aktarıldı.', 'success');
                }}
                className="w-full py-2.5 px-3 rounded-xl bg-emerald-800 hover:bg-emerald-700 text-xs font-bold text-white text-left flex items-center justify-between"
              >
                <span>Aylık SVS Raporunu İndir</span>
                <Leaf className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-800/40 text-[11px] text-emerald-200 leading-relaxed">
              ✓ Swaloop Hakem Sistemi 7/24 uyuşmazlıkları tarafsız incelemektedir.
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};
