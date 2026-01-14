'use client';

import { Container, Card, Title } from '@mantine/core';
import { WorkflowSection } from '@/components/home/WorkflowSection';

export default function HelpPage() {
  return (
    <Container size="lg" py="xl">
      <Card withBorder shadow="sm" radius="md">
        <Card.Section p="lg">
          <Title order={2}>使い方</Title>
        </Card.Section>
        <Card.Section p="lg">
          <WorkflowSection />
        </Card.Section>
      </Card>
    </Container>
  );
}
