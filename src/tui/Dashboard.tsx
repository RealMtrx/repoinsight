import { Box, Text } from "ink";
import { Header } from "./Header.js";
import { CommandPalette } from "./CommandPalette.js";
import type { PaletteItem, MenuItem } from "./actions.js";
import type { DetectedTechnologies } from "../types/index.js";

interface DashboardProps {
  directory: string;
  tech: DetectedTechnologies | null;
  menuItems: MenuItem[];
  selectedIndex: number;
  statusMessage: string;
  paletteVisible: boolean;
  paletteQuery: string;
  paletteIndex: number;
  paletteItems: PaletteItem[];
  onPaletteClose: () => void;
  onPaletteSelect: (id: string) => void;
}

export function Dashboard({
  directory,
  tech,
  menuItems,
  selectedIndex,
  statusMessage,
  paletteVisible,
  paletteQuery,
  paletteIndex,
  paletteItems,
  onPaletteClose,
  onPaletteSelect,
}: DashboardProps) {
  return (
    <Box flexDirection="column" paddingX={1}>
      <Header
        tagline={
          statusMessage === "Ready"
            ? "Repository Intelligence for Modern Developers"
            : statusMessage
        }
      />

      <Box
        flexDirection="column"
        borderStyle="round"
        borderColor="#2A9D8F"
        paddingX={1}
        marginBottom={1}
        width={68}
      >
        <Text bold color="#2A9D8F">
          {" "}Repository{" "}
        </Text>
        <DataRow
          label="Directory"
          value={
            directory.length > 50
              ? "..." + directory.slice(-47)
              : directory
          }
          color="#64B5F6"
        />
        <DataRow
          label="Git"
          value={tech?.git ? "active" : "—"}
          color={tech?.git ? "#52B788" : "#6C757D"}
        />
        {tech?.packageManager && (
          <DataRow
            label="Package"
            value={
              tech.packageManager +
              (tech.packageManagerVersion
                ? ` ${tech.packageManagerVersion}`
                : "")
            }
            color="#D4A017"
          />
        )}
        {tech?.frameworks.length ? (
          <DataRow
            label="Framework"
            value={tech.frameworks.join(", ")}
            color="#4895EF"
          />
        ) : null}
        {tech?.testFrameworks.length ? (
          <DataRow
            label="Testing"
            value={tech.testFrameworks.join(", ")}
            color="#F4A261"
          />
        ) : null}
        {tech?.ciProviders.length ? (
          <DataRow
            label="CI/CD"
            value={tech.ciProviders.join(", ")}
            color="#E63946"
          />
        ) : null}
      </Box>

      {tech && (
        <Box
          flexDirection="column"
          borderStyle="round"
          borderColor="#D4A017"
          paddingX={1}
          marginBottom={1}
          width={68}
        >
          <Text bold color="#D4A017">
            {" "}Overview{" "}
          </Text>
          {(() => {
            const items: string[] = [];
            if (tech.hasReadme) { items.push("README"); }
            if (tech.hasLicense) { items.push("LICENSE"); }
            if (tech.hasSecurity) { items.push("SECURITY"); }
            if (tech.hasContributing) { items.push("CONTRIBUTING"); }
            if (tech.docker) { items.push("Docker"); }
            if (tech.changesets) { items.push("changesets"); }
            if (tech.workspaces) { items.push("workspaces"); }
            if (tech.typescript) { items.push("TypeScript"); }
            if (tech.monorepo) { items.push(`Monorepo (${tech.monorepo})`); }
            if (tech.nodeVersion) { items.push(`Node ${tech.nodeVersion}`); }
            if (items.length === 0) { return <Text color="#8D99AE">  — No detected features</Text>; }
            return (
              <Box flexDirection="row" flexWrap="wrap" gap={1}>
                {items.map((item) => (
                  <Text key={item} color="#2A9D8F">
                    ◈ {item}
                  </Text>
                ))}
              </Box>
            );
          })()}
        </Box>
      )}

      {paletteVisible && (
        <CommandPalette
          items={paletteItems}
          query={paletteQuery}
          selectedIndex={paletteIndex}
          onClose={onPaletteClose}
          onSelect={onPaletteSelect}
        />
      )}

      <Box
        flexDirection="column"
        borderStyle="round"
        borderColor="#3D405B"
        paddingX={1}
        marginBottom={1}
        width={68}
      >
        <Text bold color="#8D99AE">
          {" "}Actions{" "}
        </Text>
        {(() => {
          let currentCategory = "";
          const lines: React.ReactNode[] = [];

          for (let i = 0; i < menuItems.length; i++) {
            const item = menuItems[i];
            if (!item) { continue; }

            if (item.category !== currentCategory) {
              currentCategory = item.category;
              lines.push(
                <Text key={`cat-${i}`} color="#6C757D">
                  ── {item.category} ──
                </Text>,
              );
            }

            const isSelected = i === selectedIndex;
            lines.push(
              <Text key={item.id}>
                <Text color={isSelected ? "#D4A017" : "transparent"}>
                  {isSelected ? "▸ " : "  "}
                </Text>
                <Text
                  color={isSelected ? "#D4A017" : "#8D99AE"}
                  bold={isSelected}
                >
                  {item.label.padEnd(16)}
                </Text>
                <Text color="#6C757D"> {item.description}</Text>
              </Text>,
            );
          }

          return lines;
        })()}
      </Box>

      <Box justifyContent="space-between" width={68}>
        <Text color="#6C757D">◈ repoinsight</Text>
        <Text color="#8D99AE">
          ↑↓ · Enter · Ctrl+K · R · Q
        </Text>
      </Box>
    </Box>
  );
}

function DataRow({
  label,
  value,
  color,
}: {
  label: string;
  value: string;
  color: string;
}) {
  return (
    <Text>
      <Text color="#8D99AE">  {label.padEnd(16)}</Text>
      <Text color={color}>{value}</Text>
    </Text>
  );
}
