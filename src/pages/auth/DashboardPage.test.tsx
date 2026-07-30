import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import DashboardPage from './DashboardPage';
import { AUTH_TOKEN_KEY, AUTH_USER_KEY } from '../../utils/authSession';

const apiUser = { id: 1, firstName: 'Alicia', lastName: 'Ng', email: 'admin@sims.com', role: 'Admin', createdAt: '2024-01-15T00:00:00.000Z' };

describe('DashboardPage', () => {
  beforeEach(() => {
    localStorage.setItem(AUTH_TOKEN_KEY, 'valid-token');
    localStorage.setItem(AUTH_USER_KEY, JSON.stringify({ id: 1, firstName: 'Alicia', lastName: 'Ng', fullName: 'Alicia Ng', email: 'admin@sims.com', role: 'Admin', dateJoined: '1/15/2024', initial: 'A' }));
    jest.spyOn(global, 'fetch').mockResolvedValue({ ok: true, status: 200, json: async () => ({ user: apiUser }) } as Response);
  });
  afterEach(() => jest.restoreAllMocks());

  it('verifies the token and renders role-specific Admin navigation', async () => {
    render(<MemoryRouter><DashboardPage /></MemoryRouter>);
    expect(screen.getByText(/checking your session/i)).toBeInTheDocument();
    expect(await screen.findByText('Products')).toBeInTheDocument();
    expect(screen.getByText('Sales History')).toBeInTheDocument();
    expect(screen.getByText('Low Stock')).toBeInTheDocument();
    expect(fetch).toHaveBeenCalledWith(expect.stringContaining('/api/auth/me'), expect.objectContaining({ headers: expect.objectContaining({ Authorization: 'Bearer valid-token' }) }));
  });
});
