import { execSync } from "child_process";
try {
  const result = execSync(`python3 agents/self_analysis.py '{"dopamine": 0.8, "serotonin": 0.6, "cortisol": 0.2, "norepinephrine": 0.4, "phi": 0.8}'`, { env: process.env });
  console.log(result.toString());
} catch (e: any) {
  console.error("Error:", e.stdout?.toString(), e.stderr?.toString(), e.message);
}
