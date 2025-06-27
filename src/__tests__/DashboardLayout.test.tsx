import { render, fireEvent, screen } from '@testing-library/react';
import { vi } from 'vitest';
import DashboardLayout from '@/layouts/DashboardLayout';
import { MemoryRouter } from 'react-router-dom';

vi.mock('@/context/AuthContext', () => ({
  useAuth: () => ({
    user: { userName: 'admin', roles: ['Admin'] },
    logout: vi.fn(),
  }),
}));

it('shows Admin link and toggles burger menu', () => {
  render(
    <MemoryRouter>
      <DashboardLayout />
    </MemoryRouter>,
  );

  // admin link exists
  expect(screen.getByRole('link', { name: /users/i })).toBeInTheDocument();

  // burger opens/closes menu (visible only on small screens; we check class toggle)
  const burger = screen.getByRole('button', { name: /toggle menu/i });
  fireEvent.click(burger);
  expect(screen.getByText(/devices/i).parentElement).toHaveClass('block');
  fireEvent.click(burger);
  expect(screen.getByText(/devices/i).parentElement).toHaveClass('hidden');
});
