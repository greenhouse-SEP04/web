import { render, fireEvent, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { vi } from 'vitest';
import PasswordResetPage from '@/pages/PasswordResetPage';

const changePwd = vi.fn().mockResolvedValue(undefined);

// make first-login **true** so no “current password” field is required
vi.mock('@/context/AuthContext', () => ({
  useAuth: () => ({
    user: { isFirstLogin: true },   // 👈
    changePassword: changePwd,
  }),
}));

vi.mock('react-hot-toast', () => ({ default: { success: vi.fn(), error: vi.fn() } }));

it('rejects weak password and accepts strong one', async () => {
  render(
    <MemoryRouter>
      <PasswordResetPage />
    </MemoryRouter>,
  );

  const newPwd = screen.getByPlaceholderText(/new password/i);

  /*── weak pwd → toast.error ──*/
  fireEvent.change(newPwd, { target: { value: 'weak' } });
  fireEvent.click(screen.getByRole('button', { name: /set & login|save/i }));
  expect(changePwd).not.toHaveBeenCalled();

  /*── strong pwd → changePassword called ──*/
  fireEvent.change(newPwd, { target: { value: 'Str0ng!Pass1' } });
  fireEvent.click(screen.getByRole('button', { name: /set & login|save/i }));

  await waitFor(() => expect(changePwd).toHaveBeenCalledWith(null, 'Str0ng!Pass1'));
});
