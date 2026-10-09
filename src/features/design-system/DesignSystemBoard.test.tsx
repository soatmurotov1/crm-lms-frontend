import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { DesignSystemBoard } from './DesignSystemBoard';

afterEach(cleanup);
describe('DesignSystemBoard', () => {
  it('defaults to dark and can inspect light locally', () => {
    const { container } = render(<DesignSystemBoard />);
    expect(container.firstElementChild).toHaveClass('dark');
    fireEvent.click(
      screen.getByRole('button', { name: 'Switch to light theme' }),
    );
    expect(container.firstElementChild).toHaveClass('light');
    expect(
      screen.getByRole('button', { name: 'Switch to dark theme' }),
    ).toHaveAttribute('aria-pressed', 'false');
  }, 20_000);

  it('renders the shared documentation sections and production controls accessibly', () => {
    render(<DesignSystemBoard />);
    for (const heading of [
      'DS-00 Overview',
      'DS-01 Color',
      'DS-02 Typography',
      'DS-03 Foundations',
      'DS-04 Component Usage',
      'DS-05 Components',
    ]) {
      expect(screen.getByRole('heading', { name: heading })).toBeVisible();
    }
    expect(
      screen.getByRole('button', { name: 'Default action' }),
    ).toBeEnabled();
    expect(
      screen.getByRole('button', { name: 'Disabled action' }),
    ).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Delete sample' })).toBeEnabled();
    expect(
      screen.getByRole('textbox', { name: 'Error input' }),
    ).toHaveAttribute('aria-invalid', 'true');
    expect(
      screen.getByRole('combobox', { name: 'Default select' }),
    ).toBeEnabled();
    expect(
      screen.getByRole('switch', { name: 'Selected switch' }),
    ).toBeChecked();
    expect(
      screen.getByRole('checkbox', { name: 'Selected checkbox' }),
    ).toBeChecked();
    expect(screen.getByRole('radio', { name: 'Selected radio' })).toBeChecked();
    expect(
      screen.getByRole('navigation', { name: 'Navigation examples' }),
    ).toBeVisible();
    for (let n = 1; n <= 10; n++)
      expect(screen.getByText(new RegExp(`^S${n}\\.`))).toBeVisible();
    for (let n = 1; n <= 6; n++)
      expect(
        screen.getByRole('heading', { name: new RegExp(`^A${n} `) }),
      ).toBeVisible();
  }, 20_000);
});

describe('Select portal compatibility', () => {
  it.each([false, true])('renders with a custom container: %s', (custom) => {
    const themedContainer = document.createElement('div');
    themedContainer.className = 'dark';
    document.body.append(themedContainer);
    try {
      render(
        <Select open defaultValue="sample">
          <SelectTrigger aria-label="Standalone select">
            <SelectValue />
          </SelectTrigger>
          <SelectContent container={custom ? themedContainer : undefined}>
            <SelectItem value="sample">Sample option</SelectItem>
          </SelectContent>
        </Select>,
      );
      const menu = screen.getByRole('listbox');
      expect(menu).toBeVisible();
      expect(themedContainer.contains(menu)).toBe(custom);
      expect(document.body.contains(menu)).toBe(true);
    } finally {
      cleanup();
      themedContainer.remove();
    }
  });
});
