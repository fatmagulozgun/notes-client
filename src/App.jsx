import { lazy, Suspense } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import MainLayout from "./components/layout/MainLayout";
import ProtectedRoute from "./components/routing/ProtectedRoute";

const DashboardPage = lazy(() => import("./pages/DashboardPage"));
const LoginPage = lazy(() => import("./pages/LoginPage"));
const RegisterPage = lazy(() => import("./pages/RegisterPage"));
const NotesPage = lazy(() => import("./pages/NotesPage"));
const CalendarPage = lazy(() => import("./pages/CalendarPage"));
const ProductivityPage = lazy(() => import("./pages/ProductivityPage"));
const TrashPage = lazy(() => import("./pages/TrashPage"));
const NoteEditorPage = lazy(() => import("./pages/NoteEditorPage"));

function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={null}>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <MainLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<DashboardPage />} />
            <Route path="notes" element={<NotesPage />} />
            <Route path="notes/new" element={<NoteEditorPage />} />
            <Route path="notes/:id" element={<NoteEditorPage />} />
            <Route path="calendar" element={<CalendarPage />} />
            <Route path="productivity" element={<ProductivityPage />} />
            <Route path="trash" element={<TrashPage />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}

export default App;
