import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { DataCard } from './DataCard';
import { Card } from './card';
import { createRef } from 'react';

describe('surface interaction', () => {
  it('keeps native form submission, ARIA, and ref with asChild', () => {
    const onSubmit = vi.fn((event) => event.preventDefault());
    const ref = createRef<HTMLDivElement>();
    render(
      <Card asChild ref={ref}>
        <form aria-label="Station" onSubmit={onSubmit}>
          <button type="submit">Save</button>
        </form>
      </Card>,
    );
    const form = screen.getByRole('form', { name: 'Station' });
    expect(ref.current).toBe(form);
    fireEvent.submit(form);
    expect(onSubmit).toHaveBeenCalledTimes(1);
  });

  it('activates an action without navigating the record', () => {
    const onClick = vi.fn();
    const onEdit = vi.fn();
    render(
      <DataCard
        title="Student"
        onClick={onClick}
        actions={<button onClick={onEdit}>Edit</button>}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Edit' }));
    expect(onEdit).toHaveBeenCalledTimes(1);
    expect(onClick).not.toHaveBeenCalled();
  });

  it('leaves nested action keys to the action while the row stays keyboard accessible', () => {
    const onClick = vi.fn();
    render(
      <DataCard
        title="Student"
        onClick={onClick}
        actions={<button>Edit</button>}
      />,
    );
    const action = screen.getByRole('button', { name: 'Edit' });
    fireEvent.keyDown(action, { key: 'Enter' });
    fireEvent.keyDown(action, { key: ' ' });
    expect(onClick).not.toHaveBeenCalled();
    const row = action.closest('[data-surface="card"]')!;
    fireEvent.keyDown(row, { key: 'Enter' });
    fireEvent.keyDown(row, { key: ' ' });
    expect(onClick).toHaveBeenCalledTimes(2);
  });
});
