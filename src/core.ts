import type {
  DocumentSettings,
  ToolDefinition,
  ToolRegistry,
} from "./types.ts";

export const DOCUMENT_SETTINGS: DocumentSettings = Object.freeze({
  width: 800,
  height: 600,
  background: "#ffffff",
});

export const EXPORT_SCALE = 2;

// Presets and custom tools share the same registry.
export function createToolRegistry(
  initialTools: readonly ToolDefinition[],
): ToolRegistry {
  const tools = new Map<string, ToolDefinition>();
  const registry: ToolRegistry = {
    getAll: () => Array.from(tools.values()),
    getById: (id) => tools.get(id),
    add(tool) {
      if (tools.has(tool.id)) {
        throw new Error(`Duplicate tool id: ${tool.id}`);
      }
      tools.set(tool.id, Object.freeze({ ...tool }));
    },
  };

  for (const tool of initialTools) registry.add(tool);
  return registry;
}
