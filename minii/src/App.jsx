import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";

/* ===== COMMON ===== */
import Intro from "./components/Intro";
import ProtectedVerify from "./components/ProtectedVerify";

/* ===== ADMIN ===== */
import AdminLogin from "./pages/admin/AdminLogin";
import Rlogin from "./components/LS/Rlogin";
import Rsign from "./components/LS/Rsign";

/* ===== RESIDENT LAYOUT ===== */
import ResidentLayout from "./pages/resident/ResidentLayout";
import Role from "./components/Role/Role";

/* ===== RESIDENT PAGES ===== */
import RHome from "./pages/pages/RHome";
import RAlerts from "./pages/pages/RAlerts";
import RAlertsNotices from "./pages/pages/RAlertsNotices";
import RBudget from "./pages/pages/RBudget";
import RFeed from "./pages/pages/RFeed";
import RChat from "./pages/pages/RChat";
import RMarket from "./pages/pages/RMarket";
import RProfile from "./pages/pages/RProfile";

import RGovNotices from "./pages/pages/RGovNotices";
import REvents from "./pages/pages/REvents";
import RPolls from "./pages/pages/RPolls";
import RTickets from "./pages/pages/RTickets";
import RComplaints from "./pages/pages/RComplaints";
import RSuggestions from "./pages/pages/RSuggestions";
import RServices from "./pages/pages/RServices";
import RWorks from "./pages/pages/RWorks";
import RVolunteers from "./pages/pages/RVolunteers";
import ResidentDirectory from "./pages/pages/ResidentDirectory";
import RNotifications from "./pages/pages/RNotifications";
import RMap from "./pages/pages/RMap";
import RMyOrders from "./pages/pages/RMyOrders";
import RSellerOrders from "./pages/pages/RSellerOrders";
import RProduct from "./pages/pages/RProduct";
import RSellerAddProduct from "./pages/pages/RSellerAddProduct";
import Ktpm from "./pages/visitor/Ktpm";

/* ===== VISITOR ===== */
import VisitorSelect from "./pages/visitor/VisitorSelect";
import VisitorPanel from "./pages/visitors/VisitorPanel";
import Verify from "./components/LS/Verify";
import AdminDashboard from "./pages/admin/AdminDashboard";

/* ===== VISITOR TOWN SUB-PAGES ===== */
import TownLayout from "./pages/visitor/town/TownLayout";
import TownHome from "./pages/visitor/town/TownHome";
import PlacesList from "./pages/visitor/town/PlacesList";
import PlacesDetail from "./pages/visitor/town/PlacesDetail";
import AnnouncementsPage from "./pages/visitor/town/AnnouncementsPage";
import Travel from "./pages/visitor/town/Travel";
import Emergency from "./pages/visitor/town/Emergency";
import ComplaintsPage from "./pages/visitor/town/ComplaintsPage";
import WarningPlaces from "./pages/visitor/town/WarningPlaces";
import TownMap from "./pages/visitor/town/TownMap";
import ServicesPage from "./pages/visitor/town/ServicesPage";

export default function App() {
  return (
    <Routes>
      {/* Default */}
      <Route path="/" element={<Intro />} />
      <Route path="/role" element={<Role />} />

      {/* Resident Auth Flow */}
      <Route path="/resident/verify" element={<Verify />} />
      <Route
        path="/resident/signup"
        element={
          <ProtectedVerify>
            <Rsign />
          </ProtectedVerify>
        }
      />
      <Route path="/resident/login" element={<Rlogin />} />

      <Route path="/ktpm" element={<Ktpm />} />

      {/* ===== ADMIN ===== */}
      <Route path="/admin/login" element={<AdminLogin />} />
      <Route path="/admin/dashboard" element={<AdminDashboard />} />
      {/* ===== RESIDENT ===== */}
      <Route path="/resident/:townSlug" element={<ResidentLayout />}>
        <Route index element={<RHome />} />
        <Route path="home" element={<RHome />} />


        <Route path="alerts" element={<RAlerts />} />
        <Route path="alerts-notices" element={<RAlertsNotices />} />
        <Route path="budget" element={<RBudget />} />
        <Route path="feed" element={<RFeed />} />
        <Route path="chat" element={<RChat />} />
        <Route path="market" element={<RMarket />} />
        <Route path="profile" element={<RProfile />} />

        {/* EXTRA FEATURES */}
        <Route path="notices" element={<RGovNotices />} />
        <Route path="events" element={<REvents />} />
        <Route path="polls" element={<RPolls />} />
        <Route path="tickets" element={<RTickets />} />
        <Route path="complaints" element={<RComplaints />} />
        <Route path="suggestions" element={<RSuggestions />} />
        <Route path="services" element={<RServices />} />
        <Route path="works" element={<RWorks />} />
        <Route path="volunteers" element={<RVolunteers />} />
        <Route path="directory" element={<ResidentDirectory />} />
        <Route path="notifications" element={<RNotifications />} />
        <Route path="map" element={<RMap />} />
        <Route path="orders" element={<RMyOrders />} />
        <Route path="seller/orders" element={<RSellerOrders />} />
        <Route path="product/:id" element={<RProduct />} />
        <Route path="seller/add-product" element={<RSellerAddProduct />} />
      </Route>

      {/* ===== VISITOR ===== */}
      <Route path="/visitor" element={<VisitorSelect />} />
      <Route path="/visitor/panel" element={<VisitorPanel />} />

      {/* TOWN ROUTES */}
      <Route path="/town/:townSlug" element={<TownLayout />}>
        <Route index element={<TownHome />} />
        <Route path="places" element={<PlacesList />} />
        <Route path="place/:id" element={<PlacesDetail />} />
        <Route path="services" element={<ServicesPage />} />
        <Route path="announcements" element={<AnnouncementsPage />} />
        <Route path="travel" element={<Travel />} />
        <Route path="complaints" element={<ComplaintsPage />} />
        <Route path="emergency" element={<Emergency />} />
        <Route path="warnings" element={<WarningPlaces />} />
        <Route path="warnings" element={<WarningPlaces />} />
      </Route>
      <Route path="/town/:townSlug/map" element={<TownMap />} />
    </Routes>
  );
}