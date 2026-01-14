import { Badge as MantineBadge, BadgeProps as MantineBadgeProps } from '@mantine/core';

export interface BadgeProps extends Omit<MantineBadgeProps, 'color'> {
  variant?: 'filled' | 'light' | 'outline' | 'default' | 'secondary' | 'destructive';
}

export function Badge({ variant = 'default', ...props }: BadgeProps) {
  let mantineVariant: MantineBadgeProps['variant'] = 'filled';
  let mantineColor: string | undefined = undefined;

  if (variant === 'default' || variant === 'filled') {
    mantineVariant = 'filled';
    mantineColor = 'blue';
  } else if (variant === 'secondary' || variant === 'light') {
    mantineVariant = 'light';
    mantineColor = 'gray';
  } else if (variant === 'destructive') {
    mantineVariant = 'filled';
    mantineColor = 'red';
  } else if (variant === 'outline') {
    mantineVariant = 'outline';
  }

  return <MantineBadge variant={mantineVariant} color={mantineColor} {...props} />;
}
