import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import ForgotPasswordPage from './ForgotPasswordPage';

describe('ForgotPasswordPage', () => {
  beforeEach(() => {
    jest.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        message: 'If an account exists for that email, password reset instructions have been created.',
        resetUrl: 'http://localhost:5173/reset-password?resetToken=development-token',
      }),
    } as Response);
  });

  afterEach(() => jest.restoreAllMocks());

  it('requests a password reset through the API', async () => {
    const user = userEvent.setup();
    render(<MemoryRouter><ForgotPasswordPage /></MemoryRouter>);

    await user.type(screen.getByLabelText(/email address/i), 'admin@sims.com');
    await user.click(screen.getByRole('button', { name: /send reset link/i }));

    expect(await screen.findByRole('status')).toHaveTextContent('If an account exists');
    expect(screen.getByRole('link', { name: /open the password reset page/i })).toHaveAttribute(
      'href',
      'http://localhost:5173/reset-password?resetToken=development-token',
    );
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/auth/forgot-password'),
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ email: 'admin@sims.com' }),
      }),
    );
  });
});
