import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import LoginPage from './LoginPage';
import { AUTH_TOKEN_KEY, AUTH_USER_KEY } from '../../utils/authSession';

const apiUser = { id: 1, firstName: 'Alicia', lastName: 'Ng', email: 'admin@sims.com', role: 'Admin', createdAt: '2026-01-15T00:00:00.000Z' };

describe('LoginPage', () => {
  beforeEach(() => {
    localStorage.clear();
    jest.spyOn(global, 'fetch').mockResolvedValue({ ok: true, status: 200, json: async () => ({ message: 'Login successful', token: 'test-jwt', user: apiUser }) } as Response);
  });
  afterEach(() => jest.restoreAllMocks());

  it('logs in through the API and stores the authenticated session', async () => {
    const user = userEvent.setup();
    render(<MemoryRouter><LoginPage /></MemoryRouter>);

    await user.type(screen.getByLabelText(/email address/i), 'admin@sims.com');
    await user.type(screen.getByLabelText(/password/i, { selector: 'input' }), 'Secret123!');
    await user.click(screen.getByRole('button', { name: /log in/i }));

    await waitFor(() => expect(localStorage.getItem(AUTH_TOKEN_KEY)).toBe('test-jwt'));
    expect(localStorage.getItem(AUTH_USER_KEY)).toContain('Alicia Ng');
    expect(fetch).toHaveBeenCalledWith(expect.stringContaining('/api/auth/login'), expect.objectContaining({ method: 'POST' }));
  });

  it('shows the backend error without creating a session', async () => {
    jest.mocked(fetch).mockResolvedValueOnce({ ok: false, status: 401, json: async () => ({ message: 'Invalid email or password.' }) } as Response);
    const user = userEvent.setup();
    render(<MemoryRouter><LoginPage /></MemoryRouter>);
    await user.type(screen.getByLabelText(/email address/i), 'admin@sims.com');
    await user.type(screen.getByLabelText(/password/i, { selector: 'input' }), 'WrongPassword');
    await user.click(screen.getByRole('button', { name: /log in/i }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Invalid email or password.');
    expect(localStorage.getItem(AUTH_TOKEN_KEY)).toBeNull();
  });
});
