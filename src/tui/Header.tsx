import { Box, Text } from "ink";
import { APP_NAME, APP_VERSION } from "../constants/index.js";

interface HeaderProps {
  tagline?: string;
  compact?: boolean;
}

export function Header({ tagline, compact = false }: HeaderProps) {
  const tag = tagline ?? "Repository Intelligence for Modern Developers";

  if (compact) {
    return (
      <Box flexDirection="column" alignItems="center" marginBottom={1}>
        <Text color="#D4A017" bold>
          ◈ {APP_NAME} ◈
        </Text>
        <Text color="#8D99AE">v{APP_VERSION}</Text>
        <Text color="#3D405B">{"─".repeat(21)}</Text>
        <Text color="#6C757D" italic>
          {tag}
        </Text>
      </Box>
    );
  }

  const art = [
    "    ___                  _     _     _              ",
    "   / _ \\___  _ __  _ __(_)___| |__ (_)_ __   ___   ",
    "  / /_)/ _ \\| '_ \\| '__| / __| '_ \\| | '_ \\ / _ \\  ",
    " / ___/ (_) | |_) | |  | \\__ \\ | | | | | | | (_) | ",
    "/_/   \\___/| .__/|_|  |_|___/_| |_|_|_| |_|\\___/  ",
    "           |_|                                      ",
  ];

  return (
    <Box flexDirection="column" alignItems="center" marginY={1}>
      {art.map((line, i) => (
        <Text key={i} color="#D4A017">
          {line}
        </Text>
      ))}
      <Box marginTop={1}>
        <Text color="#D4A017" bold>
          {APP_NAME.toUpperCase()}
        </Text>
      </Box>
      <Text color="#8D99AE">v{APP_VERSION}</Text>
      <Text color="#3D405B">{"─".repeat(24)}</Text>
      <Text color="#6C757D" italic>
        {tag}
      </Text>
    </Box>
  );
}
