import { Box, Text } from "ink";

interface StatusBarProps {
  left?: string;
  right?: string;
}

export function StatusBar({ left, right }: StatusBarProps) {
  return (
    <Box justifyContent="space-between" width="100%">
      <Text color="#6C757D">{left ?? ""}</Text>
      <Text color="#8D99AE">{right ?? ""}</Text>
    </Box>
  );
}
