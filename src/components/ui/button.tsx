import { Button as MantineButton, ButtonProps as MantineButtonProps } from '@mantine/core';
import { forwardRef, ButtonHTMLAttributes } from 'react';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'filled' | 'light' | 'outline' | 'subtle' | 'default' | 'destructive' | 'secondary' | 'ghost';
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'default', size = 'md', ...props }, ref) => {
    // variantマッピング
    let mantineVariant: MantineButtonProps['variant'] = 'filled';
    let mantineColor: string | undefined = undefined;

    if (variant === 'default' || variant === 'filled') {
      mantineVariant = 'filled';
      mantineColor = 'blue';
    } else if (variant === 'destructive') {
      mantineVariant = 'filled';
      mantineColor = 'red';
    } else if (variant === 'outline') {
      mantineVariant = 'outline';
    } else if (variant === 'secondary' || variant === 'light') {
      mantineVariant = 'light';
    } else if (variant === 'ghost' || variant === 'subtle') {
      mantineVariant = 'subtle';
    }

    return (
      <MantineButton
        ref={ref}
        variant={mantineVariant}
        color={mantineColor}
        size={size}
        {...props}
      />
    );
  }
);

Button.displayName = 'Button';
