import type { Meta, StoryObj } from '@storybook/react-vite';
import { DesignSystemBoard } from '@/features/design-system/DesignSystemBoard';

const meta = {
  title: 'Design System/Board',
  component: DesignSystemBoard,
  parameters: { layout: 'fullscreen' },
} satisfies Meta<typeof DesignSystemBoard>;
export default meta;
export const Board: StoryObj<typeof meta> = {};
