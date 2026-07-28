import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import ResetPasswordPage from './ResetPasswordPage';

describe('ResetPasswordPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ message: 'Password reset successfully. Please log in with your new password.' }),
    } as Response);
  });

  afterEach(() => jest.restoreAllMocks());

  it('resets the password using the token from the URL', async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter initialEntries={['/reset-password?resetToken=development-token']}>
        <ResetPasswordPage />
      </MemoryRouter>,
    );

    await user.type(screen.getByLabelText(/^new password$/i), 'NewSecret123!');
    await user.type(screen.getByLabelText(/confirm new password/i), 'NewSecret123!');
    await user.click(screen.getByRole('button', { name: /reset password/i }));

    expect(await screen.findByText(/your password has been reset/i)).toBeInTheDocument();
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/auth/reset-password'),
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({
          resetToken: 'development-token',
          password: 'NewSecret123!',
          confirmPassword: 'NewSecret123!',
        }),
      }),
    );
  });

  it('rejects a reset page without a token', () => {
    render(<MemoryRouter initialEntries={['/reset-password']}><ResetPasswordPage /></MemoryRouter>);

    expect(screen.getByRole('alert')).toHaveTextContent('password reset link is invalid');
    expect(screen.queryByLabelText(/^new password$/i)).not.toBeInTheDocument();
    expect(fetch).not.toHaveBeenCalled();
  });
});
