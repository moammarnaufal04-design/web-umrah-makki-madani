import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import "@/App.css";
import { Toaster } from "@/components/ui/sonner";
import { SiteProvider } from "@/context/SiteContext";
import { AuthProvider, ProtectedRoute } from "@/context/AuthContext";
import { PublicLayout } from "@/components/public/PublicLayout";
import { AdminLayout } from "@/components/admin/AdminLayout";

import Home from "@/pages/public/Home";
import Packages from "@/pages/public/Packages";
import PackageDetail from "@/pages/public/PackageDetail";
import Articles from "@/pages/public/Articles";
import ArticleDetail from "@/pages/public/ArticleDetail";
import About from "@/pages/public/About";
import FaqPage from "@/pages/public/FaqPage";
import Contact from "@/pages/public/Contact";
import LegalPage from "@/pages/public/LegalPage";
import NotFound from "@/pages/public/NotFound";

import Login from "@/pages/admin/Login";
import Dashboard from "@/pages/admin/Dashboard";
import Categories from "@/pages/admin/Categories";
import AdminPackages from "@/pages/admin/Packages";
import PackageForm from "@/pages/admin/PackageForm";
import Registrations from "@/pages/admin/Registrations";
import Customers from "@/pages/admin/Customers";
import Payments from "@/pages/admin/Payments";
import Messages from "@/pages/admin/Messages";
import Media from "@/pages/admin/Media";
import AdminArticles from "@/pages/admin/Articles";
import ArticleForm from "@/pages/admin/ArticleForm";
import Homepage from "@/pages/admin/Homepage";
import { Faqs, Testimonials } from "@/pages/admin/WebsiteCrud";
import { AboutSettings, ContactSettings, SocialSettings } from "@/pages/admin/WebsiteSettings";
import { ArticleCategories, Tags } from "@/pages/admin/ContentTaxonomy";
import { GeneralSettings, LegalSettings, SeoSettings, WhatsAppSettings } from "@/pages/admin/SiteSettings";
import Account from "@/pages/admin/Account";

function App() {
  return (
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
      <BrowserRouter>
        <SiteProvider>
          <AuthProvider>
            <Routes>
              <Route element={<PublicLayout />}>
                <Route path="/" element={<Home />} />
                <Route path="/packages" element={<Packages group="ALL" />} />
                <Route path="/packages/umrah" element={<Packages group="UMRAH" />} />
                <Route path="/packages/haji" element={<Packages group="HAJI" />} />
                <Route path="/packages/wisata" element={<Packages group="WISATA" />} />
                <Route path="/packages/:slug" element={<PackageDetail />} />
                <Route path="/articles" element={<Articles />} />
                <Route path="/articles/:slug" element={<ArticleDetail />} />
                <Route path="/about" element={<About />} />
                <Route path="/faq" element={<FaqPage />} />
                <Route path="/contact" element={<Contact />} />
                <Route path="/legal" element={<LegalPage type="legal" />} />
                <Route path="/privacy" element={<LegalPage type="privacy" />} />
                <Route path="/terms" element={<LegalPage type="terms" />} />
                <Route path="*" element={<NotFound />} />
              </Route>

              <Route path="/admin/login" element={<Login />} />
              <Route path="/admin" element={<ProtectedRoute><AdminLayout /></ProtectedRoute>}>
                <Route index element={<Dashboard />} />
                <Route path="website" element={<Navigate to="/admin/website/homepage" replace />} />
                <Route path="website/homepage" element={<Homepage />} />
                <Route path="website/about" element={<AboutSettings />} />
                <Route path="website/testimonials" element={<Testimonials />} />
                <Route path="website/faq" element={<Faqs />} />
                <Route path="website/contact" element={<ContactSettings />} />
                <Route path="website/social" element={<SocialSettings />} />
                <Route path="website/media" element={<Media />} />
                <Route path="products" element={<Navigate to="/admin/products/packages" replace />} />
                <Route path="products/categories" element={<Categories />} />
                <Route path="products/packages" element={<AdminPackages />} />
                <Route path="products/packages/:id" element={<PackageForm />} />
                <Route path="customers" element={<Navigate to="/admin/customers/registrations" replace />} />
                <Route path="customers/jamaah" element={<Customers />} />
                <Route path="customers/registrations" element={<Registrations />} />
                <Route path="customers/payments" element={<Payments />} />
                <Route path="customers/messages" element={<Messages />} />
                <Route path="content" element={<Navigate to="/admin/content/articles" replace />} />
                <Route path="content/articles" element={<AdminArticles />} />
                <Route path="content/articles/:id" element={<ArticleForm />} />
                <Route path="content/categories" element={<ArticleCategories />} />
                <Route path="content/tags" element={<Tags />} />
                <Route path="settings" element={<Navigate to="/admin/settings/general" replace />} />
                <Route path="settings/general" element={<GeneralSettings />} />
                <Route path="settings/seo" element={<SeoSettings />} />
                <Route path="settings/whatsapp" element={<WhatsAppSettings />} />
                <Route path="settings/legal" element={<LegalSettings />} />
                <Route path="settings/account" element={<Account />} />
                <Route path="*" element={<Navigate to="/admin" replace />} />
              </Route>
            </Routes>
            <Toaster richColors position="top-right" closeButton />
          </AuthProvider>
        </SiteProvider>
      </BrowserRouter>
    </ThemeProvider>
  );
}

export default App;
