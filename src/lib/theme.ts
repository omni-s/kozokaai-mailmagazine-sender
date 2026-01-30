import { createTheme, MantineColorsTuple } from '@mantine/core';

// kozokaAI ブランドカラー（ターコイズ）
const turquoise: MantineColorsTuple = [
  '#e6fafa', // 0: lightest
  '#ccf5f4',
  '#99ebe9',
  '#66e0dd',
  '#33d6d2',
  '#00ADAA', // 5: primary (ブランドカラー)
  '#009A97', // 6: hover
  '#007a78',
  '#005a59',
  '#003a3a', // 9: darkest
];

export const theme = createTheme({
  primaryColor: 'turquoise',
  colors: {
    turquoise,
  },
});
