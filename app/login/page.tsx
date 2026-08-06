import type { Metadata } from 'next';
import { ComingSoonBlock } from '@/components/ui/coming-soon';

export const metadata: Metadata = {
  title: 'Member Portal',
  description: 'The Well Church member portal — coming soon.',
  robots: { index: false },
};

export default function LoginPage() {
  return (
    <ComingSoonBlock
      eyebrow="Member Portal"
      title="Your church, in your pocket."
      description="A secure members area — giving history, groups, directory, and more — is part of the full build. It unlocks once we go live."
    />
  );
}
