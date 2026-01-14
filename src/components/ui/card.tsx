import * as React from 'react';
import { Card as MantineCard, CardProps as MantineCardProps, Title, Text } from '@mantine/core';

const Card = React.forwardRef<HTMLDivElement, MantineCardProps>(
  (props, ref) => (
    <MantineCard
      ref={ref}
      withBorder
      shadow="sm"
      radius="md"
      {...props}
    />
  )
);
Card.displayName = 'Card';

const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>((props, ref) => (
  <MantineCard.Section p="lg" ref={ref} {...props} />
));
CardHeader.displayName = 'CardHeader';

const CardTitle = React.forwardRef<
  HTMLHeadingElement,
  React.HTMLAttributes<HTMLHeadingElement>
>((props, ref) => (
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  <Title order={3} ref={ref as any} {...props} />
));
CardTitle.displayName = 'CardTitle';

const CardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>((props, ref) => (
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  <Text size="sm" c="dimmed" ref={ref as any} {...props} />
));
CardDescription.displayName = 'CardDescription';

const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>((props, ref) => (
  <MantineCard.Section p="lg" ref={ref} {...props} />
));
CardContent.displayName = 'CardContent';

const CardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>((props, ref) => (
  <MantineCard.Section p="lg" style={{ display: 'flex', alignItems: 'center' }} ref={ref} {...props} />
));
CardFooter.displayName = 'CardFooter';

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent };
