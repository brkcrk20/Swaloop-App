import React from 'react';
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
import { SearchPage } from './pages/discovery/SearchPage';
import { NearbyMapPage } from './pages/discovery/NearbyMapPage';
import { FavoritesPage } from './pages/discovery/FavoritesPage';

// Listings Pages
import { ProductDetailPage } from './pages/listings/ProductDetailPage';
import { CreateListingPage } from './pages/listings/CreateListingPage';

// Trade Pages
import { TradeOffersPage } from './pages/trades/TradeOffersPage';
import { TradeRequestsPage } from './pages/trades/TradeRequestsPage';
import { MakeOfferPage } from './pages/trades/MakeOfferPage';
import { TradeDetailPage } from './pages/trades/TradeDetailPage';
import { DisputePage } from './pages/trades/DisputePage';
import { SwipeMatchPage } from './pages/matching/SwipeMatchPage';

// Messages / Chat
import { MessagesPage } from './pages/chat/MessagesPage';

// Notifications
import { NotificationsPage } from './pages/notifications/NotificationsPage';

// Profile Pages
import { ProfilePage } from './pages/profile/ProfilePage';
import { EditProfilePage } from './pages/profile/EditProfilePage';
import { PublicProfilePage } from './pages/profile/PublicProfilePage';
import { ImpactBreakdownPage } from './pages/profile/ImpactBreakdownPage';
import { BadgesPage } from './pages/profile/BadgesPage';

// Loops & Community Pages
import { LoopsPage } from './pages/loops/LoopsPage';
import { PaperclipPage } from './pages/loops/PaperclipPage';
import { MysterySwapPage } from './pages/loops/MysterySwapPage';
import { CommunityPage } from './pages/community/CommunityPage';
import { EventsPage } from './pages/community/EventsPage';

// Trade Steps & Admin Pages
import { TradeProcessPage } from './pages/trades/TradeProcessPage';
import { TradeSuccessPage } from './pages/trades/TradeSuccessPage';
import { AdminDashboardPage } from './pages/admin/AdminDashboardPage';
import { AboutSwaloopPage } from './pages/info/AboutSwaloopPage';

export default function App() {
  return (
    <AppProvider>
      <BrowserRouter>
        <div className="min-h-screen bg-stone-100 dark:bg-stone-950 text-stone-900 dark:text-stone-100 font-sans antialiased selection:bg-emerald-200 selection:text-emerald-900 transition-colors duration-200">
          <div className="min-h-screen flex flex-col max-w-5xl mx-auto bg-stone-50 dark:bg-stone-950 shadow-xl relative border-x border-stone-200/60 dark:border-stone-800/80">
            <Header />

            <main className="flex-1">
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
            </main>

            <BottomNav />
            <ToastContainer />
          </div>
        </div>
      </BrowserRouter>
    </AppProvider>
  );
}
