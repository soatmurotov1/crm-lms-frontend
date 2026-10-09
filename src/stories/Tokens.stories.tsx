import type { Meta, StoryObj } from '@storybook/react-vite';

function TokensPointer() {
  return (
    <p className="bg-background p-6 text-foreground">
      The runtime token source is <code>src/index.css</code>. See{' '}
      <a
        className="text-primary underline"
        href="/?path=/story/design-system-board--board"
      >
        Design System / Board
      </a>{' '}
      for the shared token and component reference.
    </p>
  );
}
const meta = {
  title: 'Foundations/Tokens',
  component: TokensPointer,
  parameters: { layout: 'fullscreen' },
} satisfies Meta<typeof TokensPointer>;
export default meta;
export const Reference: StoryObj<typeof meta> = {};
