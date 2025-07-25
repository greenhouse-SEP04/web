import { MemoryRouter, Route, Routes } from "react-router-dom";
import { render, screen } from "@testing-library/react";
import ProtectedRoute from "@/routes/ProtectedRoute";
import { AuthProvider } from "@/context/AuthContext";
import { expect, it } from "vitest";

const renderWithAuth = (ui: React.ReactElement, initial = "/") =>
  render(
    <AuthProvider>
      <MemoryRouter initialEntries={[initial]}>{ui}</MemoryRouter>
    </AuthProvider>
  );

it("redirects unauthenticated users to /login", () => {
  renderWithAuth(
    <Routes>
      <Route element={<ProtectedRoute />}>
        <Route path="/" element={<div>Secret</div>} />
      </Route>
      <Route path="/login" element={<div>LoginPg</div>} />
    </Routes>
  );
  expect(screen.getByText("LoginPg")).toBeInTheDocument();
});
