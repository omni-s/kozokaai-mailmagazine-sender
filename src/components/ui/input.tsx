import * as React from 'react';
import { TextInput, TextInputProps } from '@mantine/core';

const Input = React.forwardRef<HTMLInputElement, TextInputProps>(
  (props, ref) => {
    return (
      <TextInput
        ref={ref}
        {...props}
      />
    );
  }
);
Input.displayName = 'Input';

export { Input };
