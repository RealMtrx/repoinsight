import { Box, Text } from "ink";
import type { PaletteItem } from "./actions.js";

interface CommandPaletteProps {
  items: PaletteItem[];
  query: string;
  selectedIndex: number;
  onClose: () => void;
  onSelect: (id: string) => void;
}

export function CommandPalette({ items, query, selectedIndex }: CommandPaletteProps) {
  const filtered = !query
    ? items
    : items.filter(
        (i) =>
          i.label.toLowerCase().includes(query.toLowerCase()) ||
          i.description.toLowerCase().includes(query.toLowerCase()),
      );

  const maxItems = Math.min(10, filtered.length);

  return (
    <Box
      flexDirection="column"
      borderStyle="round"
      borderColor="#E76F51"
      padding={1}
      marginBottom={1}
    >
      <Text bold color="#E76F51">
        {" "}
        Command Palette{" "}
      </Text>
      <Box>
        <Text color="#D4A017">▸ </Text>
        <Text color="#F4D03F">
          {query}
          <Text dimColor>█</Text>
        </Text>
      </Box>
      {filtered.length === 0 && <Text color="#8D99AE">No matching commands</Text>}
      {filtered.slice(0, maxItems).map((item, i) => (
        <Box key={item.id}>
          <Text color={i === selectedIndex ? "#D4A017" : "transparent"}>
            {i === selectedIndex ? "▸ " : "  "}
          </Text>
          <Text color={i === selectedIndex ? "#D4A017" : "#8D99AE"} bold={i === selectedIndex}>
            {item.label}
          </Text>
          <Text color="#6C757D"> {item.description}</Text>
        </Box>
      ))}
      {filtered.length > maxItems && (
        <Text color="#6C757D">... {filtered.length - maxItems} more</Text>
      )}
    </Box>
  );
}
