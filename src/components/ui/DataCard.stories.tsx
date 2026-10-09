import type { Meta, StoryObj } from '@storybook/react-vite';
import { DataCard } from './DataCard';
import { Button } from './button';
const meta: Meta<typeof DataCard> = {
  title: 'UI/DataCard',
  component: DataCard,
  tags: ['autodocs'],
  parameters: { layout: 'centered' },
};
export default meta;
type Story = StoryObj<typeof DataCard>;
export const Record: Story = {
  args: {
    title: 'Group A-12',
    subtitle: 'Theory · Mon, Wed, Fri',
    fields: [
      { label: 'Students', value: '22' },
      { label: 'Status', value: 'Active' },
    ],
  },
};
export const Actionable: Story = {
  args: {
    ...Record.args,
    onClick: () => {},
    actions: (
      <Button size="sm" variant="outline">
        Edit
      </Button>
    ),
  },
};
