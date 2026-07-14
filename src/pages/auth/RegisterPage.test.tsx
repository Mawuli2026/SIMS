import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import RegisterPage from './RegisterPage';

describe('RegisterPage', () => {
  beforeEach(() => {
    jest.spyOn(window, 'alert').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('renders the registration form and submits valid data', async () => {
    jest.useFakeTimers();
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });

    render(
      <MemoryRouter>
        <RegisterPage />
      </MemoryRouter>
    );

    await user.type(screen.getByLabelText(/first name/i), 'Ada');
    await user.type(screen.getByLabelText(/last name/i), 'Lovelace');
    await user.type(screen.getByLabelText(/email address/i), 'ada@sims.com');
    await user.type(screen.getByLabelText(/^password/i), 'StrongPass1!');
    await user.type(screen.getByLabelText(/confirm password/i), 'StrongPass1!');

    await user.click(screen.getByRole('button', { name: /create account/i }));
    await act(async () => {
      jest.advanceTimersByTime(1200);
    });

    expect(window.alert).toHaveBeenCalledWith('Account created successfully. Please sign in.');
    jest.useRealTimers();
  });
});
