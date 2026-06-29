"""
Semantic graphing and visual workflow tools for codebase analysis
"""

import os
import re
import json
from serena.tools import Tool

class GetSemanticGraphTool(Tool):
    """
    Constructs a semantic graph of the codebase files, classes, functions, and their import dependencies.
    """

    def apply(self, include_functions: bool = True) -> str:
        """
        Use this tool to generate a detailed JSON representation of the semantic graph of the project,
        including files, classes, components, and their dependencies (imports and calls).

        :param include_functions: whether to include functions/methods in the graph. Default True.
        :return: a JSON string containing "nodes" and "edges" of the semantic graph.
        """
        root_dir = self.project.project_root
        files = self.project.gather_source_files()
        
        nodes = []
        edges = []
        node_ids = set()
        
        # Regexes for imports and declarations
        # Typescript / Javascript
        ts_import_re = re.compile(r'(?:import|export)\s+.*?\s+from\s+[\'"]([^\'"]+)[\'"]|import\([\'"]([^\'"]+)[\'"]\)|require\([\'"]([^\'"]+)[\'"]\)')
        ts_class_re = re.compile(r'(?:export\s+)?class\s+(\w+)')
        ts_func_re = re.compile(r'(?:export\s+)?(?:const|function)\s+(\w+)\s*=\s*(?:\([^)]*\)|[a-zA-Z0-9_]+)\s*=>|function\s+(\w+)\s*\(')
        
        # Python
        py_import_re = re.compile(r'(?:from\s+(\S+)\s+)?import\s+([^#\n]+)')
        py_class_re = re.compile(r'class\s+(\w+)(?:\([^)]*\))?:')
        py_func_re = re.compile(r'def\s+(\w+)\s*\(')
        
        for rel_path in files:
            # We want to ignore third-party libraries, lockfiles, tests, etc.
            if rel_path.startswith(("node_modules", "dist", "build", "assets", "venv", ".serena")):
                continue
            
            file_id = rel_path.replace("\\", "/")
            if file_id not in node_ids:
                nodes.append({
                    "id": file_id,
                    "label": os.path.basename(rel_path),
                    "type": "file",
                    "path": file_id
                })
                node_ids.add(file_id)
                
            try:
                content = self.project.read_file(rel_path)
            except Exception:
                continue
                
            if rel_path.endswith((".ts", ".tsx", ".js", ".jsx")):
                # Class declarations
                for match in ts_class_re.finditer(content):
                    class_name = match.group(1)
                    class_id = f"{file_id}::{class_name}"
                    if class_id not in node_ids:
                        nodes.append({
                            "id": class_id,
                            "label": class_name,
                            "type": "class",
                            "file": file_id
                        })
                        node_ids.add(class_id)
                        edges.append({
                            "source": file_id,
                            "target": class_id,
                            "type": "contains"
                        })
                # Functions
                if include_functions:
                    for match in ts_func_re.finditer(content):
                        func_name = match.group(1) or match.group(2)
                        if func_name and func_name not in ("useState", "useEffect", "useCallback", "useRef", "useMemo"):
                            func_id = f"{file_id}::{func_name}"
                            if func_id not in node_ids:
                                nodes.append({
                                    "id": func_id,
                                    "label": func_name,
                                    "type": "function",
                                    "file": file_id
                                })
                                node_ids.add(func_id)
                                edges.append({
                                    "source": file_id,
                                    "target": func_id,
                                    "type": "contains"
                                })
                
                # Import relationships
                for match in ts_import_re.finditer(content):
                    imp_path = match.group(1) or match.group(2) or match.group(3)
                    if not imp_path:
                        continue
                    if imp_path.startswith("."):
                        target_dir = os.path.dirname(rel_path)
                        target_rel = os.path.normpath(os.path.join(target_dir, imp_path)).replace("\\", "/")
                        matched_target = None
                        for ext in ("", ".ts", ".tsx", ".js", ".jsx"):
                            candidate = f"{target_rel}{ext}"
                            if candidate in files:
                                matched_target = candidate
                                break
                            candidate_index = f"{target_rel}/index{ext}"
                            if candidate_index in files:
                                matched_target = candidate_index
                                break
                        if matched_target:
                            edges.append({
                                "source": file_id,
                                "target": matched_target,
                                "type": "imports"
                            })
                    else:
                        edges.append({
                            "source": file_id,
                            "target": imp_path,
                            "type": "references_external"
                        })
            
            elif rel_path.endswith(".py"):
                # Class declarations
                for match in py_class_re.finditer(content):
                    class_name = match.group(1)
                    class_id = f"{file_id}::{class_name}"
                    if class_id not in node_ids:
                        nodes.append({
                            "id": class_id,
                            "label": class_name,
                            "type": "class",
                            "file": file_id
                        })
                        node_ids.add(class_id)
                        edges.append({
                            "source": file_id,
                            "target": class_id,
                            "type": "contains"
                        })
                # Functions
                if include_functions:
                    for match in py_func_re.finditer(content):
                        func_name = match.group(1)
                        func_id = f"{file_id}::{func_name}"
                        if func_id not in node_ids:
                            nodes.append({
                                "id": func_id,
                                "label": func_name,
                                "type": "function",
                                "file": file_id
                            })
                            node_ids.add(func_id)
                            edges.append({
                                "source": file_id,
                                "target": func_id,
                                "type": "contains"
                            })
                
                # Import relationships
                for match in py_import_re.finditer(content):
                    from_module = match.group(1)
                    if from_module:
                        dot_count = len(from_module) - len(from_module.lstrip('.'))
                        if dot_count > 0:
                            target_dir = os.path.dirname(rel_path)
                            for _ in range(dot_count - 1):
                                target_dir = os.path.dirname(target_dir)
                            cleaned_from = from_module.lstrip('.')
                            target_rel = os.path.normpath(os.path.join(target_dir, *cleaned_from.split("."))).replace("\\", "/")
                            matched_target = None
                            for ext in ("", ".py", "/__init__.py"):
                                candidate = f"{target_rel}{ext}"
                                if candidate in files:
                                    matched_target = candidate
                                    break
                            if matched_target:
                                edges.append({
                                    "source": file_id,
                                    "target": matched_target,
                                    "type": "imports"
                                })
        
        return json.dumps({"nodes": nodes, "edges": edges}, indent=2)


class GetWorkflowChartTool(Tool):
    """
    Generates a Mermaid syntax flowchart representing the execution and agent swarm pipeline in the Coder5543 codebase.
    """

    def apply(self) -> str:
        """
        Use this tool to retrieve a Mermaid flowchart illustrating the agent swarm lifecycle and workflow.

        :return: a Markdown/Mermaid flowchart string.
        """
        mermaid_chart = """
flowchart TD
    subgraph Swarm Initialization
        Start([User Prompt / Mission]) --> Init[Swarm Engine Init]
        Init --> LoadBoosts[Run MCP Boosts]
        LoadBoosts --> BuildContext[Build Repository / File Context]
    end

    subgraph Phase 1: Parallel Thinking
        BuildContext --> SpawnAgents{Spawn Swarm Agents}
        SpawnAgents --> Architect[Software Architect]
        SpawnAgents --> Security[Security Engineer]
        SpawnAgents --> Backend[Backend Architect]
        SpawnAgents --> Frontend[Frontend Developer]
        SpawnAgents --> CodeReview[Code Reviewer]
        SpawnAgents --> UX[UX Architect]
        SpawnAgents --> AI[AI Engineer]
    end

    subgraph Phase 2: Critique & Refinement
        Architect & Security & Backend & Frontend & CodeReview & UX & AI --> CritiqueCheck{Critique Enabled?}
        CritiqueCheck -- Yes --> PeerReview[Agent Peer Review Loop]
        PeerReview --> RefineAnswers[Refine Agent Responses]
        RefineAnswers --> Synthesize
        CritiqueCheck -- No --> Synthesize[Synthesize Final Report]
    end

    subgraph Phase 3: Final Output
        Synthesize --> BuildReport[Create Swarm Report]
        BuildReport --> Broadcast[Emit swarm:complete / Save Report]
        Broadcast --> End([End Mission])
    end

    style Start fill:#1a365d,stroke:#3182ce,stroke-width:2px,color:#fff
    style End fill:#1a365d,stroke:#3182ce,stroke-width:2px,color:#fff
    style SpawnAgents fill:#2c3e50,stroke:#34495e,stroke-width:2px,color:#fff
    style CritiqueCheck fill:#2c3e50,stroke:#34495e,stroke-width:2px,color:#fff
"""
        return mermaid_chart.strip()
