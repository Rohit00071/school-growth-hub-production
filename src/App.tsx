import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { lazy, Suspense } from "react";
import { AuthProvider } from "./hooks/useAuth";
import ProtectedRoute from "./components/ProtectedRoute";

// Lazy load pages for code splitting
const LandingPage = lazy(() => import("./pages/LandingPage"));
const Auth = lazy(() => import("./pages/Auth"));
const TeacherDashboard = lazy(() => import("./pages/TeacherDashboard"));
const LeaderDashboard = lazy(() => import("./pages/LeaderDashboard"));
const AdminDashboard = lazy(() => import("./pages/AdminDashboard"));
const ManagementDashboard = lazy(() => import("./pages/ManagementDashboard"));
const NotFound = lazy(() => import("./pages/NotFound"));

// Fallback loading component
const PageLoader = () => (
  <div className="flex items-center justify-center h-screen w-full">
    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
  </div>
);

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      gcTime: 10 * 60 * 1000,
      retry: 2,
      refetchOnWindowFocus: false,
    },
  },
});

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter future={{
        v7_startTransition: true,
        v7_relativeSplatPath: true
      }}>
        <AuthProvider>
          <Suspense fallback={<PageLoader />}>
            <Routes>
              <Route path="/" element={<LandingPage />} />
              <Route path="/login" element={<Auth />} />

              <Route
                path="/teacher/*"
                element={
                  <ProtectedRoute allowedRoles={['TEACHER', 'ADMIN', 'SUPERADMIN']}>
                    <TeacherDashboard />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/leader/*"
                element={
                  <ProtectedRoute allowedRoles={['LEADER', 'ADMIN', 'SUPERADMIN']}>
                    <LeaderDashboard />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/admin/*"
                element={
                  <ProtectedRoute allowedRoles={['ADMIN', 'SUPERADMIN']}>
                    <AdminDashboard />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/management/*"
                element={
                  <ProtectedRoute allowedRoles={['MANAGEMENT', 'SUPERADMIN']}>
                    <ManagementDashboard />
                  </ProtectedRoute>
                }
              />

              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
