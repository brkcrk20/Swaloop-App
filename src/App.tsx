import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
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
                <Route path="/favoriler" element={<FavoritesPage />} />

                {/* Listings */}
                <Route path="/ilan/:id" element={<ProductDetailPage />} />
                <Route path="/ilan-ver" element={<CreateListingPage />} />

                {/* Trades */}
                <Route path="/takaslarim" element={<TradeOffersPage />} />
                <Route path="/takas-istekleri" element={<TradeRequestsPage />} />
                <Route path="/istekler" element={<TradeRequestsPage />} />
                <Route path="/eslesme" element={<SwipeMatchPage />} />
                <Route path="/takas-eslesme" element={<SwipeMatchPage />} />
                <Route path="/kaydir" element={<SwipeMatchPage />} />
                <Route path="/swipe" element={<SwipeMatchPage />} />
                <Route path="/teklif-ver" element={<MakeOfferPage />} />
                <Route path="/teklif/:id" element={<TradeDetailPage />} />
                <Route path="/takas-sureci" element={<TradeProcessPage />} />
                <Route path="/takas-sureci/:id" element={<TradeProcessPage />} />
                <Route path="/takas-tamamlandi" element={<TradeSuccessPage />} />
                <Route path="/takas-tamamlandi/:id" element={<TradeSuccessPage />} />
                <Route path="/dispute" element={<DisputePage />} />

                {/* Messages */}
                <Route path="/mesajlar" element={<MessagesPage />} />
                <Route path="/mesajlar/:id" element={<MessagesPage />} />

                {/* Notifications */}
                <Route path="/bildirimler" element={<NotificationsPage />} />

                {/* Profile */}
                <Route path="/profil" element={<ProfilePage />} />
                <Route path="/profil/duzenle" element={<EditProfilePage />} />
                <Route path="/profil/:id" element={<PublicProfilePage />} />
                <Route path="/etkim" element={<ImpactBreakdownPage />} />
                <Route path="/rozetlerim" element={<BadgesPage />} />

                {/* Loops & Community */}
                <Route path="/donguler" element={<LoopsPage />} />
                <Route path="/loop" element={<LoopsPage />} />
                <Route path="/takas-yolculugum" element={<PaperclipPage />} />
                <Route path="/yolculuk" element={<PaperclipPage />} />
                <Route path="/paperclip" element={<PaperclipPage />} />
                <Route path="/kirmizi-atas" element={<PaperclipPage />} />
                <Route path="/mystery-swap" element={<MysterySwapPage />} />
                <Route path="/gizemli-kutu" element={<MysterySwapPage />} />
                <Route path="/topluluk" element={<CommunityPage />} />
                <Route path="/etkinlikler" element={<EventsPage />} />

                {/* Admin & About */}
                <Route path="/admin" element={<AdminDashboardPage />} />
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
