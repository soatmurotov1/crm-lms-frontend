import type { Meta, StoryObj } from '@storybook/react-vite';

import { Button } from './button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from './card';

const meta: Meta<typeof Card> = {
  title: 'UI/Card',
  component: Card,
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof Card>;

export const Basic: Story = {
  render: () => (
    <Card className="w-[360px]">
      <CardContent>
        <p className="text-sm text-muted-foreground">
          A minimal card with body content only.
        </p>
      </CardContent>
    </Card>
  ),
};

export const WithHeaderAndFooter: Story = {
  render: () => (
    <Card className="w-[360px]">
      <CardHeader>
        <CardTitle>Group A-12</CardTitle>
        <CardDescription>Theory · Mon, Wed, Fri</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-sm">22 students enrolled. Course ends in 14 days.</p>
      </CardContent>
      <CardFooter className="justify-end gap-2">
        <Button variant="ghost">Dismiss</Button>
        <Button>View group</Button>
      </CardFooter>
    </Card>
  ),
};

export const Dense: Story = {
  render: () => (
    <Card
      dense
      className="w-[360px]"
      heading="Compact record"
      description="Twelve pixel padding"
    >
      <p className="text-sm">The same surface at a denser rhythm.</p>
    </Card>
  ),
};

export const EdgeToEdge: Story = {
  render: () => (
    <Card edgeToEdge className="w-[360px]" heading="Students">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border">
            <th className="p-3 text-left">Name</th>
            <th className="p-3 text-left">Status</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td className="p-3">Ali</td>
            <td className="p-3">Active</td>
          </tr>
        </tbody>
      </table>
    </Card>
  ),
};
