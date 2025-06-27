import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { render, screen } from '@testing-library/react';
import ProtectedRoute from '@/routes/ProtectedRoute';
import { vi } from 'vitest';

vi.mock('@/context/AuthContext', () => ({
  useAuth: () => ({ authed: false, user: null }),
}));

it('redirects unauthenticated user to /login', () => {
  render(
    <MemoryRouter initialEntries={['/secret']}>
      <Routes>
        <Route element={<ProtectedRoute />}>
          <Route path="/secret" element={<div>Secret</div>} />
        </Route>
        <Route path="/login" element={<div>LoginPg</div>} />
      </Routes>
    </MemoryRouter>,
  );
  expect(screen.getByText(/loginpg/i)).toBeInTheDocument();
});
