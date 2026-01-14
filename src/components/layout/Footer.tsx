import { Container, Stack, Text } from '@mantine/core';

export function Footer() {
  return (
    <footer style={{ borderTop: '1px solid light-dark(var(--mantine-color-gray-3), var(--mantine-color-dark-5))' }}>
      <Container>
        <Stack align="center" gap="xs" py="xl">
          <Text size="sm" c="dimmed" ta="center">
            © {new Date().getFullYear()} Resend Mail. All rights reserved.
          </Text>
          <Text size="sm" c="dimmed">
            v{process.env.npm_package_version || '0.1.0'}
          </Text>
        </Stack>
      </Container>
    </footer>
  );
}
