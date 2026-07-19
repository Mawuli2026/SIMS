import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import DashboardPage from './DashboardPage';

describe('DashboardPage', () => {
  it('renders role-specific sidebar items for an admin user', () => {
    localStorage.setItem('sims-auth-user', JSON.stringify({
      fullName: 'Alicia Ng',
      email: 'admin@sims.com',
      role: 'Admin',
      dateJoined: '2024-01-15',
    }));

    render(
      <MemoryRouter>
        <DashboardPage />
      </MemoryRouter>
    );

    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Products')).toBeInTheDocument();
    expect(screen.getByText('Sales History')).toBeInTheDocument();
    expect(screen.getByText('Low Stock')).toBeInTheDocument();
  });
});
