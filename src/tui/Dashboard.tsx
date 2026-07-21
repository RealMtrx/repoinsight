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

function renderLine(label: string, value: string): string {
  return `  ${label.padEnd(18)}${value}`;
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
    <Box flexDirection="column" paddingX={2}>
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
        paddingX={2}
        marginBottom={1}
      >
        <Text bold color="#2A9D8F">
          {" "}Repository{" "}
        </Text>
        <Text>
          {renderLine(
            "Directory",
            directory.length > 50
              ? "..." + directory.slice(-47)
              : directory,
          )}
        </Text>
        <Text>
          {renderLine(
            "Git",
            tech?.git ? "✓ active" : "—",
          )}
        </Text>
        {tech?.packageManager && (
          <Text>
            {renderLine(
              "Package",
              tech.packageManager +
                (tech.packageManagerVersion
                  ? ` ${tech.packageManagerVersion}`
                  : ""),
            )}
          </Text>
        )}
        {tech?.frameworks.length ? (
          <Text>
            {renderLine(
              "Framework",
              tech.frameworks.join(", "),
            )}
          </Text>
        ) : null}
        {tech && (
          <Text>
            {renderLine(
              "Language",
              tech.typescript ? "TypeScript" : "JavaScript",
            )}
          </Text>
        )}
        {tech?.monorepo && (
          <Text>
            {renderLine("Monorepo", tech.monorepo)}
          </Text>
        )}
        {tech?.nodeVersion && (
          <Text>
            {renderLine("Node.js", tech.nodeVersion)}
          </Text>
        )}
        {tech?.testFrameworks.length ? (
          <Text>
            {renderLine(
              "Testing",
              tech.testFrameworks.join(", "),
            )}
          </Text>
        ) : null}
        {tech?.ciProviders.length ? (
          <Text>
            {renderLine("CI/CD", tech.ciProviders.join(", "))}
          </Text>
        ) : null}
        {tech?.linters ? (
          <Text>
            {renderLine("Linters", tech.linters.join(", "))}
          </Text>
        ) : null}
      </Box>

      {tech && (
        <Box
          flexDirection="column"
          borderStyle="round"
          borderColor="#D4A017"
          paddingX={2}
          marginBottom={1}
        >
          <Text bold color="#D4A017">
            {" "}Overview{" "}
          </Text>
          <Text>
            {(() => {
              const has: string[] = [];
              if (tech.hasReadme) {has.push("README");}
              if (tech.hasLicense) {has.push("LICENSE");}
              if (tech.hasSecurity) {has.push("SECURITY");}
              if (tech.hasContributing) {has.push("CONTRIBUTING");}
              if (tech.docker) {has.push("Docker");}
              if (tech.changesets) {has.push("changesets");}
              if (tech.workspaces) {has.push("workspaces");}
              if (has.length === 0) {return "  —";}
              return `  ${has.join(", ")}`;
            })()}
          </Text>
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
        paddingX={2}
        marginBottom={1}
      >
        <Text bold color="#8D99AE">
          {" "}Actions{" "}
        </Text>
        {(() => {
          let currentCategory = "";
          const lines: React.ReactNode[] = [];

          for (let i = 0; i < menuItems.length; i++) {
            const item = menuItems[i];
            if (!item) {continue;}

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

      <Box justifyContent="space-between" width="100%">
        <Text color="#6C757D">◈ repoinsight</Text>
        <Text color="#8D99AE">
          ↑↓ Navigate · Enter Select · Ctrl+K Commands · R Re-scan · Q Quit
        </Text>
      </Box>
    </Box>
  );
}
