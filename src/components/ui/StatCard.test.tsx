import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { StatCard } from './StatCard';

describe('StatCard', () => {
  it('exposes the label, value, and contextual information', () => {
    render(
      <StatCard
        label="Balance"
        value="42"
        unit="UZS"
        meta="This month"
        delta="+5%"
      />,
    );
    expect(screen.getByText('Balance')).toBeInTheDocument();
    expect(screen.getByText('42')).toHaveTextContent('42UZS');
    expect(screen.getByText('This month')).toBeInTheDocument();
    expect(screen.getByText('+5%')).toBeInTheDocument();
  });

  it('activates an actionable KPI from the keyboard', () => {
    const onClick = vi.fn();
    render(<StatCard label="Balance" value="42" onClick={onClick} />);
    fireEvent.keyDown(screen.getByRole('button'), { key: 'Enter' });
    fireEvent.keyDown(screen.getByRole('button'), { key: ' ' });
    expect(onClick).toHaveBeenCalledTimes(2);
  });
  it('respects a handled key and leaves nested action keys to their owner', () => {
    const onClick = vi.fn();
    render(
      <StatCard
        label="Balance"
        value="42"
        onClick={onClick}
        onKeyDown={(event) => event.preventDefault()}
      >
        <button>Edit</button>
      </StatCard>,
    );
    const edit = screen.getByRole('button', { name: 'Edit' });
    fireEvent.keyDown(edit, { key: 'Enter' });
    fireEvent.keyDown(edit.closest('[data-surface="card"]')!, { key: 'Enter' });
    expect(onClick).not.toHaveBeenCalled();
  });
});
