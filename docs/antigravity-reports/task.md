# Task Checklist: ARGUS UI Integration & Repairs

- [x] Create `SparkCore.tsx` node graph component
- [x] Create `DashboardPanel.tsx` 3-zone spatial dashboard layout
- [x] Wire Monaco Editor into `EditorPanel.tsx`
- [x] Add `GateActivityChart` (Recharts) to the Security/Dashboard panel
- [x] Create and mount `MatrixRain.tsx` background effect
- [x] Add Zustand `persist` middleware to `useArgusStore.ts`
- [x] Verify everything compiles with zero TypeScript errors

# Task Checklist: Serena MCP Modulating
- [x] Initialize and check out `serena` Git submodule
- [x] Create `graph_tools.py` containing `GetSemanticGraphTool` and `GetWorkflowChartTool`
- [x] Register new tools in Serena tools module init file
- [x] Clean and fix `uv` environment packages to resolve namespace/dependency import errors
- [x] Verify tool registration in Serena CLI registry
- [x] Run and test graph and workflow output successfully
