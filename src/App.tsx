import React, { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import { RequireAuth, RequireAdmin } from './components/auth/RouteGuards';
import { Header } from './components/layout/Header';
import { BottomNav } from './components/layout/BottomNav';
import { ToastContainer } from './components/layout/ToastContainer';

// Auth Pages
import { SplashPage } from './pages/auth/SplashPage';
import { OnboardingPage } from './pages/auth/OnboardingPage';
import { PhoneAuthPage } from './pages/auth/PhoneAuthPage';
import { OtpVerificationPage } from './pages/auth/OtpVerificationPage';
import { CreateProfilePage } from './pages/auth/CreateProfilePage';

// Discovery Pages
import { DiscoverPage } from './pages/discovery/DiscoverPage';

// Listings Pages

// Trade Pages

// Messages / Chat

// Notifications

// Profile Pages

// Loops & Community Pages

// Trade Steps & Admin Pages

// ── Rota bazlı kod bölme ────────────────────────────────────────────────────
// Önceden 47 rotanın tamamı tek bir 855 KB'lık pakette geliyordu: kullanıcı
// hangi sayfaya girerse girsin hepsi baştan indiriliyordu (denetim bulgusu
// D-03). Açılış akışındaki sayfalar (splash, giriş, keşif) statik import
// olarak kalıyor — onları ertelemek ilk boyamayı geciktirirdi.
const SearchPage = lazy(() => import('./pages/discovery/SearchPage').then((m) => ({ default: m.SearchPage })));
const NearbyMapPage = lazy(() => import('./pages/discovery/NearbyMapPage').then((m) => ({ default: m.NearbyMapPage })));
const FavoritesPage = lazy(() => import('./pages/discovery/FavoritesPage').then((m) => ({ default: m.FavoritesPage })));
const ProductDetailPage = lazy(() => import('./pages/listings/ProductDetailPage').then((m) => ({ default: m.ProductDetailPage })));
const CreateListingPage = lazy(() => import('./pages/listings/CreateListingPage').then((m) => ({ default: m.CreateListingPage })));
const TradeOffersPage = lazy(() => import('./pages/trades/TradeOffersPage').then((m) => ({ default: m.TradeOffersPage })));
const TradeRequestsPage = lazy(() => import('./pages/trades/TradeRequestsPage').then((m) => ({ default: m.TradeRequestsPage })));
const MakeOfferPage = lazy(() => import('./pages/trades/MakeOfferPage').then((m) => ({ default: m.MakeOfferPage })));
const TradeDetailPage = lazy(() => import('./pages/trades/TradeDetailPage').then((m) => ({ default: m.TradeDetailPage })));
const DisputePage = lazy(() => import('./pages/trades/DisputePage').then((m) => ({ default: m.DisputePage })));
const SwipeMatchPage = lazy(() => import('./pages/matching/SwipeMatchPage').then((m) => ({ default: m.SwipeMatchPage })));
const MessagesPage = lazy(() => import('./pages/chat/MessagesPage').then((m) => ({ default: m.MessagesPage })));
const NotificationsPage = lazy(() => import('./pages/notifications/NotificationsPage').then((m) => ({ default: m.NotificationsPage })));
const ProfilePage = lazy(() => import('./pages/profile/ProfilePage').then((m) => ({ default: m.ProfilePage })));
const EditProfilePage = lazy(() => import('./pages/profile/EditProfilePage').then((m) => ({ default: m.EditProfilePage })));
const PublicProfilePage = lazy(() => import('./pages/profile/PublicProfilePage').then((m) => ({ default: m.PublicProfilePage })));
const ImpactBreakdownPage = lazy(() => import('./pages/profile/ImpactBreakdownPage').then((m) => ({ default: m.ImpactBreakdownPage })));
const BadgesPage = lazy(() => import('./pages/profile/BadgesPage').then((m) => ({ default: m.BadgesPage })));
const LoopsPage = lazy(() => import('./pages/loops/LoopsPage').then((m) => ({ default: m.LoopsPage })));
const PaperclipPage = lazy(() => import('./pages/loops/PaperclipPage').then((m) => ({ default: m.PaperclipPage })));
const MysterySwapPage = lazy(() => import('./pages/loops/MysterySwapPage').then((m) => ({ default: m.MysterySwapPage })));
const CommunityPage = lazy(() => import('./pages/community/CommunityPage').then((m) => ({ default: m.CommunityPage })));
const EventsPage = lazy(() => import('./pages/community/EventsPage').then((m) => ({ default: m.EventsPage })));
const TradeProcessPage = lazy(() => import('./pages/trades/TradeProcessPage').then((m) => ({ default: m.TradeProcessPage })));
const TradeSuccessPage = lazy(() => import('./pages/trades/TradeSuccessPage').then((m) => ({ default: m.TradeSuccessPage })));
const AdminDashboardPage = lazy(() => import('./pages/admin/AdminDashboardPage').then((m) => ({ default: m.AdminDashboardPage })));
const AboutSwaloopPage = lazy(() => import('./pages/info/AboutSwaloopPage').then((m) => ({ default: m.AboutSwaloopPage })));

/** Bölünmüş bir rota indirilirken gösterilen ara ekran. */
const RouteFallback: React.FC = () => (
  <div
    className="flex items-center justify-center py-24"
    role="status"
    aria-live="polite"
  >
    <div className="w-8 h-8 rounded-full border-2 border-emerald-700 border-t-transparent animate-spin" />
    <span className="sr-only">Sayfa yükleniyor…</span>
  </div>
);

export default function App() {
  return (
    <AppProvider>
      <BrowserRouter>
        <div className="min-h-screen bg-stone-100 dark:bg-stone-950 text-stone-900 dark:text-stone-100 font-sans antialiased selection:bg-emerald-200 selection:text-emerald-900 transition-colors duration-200">
          <div className="min-h-screen flex flex-col max-w-5xl mx-auto bg-stone-50 dark:bg-stone-950 shadow-xl relative border-x border-stone-200/60 dark:border-stone-800/80">
            <Header />

            <main className="flex-1">
              <Suspense fallback={<RouteFallback />}>
                <Routes>
                  {/* Auth & Onboarding */}
                  <Route path="/" element={<SplashPage />} />
                  <Route path="/onboarding" element={<OnboardingPage />} />
                  <Route path="/giris" element={<PhoneAuthPage isRegister={false} />} />
                  <Route path="/kayit" element={<PhoneAuthPage isRegister={true} />} />
                  <Route path="/dogrulama" element={<OtpVerificationPage />} />
                  <Route path="/profil-olustur" element={<CreateProfilePage />} />

                  {/* Discovery & Search */}
                  <Route path="/kesfet" element={<DiscoverPage />} />
                  <Route path="/arama" element={<SearchPage />} />
                  <Route path="/harita" element={<NearbyMapPage />} />
                  <Route path="/favoriler" element={<RequireAuth><FavoritesPage /></RequireAuth>} />

                  {/* Listings */}
                  <Route path="/ilan/:id" element={<ProductDetailPage />} />
                  <Route path="/ilan-ver" element={<RequireAuth><CreateListingPage /></RequireAuth>} />

                  {/* Trades */}
                  <Route path="/takaslarim" element={<RequireAuth><TradeOffersPage /></RequireAuth>} />
                  <Route path="/takas-istekleri" element={<RequireAuth><TradeRequestsPage /></RequireAuth>} />
                  <Route path="/istekler" element={<RequireAuth><TradeRequestsPage /></RequireAuth>} />
                  <Route path="/eslesme" element={<RequireAuth><SwipeMatchPage /></RequireAuth>} />
                  <Route path="/takas-eslesme" element={<RequireAuth><SwipeMatchPage /></RequireAuth>} />
                  <Route path="/kaydir" element={<RequireAuth><SwipeMatchPage /></RequireAuth>} />
                  <Route path="/swipe" element={<RequireAuth><SwipeMatchPage /></RequireAuth>} />
                  <Route path="/teklif-ver" element={<RequireAuth><MakeOfferPage /></RequireAuth>} />
                  <Route path="/teklif/:id" element={<RequireAuth><TradeDetailPage /></RequireAuth>} />
                  <Route path="/takas-sureci" element={<RequireAuth><TradeProcessPage /></RequireAuth>} />
                  <Route path="/takas-sureci/:id" element={<RequireAuth><TradeProcessPage /></RequireAuth>} />
                  <Route path="/takas-tamamlandi" element={<RequireAuth><TradeSuccessPage /></RequireAuth>} />
                  <Route path="/takas-tamamlandi/:id" element={<RequireAuth><TradeSuccessPage /></RequireAuth>} />
                  <Route path="/dispute" element={<RequireAuth><DisputePage /></RequireAuth>} />

                  {/* Messages */}
                  <Route path="/mesajlar" element={<RequireAuth><MessagesPage /></RequireAuth>} />
                  <Route path="/mesajlar/:id" element={<RequireAuth><MessagesPage /></RequireAuth>} />

                  {/* Notifications */}
                  <Route path="/bildirimler" element={<RequireAuth><NotificationsPage /></RequireAuth>} />

                  {/* Profile */}
                  <Route path="/profil" element={<RequireAuth><ProfilePage /></RequireAuth>} />
                  <Route path="/profil/duzenle" element={<RequireAuth><EditProfilePage /></RequireAuth>} />
                  <Route path="/profil/:id" element={<RequireAuth><PublicProfilePage /></RequireAuth>} />
                  <Route path="/etkim" element={<RequireAuth><ImpactBreakdownPage /></RequireAuth>} />
                  <Route path="/rozetlerim" element={<RequireAuth><BadgesPage /></RequireAuth>} />

                  {/* Loops & Community */}
                  <Route path="/donguler" element={<RequireAuth><LoopsPage /></RequireAuth>} />
                  <Route path="/loop" element={<RequireAuth><LoopsPage /></RequireAuth>} />
                  <Route path="/takas-yolculugum" element={<RequireAuth><PaperclipPage /></RequireAuth>} />
                  <Route path="/yolculuk" element={<RequireAuth><PaperclipPage /></RequireAuth>} />
                  <Route path="/paperclip" element={<RequireAuth><PaperclipPage /></RequireAuth>} />
                  <Route path="/kirmizi-atas" element={<RequireAuth><PaperclipPage /></RequireAuth>} />
                  <Route path="/mystery-swap" element={<RequireAuth><MysterySwapPage /></RequireAuth>} />
                  <Route path="/gizemli-kutu" element={<RequireAuth><MysterySwapPage /></RequireAuth>} />
                  <Route path="/topluluk" element={<RequireAuth><CommunityPage /></RequireAuth>} />
                  <Route path="/etkinlikler" element={<RequireAuth><EventsPage /></RequireAuth>} />

                  {/* Admin & About */}
                  <Route path="/admin" element={<RequireAdmin><AdminDashboardPage /></RequireAdmin>} />
                  <Route path="/hakkimizda" element={<AboutSwaloopPage />} />

                  {/* Fallback */}
                  <Route path="*" element={<Navigate to="/kesfet" replace />} />
                </Routes>
              </Suspense>
            </main>

            <BottomNav />
            <ToastContainer />
          </div>
        </div>
      </BrowserRouter>
    </AppProvider>
  );
}
