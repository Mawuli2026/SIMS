import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import RegisterPage from './RegisterPage';

describe('RegisterPage', () => {
  beforeEach(() => jest.spyOn(global, 'fetch').mockResolvedValue({ ok: true, status: 201, json: async () => ({ message: 'Account created successfully. Please log in.' }) } as Response));
  afterEach(() => jest.restoreAllMocks());

  it('creates an account through the API and redirects to login', async () => {
    const user = userEvent.setup();
    render(<MemoryRouter initialEntries={['/register']}><Routes><Route path="/register" element={<RegisterPage />} /><Route path="/login" element={<div>Login destination</div>} /></Routes></MemoryRouter>);

    await user.type(screen.getByLabelText(/first name/i), 'Ada');
    await user.type(screen.getByLabelText(/last name/i), 'Lovelace');
    await user.type(screen.getByLabelText(/email address/i), 'ada@sims.com');
    await user.type(screen.getByLabelText(/^password/i), 'StrongPass1!');
    await user.type(screen.getByLabelText(/confirm password/i), 'StrongPass1!');
    await user.click(screen.getByRole('button', { name: /create account/i }));

    expect(await screen.findByText('Login destination')).toBeInTheDocument();
    expect(fetch).toHaveBeenCalledWith(expect.stringContaining('/api/auth/register'), expect.objectContaining({ method: 'POST' }));
  });
});
