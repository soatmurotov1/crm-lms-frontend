import { render, screen, cleanup, fireEvent } from '@testing-library/react';
import { describe, expect, it, vi, afterEach } from 'vitest';
import { EntityDetailShell } from './EntityDetailShell';

afterEach(cleanup);

describe('EntityDetailShell', () => {
  it('renders structured slots in order in one unboxed header', () => {
    const { container } = render(
      <EntityDetailShell
        onBack={vi.fn()}
        backLabel="Back"
        isLoading={false}
        isError={false}
        title={<span>Aziz</span>}
        description={<span>Student details</span>}
        meta={<span>Active</span>}
        actions={<button>Edit</button>}
      >
        <div>tabs</div>
      </EntityDetailShell>,
    );
    const heading = screen.getByRole('heading', { level: 1, name: 'Aziz' });
    const header = heading.closest('header');
    expect(header).toHaveClass(
      'flex-wrap',
      'justify-between',
      'gap-4',
      'border-b',
      'border-hair',
      'pb-4',
    );
    expect(heading).toHaveClass('font-heading', 'text-2xl', 'font-semibold');
    const slots = [
      heading,
      screen.getByText('Student details'),
      screen.getByText('Active'),
      screen.getByRole('button', { name: 'Edit' }),
    ];
    for (let i = 0; i < slots.length - 1; i++) {
      expect(
        slots[i].compareDocumentPosition(slots[i + 1]) &
          Node.DOCUMENT_POSITION_FOLLOWING,
      ).toBeTruthy();
    }
    expect(header).toContainElement(slots[3]);
    expect(container.firstElementChild).toHaveClass('space-y-4');
    expect(container.querySelector('.bg-card')).toBeNull();
    expect(screen.getByText('tabs')).toBeVisible();
  });

  it('renders other structured slots without an empty heading', () => {
    render(
      <EntityDetailShell
        onBack={vi.fn()}
        backLabel="Back"
        isLoading={false}
        isError={false}
        description="Details"
        meta="Active"
        actions={<button>Edit</button>}
      />,
    );
    expect(screen.queryByRole('heading', { level: 1 })).toBeNull();
    expect(screen.getByText('Details').closest('header')).toContainElement(
      screen.getByText('Active'),
    );
    expect(screen.getByRole('button', { name: 'Edit' })).toBeVisible();
  });

  it('protects wrapped action labels without targeting icon-only or menu controls', () => {
    render(
      <EntityDetailShell
        onBack={vi.fn()}
        backLabel="Back"
        isLoading={false}
        isError={false}
        actions={
          <div>
            <button>Edit</button>
            <a href="/edit">Open</a>
            <button aria-label="More" aria-haspopup="menu">
              ⋯
            </button>
          </div>
        }
      />,
    );
    const actions = screen.getByRole('button', { name: 'Edit' }).parentElement
      ?.parentElement;
    for (const tag of ['button', 'a']) {
      for (const rule of [
        'h-auto',
        'min-h-10',
        'max-w-full',
        'whitespace-normal',
      ]) {
        expect(actions).toHaveClass(
          `[&>div>${tag}:not([aria-haspopup]):not([aria-label])]:${rule}`,
        );
      }
    }
  });

  it.each([
    ['plain', {}, true],
    ['ctrl', { ctrlKey: true }, false],
    ['meta', { metaKey: true }, false],
    ['shift', { shiftKey: true }, false],
    ['alt', { altKey: true }, false],
    ['middle', { button: 1 }, false],
  ])(
    'preserves native back-link behavior for %s clicks',
    (_name, modifiers, intercepted) => {
      const onBack = vi.fn();
      render(
        <EntityDetailShell
          onBack={onBack}
          backLabel="Back"
          backHref="/documents"
          isLoading={false}
          isError={false}
        />,
      );
      const link = screen.getByRole('link', { name: 'Back' });
      expect(link).toHaveAttribute('href', '/documents');
      expect(link).toHaveClass('print:hidden');
      const event = new MouseEvent('click', {
        bubbles: true,
        cancelable: true,
        button: 0,
        ...modifiers,
      });
      fireEvent(link, event);
      expect(event.defaultPrevented).toBe(intercepted);
      expect(onBack).toHaveBeenCalledTimes(intercepted ? 1 : 0);
    },
  );

  it('renders the loading skeleton and hides header/children', () => {
    render(
      <EntityDetailShell
        onBack={vi.fn()}
        backLabel="Back"
        isLoading
        isError={false}
        header={<h1>Should not render</h1>}
      >
        <div>tabs</div>
      </EntityDetailShell>,
    );
    const status = screen.getByRole('status');
    expect(status).toHaveAttribute('aria-busy', 'true');
    expect(status.querySelector('.sr-only')).toHaveTextContent(
      'common.loading',
    );
    expect(status.querySelectorAll('.animate-pulse')).toHaveLength(3);
    expect(screen.queryByText('Should not render')).toBeNull();
    expect(screen.queryByText('tabs')).toBeNull();
  });

  it('renders the error/not-found state with the given title and icon', () => {
    render(
      <EntityDetailShell
        onBack={vi.fn()}
        backLabel="Back"
        isLoading={false}
        isError
        errorTitle="Not found"
      />,
    );
    expect(screen.getByText('Not found')).toBeTruthy();
    expect(screen.getByRole('alert')).toHaveTextContent('Not found');
  });

  it('renders the header and view-transition-named element when ready', () => {
    render(
      <EntityDetailShell
        onBack={vi.fn()}
        backLabel="Back"
        isLoading={false}
        isError={false}
        header={<h1 style={{ viewTransitionName: 'student-1' }}>Aziz</h1>}
      >
        <div>tabs</div>
      </EntityDetailShell>,
    );
    const heading = screen.getByText('Aziz');
    expect(heading.style.viewTransitionName).toBe('student-1');
    expect(screen.getByText('tabs')).toBeTruthy();
  });

  it('omits the children region entirely when none is provided (BranchDetailPage has no tabs)', () => {
    const { container } = render(
      <EntityDetailShell
        onBack={vi.fn()}
        backLabel="Back"
        isLoading={false}
        isError={false}
        header={<h1>Yunusobod</h1>}
      />,
    );
    // Header renders; nothing else follows it inside the wrapper.
    expect(screen.getByText('Yunusobod')).toBeTruthy();
    expect(container.querySelector('.space-y-4')?.children.length).toBe(2);
  });

  it('calls onBack when the back button is clicked', () => {
    const onBack = vi.fn();
    render(
      <EntityDetailShell
        onBack={onBack}
        backLabel="Students"
        isLoading={false}
        isError={false}
      />,
    );
    const backButton = screen.getByRole('button', { name: 'Students' });
    expect(backButton).toHaveClass('print:hidden');
    fireEvent.click(backButton);
    expect(onBack).toHaveBeenCalledTimes(1);
  });
});
