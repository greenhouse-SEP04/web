import { render, fireEvent, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { vi } from 'vitest';
import LoginPage from '@/pages/LoginPage';

const loginMock = vi.fn();
vi.useFakeTimers();   // drives React’s micro-task queue deterministically

vi.mock('@/context/AuthContext', () => ({
  useAuth: () => ({
    authed: false,
    user: null,
    login: loginMock,
  }),
}));

vi.mock('react-hot-toast', () => ({ default: { success: vi.fn(), error: vi.fn() } }));

it('calls login and shows success toast on valid creds', async () => {
  loginMock.mockResolvedValue(true);
  render(
    <MemoryRouter>
      <LoginPage />
    </MemoryRouter>,
  );

  fireEvent.change(screen.getByPlaceholderText(/username/i), { target: { value: 'u' } });
  fireEvent.change(screen.getByPlaceholderText(/password/i), { target: { value: 'p' } });
  fireEvent.click(screen.getByRole('button', { name: /sign in/i }));

  expect(loginMock).toHaveBeenCalledWith('u', 'p');
});
