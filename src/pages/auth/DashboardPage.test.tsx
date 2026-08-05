import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import DashboardPage from './DashboardPage';
import { AUTH_TOKEN_KEY, AUTH_USER_KEY } from '../../utils/authSession';

const apiUser = { id: 1, firstName: 'Alicia', lastName: 'Ng', email: 'manager@sims.com', role: 'Manager', mustChangePassword: false, createdAt: '2024-01-15T00:00:00.000Z' };

describe('DashboardPage', () => {
  beforeEach(() => {
    localStorage.setItem(AUTH_TOKEN_KEY, 'valid-token');
    localStorage.setItem(AUTH_USER_KEY, JSON.stringify({ id: 1, firstName: 'Alicia', lastName: 'Ng', fullName: 'Alicia Ng', email: 'manager@sims.com', role: 'Manager', dateJoined: '1/15/2024', initial: 'A' }));
    jest.spyOn(global, 'fetch').mockImplementation(async (input) => {
      const url = String(input);
      if (url.includes('/api/auth/me')) return { ok: true, status: 200, json: async () => ({ user: apiUser }) } as Response;
      if (url.includes('/api/dashboard/sidebar')) return { ok: true, status: 200, json: async () => ({ role: 'Manager', menuItems: [
        { label: 'Dashboard', path: '/dashboard' }, { label: 'Products', path: '/dashboard/products' },
        { label: 'Sales History', path: '/dashboard/sales-history' }, { label: 'Low Stock', path: '/dashboard/low-stock' },
      ] }) } as Response;
      if (url.includes('/api/dashboard/notifications')) return { ok: true, status: 200, json: async () => ({ notifications: [] }) } as Response;
      if (url.endsWith('/api/dashboard')) return { ok: true, status: 200, json: async () => ({
        role: 'Manager', summary: { todaySales: 0, salesCountToday: 0, totalProducts: 0, lowStockCount: 0 }, recentSales: [], lowStockProducts: [],
      }) } as Response;
      throw new Error(`Unexpected request: ${url}`);
    });
  });
  afterEach(() => jest.restoreAllMocks());

  it('verifies the token and renders role-specific Manager navigation', async () => {
    render(<MemoryRouter initialEntries={['/dashboard']}><DashboardPage /></MemoryRouter>);
    expect(screen.getByText(/checking your session/i)).toBeInTheDocument();
    expect(await screen.findByText('Products')).toBeInTheDocument();
    expect(await screen.findByRole('heading', { name: 'Manager Dashboard' })).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Employees' })).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Audit Logs' })).not.toBeInTheDocument();
    expect(screen.getByText('Sales History')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Low Stock' })).toBeInTheDocument();
    expect(fetch).toHaveBeenCalledWith(expect.stringContaining('/api/auth/me'), expect.objectContaining({ headers: expect.objectContaining({ Authorization: 'Bearer valid-token' }) }));
    expect(fetch).toHaveBeenCalledWith(expect.stringContaining('/api/dashboard'), expect.objectContaining({ headers: expect.objectContaining({ Authorization: 'Bearer valid-token' }) }));
  });

  it('recognizes a SystemAdmin session and preserves management access', async () => {
    const systemAdmin = { ...apiUser, email: 'system-admin@sims.com', role: 'SystemAdmin' };
    localStorage.setItem(AUTH_USER_KEY, JSON.stringify({ id: 1, firstName: 'Alicia', lastName: 'Ng', fullName: 'Alicia Ng', email: systemAdmin.email, role: 'SystemAdmin', dateJoined: '1/15/2024', initial: 'A' }));
    (fetch as jest.Mock).mockImplementation(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.includes('/api/auth/me')) return { ok: true, status: 200, json: async () => ({ user: systemAdmin }) } as Response;
      if (url.includes('/api/dashboard/sidebar')) return { ok: true, status: 200, json: async () => ({ role: 'SystemAdmin', menuItems: [
        { label: 'Dashboard', path: '/dashboard' }, { label: 'Employees', path: '/dashboard/employees' }, { label: 'Audit Logs', path: '/dashboard/audit-logs' }, { label: 'Products', path: '/dashboard/products' },
      ] }) } as Response;
      if (url.includes('/api/dashboard/notifications')) return { ok: true, status: 200, json: async () => ({ notifications: [] }) } as Response;
      if (url.endsWith('/api/dashboard')) return { ok: true, status: 200, json: async () => ({
        role: 'SystemAdmin', summary: { todaySales: 0, salesCountToday: 0, totalProducts: 0, lowStockCount: 0 }, recentSales: [], lowStockProducts: [],
      }) } as Response;
      throw new Error(`Unexpected request: ${url}`);
    });

    render(<MemoryRouter initialEntries={['/dashboard']}><DashboardPage /></MemoryRouter>);
    expect(await screen.findByRole('heading', { name: 'System Admin Dashboard' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Employees' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Audit Logs' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Products' })).toBeInTheDocument();
  });
});
