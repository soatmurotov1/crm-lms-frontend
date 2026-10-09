import type { Meta, StoryObj } from '@storybook/react-vite';
import { StatCard } from './StatCard';
const meta: Meta<typeof StatCard> = {
  title: 'UI/StatCard',
  component: StatCard,
  tags: ['autodocs'],
  parameters: { layout: 'centered' },
};
export default meta;
type Story = StoryObj<typeof StatCard>;
export const Default: Story = {
  args: {
    label: 'Collected this month',
    value: '12 400 000',
    unit: 'UZS',
    meta: 'Current period',
    delta: '+8%',
  },
};
export const Loading: Story = {
  args: { label: 'Collected this month', value: '', isLoading: true },
};
export const Actionable: Story = {
  args: {
    label: 'Active students',
    value: '124',
    onClick: () => {},
    meta: 'Open students',
  },
};
