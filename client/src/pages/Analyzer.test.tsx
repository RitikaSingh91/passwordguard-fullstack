import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import Analyzer from './Analyzer';
import { Register } from './AuthPages';

vi.mock('../auth/AuthContext', () => ({ useAuth: () => ({ user: null, register: vi.fn(), login: vi.fn() }) }));

describe('Analyzer page', () => {
  it('shows live feedback, toggles visibility and clears', async () => {
    const u = userEvent.setup();
    render(<MemoryRouter><Analyzer /></MemoryRouter>);
    const input = screen.getByLabelText(/password to analyze/i) as HTMLInputElement;
    expect(input.type).toBe('password');
    await u.type(input, 'qwerty1234');
    expect(await screen.findByText(/keyboard pattern/i)).toBeInTheDocument();
    await u.click(screen.getByRole('button', { name: /show password/i }));
    expect(input.type).toBe('text');
    await u.click(screen.getByRole('button', { name: /clear password/i }));
    expect(input.value).toBe('');
  });
  it('keeps the breach button disabled until the user consents', async () => {
    const u = userEvent.setup();
    render(<MemoryRouter><Analyzer /></MemoryRouter>);
    await u.type(screen.getByLabelText(/password to analyze/i), 'abc');
    const btn = screen.getByRole('button', { name: /check breach exposure/i });
    expect(btn).toBeDisabled();
    await u.click(screen.getByRole('checkbox'));
    expect(btn).toBeEnabled();
  });
});

describe('Register form', () => {
  it('validates password length and confirmation', async () => {
    const u = userEvent.setup();
    render(<MemoryRouter><Register /></MemoryRouter>);
    await u.type(screen.getByLabelText(/^name/i), 'Ann');
    await u.type(screen.getByLabelText(/^email/i), 'ann@example.com');
    await u.type(screen.getByLabelText(/^password/i), 'short');
    await u.type(screen.getByLabelText(/confirm/i), 'different');
    await u.click(screen.getByRole('button', { name: /create account/i }));
    expect(await screen.findByText(/at least 12 characters/i)).toBeInTheDocument();
    expect(await screen.findByText(/do not match/i)).toBeInTheDocument();
  });
});
