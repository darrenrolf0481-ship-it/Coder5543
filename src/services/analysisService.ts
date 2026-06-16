/**
 * Unified Analysis Service
 *
 * Consolidates all analysis functions (static analysis, dynamic tracing,
 * deep project audit, code scanning) into a single interface.
 *
 * Routes results through the event bus so all panels can react.
 */

import { eventBus } from './eventBus';
import type { ProjectFile } from '../hooks/editor/useEditorFileSystem';

export interface AnalysisResult {
  type: 'static' | 'dynamic' | 'security' | 'performance' | 'architecture' | 'deep';
  title: string;
  findings: Finding[];
  summary: string;
  metadata?: any;
}

export interface Finding {
  severity: 'error' | 'warning' | 'info' | 'suggestion';
  file?: string;
  line?: number;
  message: string;
  suggestion?: string;
}

class AnalysisService {
  /**
   * Run complete project analysis
   * Automatically determines which analyses to run based on context
   */
  async analyzeProject(
    projectFiles: ProjectFile[],
    options?: {
      types?: Array<'static' | 'dynamic' | 'security' | 'performance' | 'architecture'>;
      deep?: boolean;
    }
  ): Promise<AnalysisResult[]> {
    eventBus.emit('analysis:started', {
      type: 'project',
      fileCount: projectFiles.length,
      options
    });

    const results: AnalysisResult[] = [];
    const types = options?.types || ['static', 'security', 'architecture'];

    try {
      // Run all selected analysis types
      for (const type of types) {
        const result = await this.runAnalysis(type, projectFiles);
        results.push(result);
      }

      // Deep audit if requested
      if (options?.deep) {
        const deepResult = await this.deepProjectAudit(projectFiles);
        results.push(deepResult);
      }

      eventBus.emit('analysis:completed', {
        type: 'project',
        resultsCount: results.length,
        findingsCount: results.reduce((sum, r) => sum + r.findings.length, 0),
      });

      // Emit each result individually for real-time UI updates
      results.forEach(result => {
        eventBus.emit('analysis:result', {
          title: result.title,
          type: result.type,
          summary: result.summary,
          findings: result.findings,
        });
      });

      return results;
    } catch (error) {
      eventBus.emit('analysis:error', {
        type: 'project',
        error: error instanceof Error ? error.message : 'Analysis failed',
      });
      throw error;
    }
  }

  /**
   * Run a specific analysis type
   */
  private async runAnalysis(
    type: 'static' | 'dynamic' | 'security' | 'performance' | 'architecture',
    projectFiles: ProjectFile[]
  ): Promise<AnalysisResult> {
    switch (type) {
      case 'static':
        return this.runStaticAnalysis(projectFiles);
      case 'security':
        return this.runSecurityAnalysis(projectFiles);
      case 'architecture':
        return this.runArchitectureAnalysis(projectFiles);
      case 'performance':
        return this.runPerformanceAnalysis(projectFiles);
      case 'dynamic':
        return this.runDynamicAnalysis(projectFiles);
      default:
        throw new Error(`Unknown analysis type: ${type}`);
    }
  }

  /**
   * Static code analysis
   */
  private async runStaticAnalysis(files: ProjectFile[]): Promise<AnalysisResult> {
    const findings: Finding[] = [];

    // Analyze each file
    files
      .filter(f => f.type === 'file')
      .forEach(file => {
        if (!file.content) return;

        // Basic static analysis patterns
        const lines = file.content.split('\n');

        lines.forEach((line, lineNum) => {
          // Check for common issues
          if (line.includes('console.log')) {
            findings.push({
              severity: 'info',
              file: file.name,
              line: lineNum + 1,
              message: 'console.log statement found',
              suggestion: 'Remove or replace with proper logging',
            });
          }

          if (line.includes('TODO') || line.includes('FIXME')) {
            findings.push({
              severity: 'info',
              file: file.name,
              line: lineNum + 1,
              message: 'TODO/FIXME comment found',
              suggestion: 'Address this TODO/FIXME',
            });
          }

          // Check for unused imports (simplified)
          if (line.match(/^import\s+.*from\s+['"].+['"];?\s*$/)) {
            const importMatch = line.match(/import\s+(?:\{[^}]+\}|\w+)\s+from/);
            if (importMatch) {
              const imported = importMatch[1].replace(/[{}]/g, '').trim();
              const usageCount = (file.content?.match(new RegExp(`\\b${imported}\\b`, 'g')) || []).length;
              if (usageCount <= 1) {
                findings.push({
                  severity: 'warning',
                  file: file.name,
                  line: lineNum + 1,
                  message: `Potentially unused import: ${imported}`,
                  suggestion: 'Remove unused import',
                });
              }
            }
          }
        });
      });

    return {
      type: 'static',
      title: 'Static Analysis',
      findings,
      summary: `Found ${findings.length} issues across ${files.length} files`,
    };
  }

  /**
   * Security analysis
   */
  private async runSecurityAnalysis(files: ProjectFile[]): Promise<AnalysisResult> {
    const findings: Finding[] = [];

    files
      .filter(f => f.type === 'file')
      .forEach(file => {
        if (!file.content) return;

        const lines = file.content.split('\n');

        lines.forEach((line, lineNum) => {
          // Check for potential security issues
          if (line.includes('eval(')) {
            findings.push({
              severity: 'error',
              file: file.name,
              line: lineNum + 1,
              message: 'eval() usage detected - potential security risk',
              suggestion: 'Avoid eval() or use a safer alternative',
            });
          }

          if (line.includes('innerHTML') && !line.includes('DOMPurify')) {
            findings.push({
              severity: 'warning',
              file: file.name,
              line: lineNum + 1,
              message: 'innerHTML without sanitization',
              suggestion: 'Use DOMPurify.sanitize() before setting innerHTML',
            });
          }

          if (line.match(/password\s*=\s*['"].+['"]/)) {
            findings.push({
              severity: 'error',
              file: file.name,
              line: lineNum + 1,
              message: 'Hardcoded password detected',
              suggestion: 'Use environment variables or secure storage',
            });
          }

          if (line.includes('process.env') && !line.includes('VITE_')) {
            findings.push({
              severity: 'info',
              file: file.name,
              line: lineNum + 1,
              message: 'Environment variable usage',
              suggestion: 'Ensure secrets are not exposed in frontend code',
            });
          }
        });
      });

    return {
      type: 'security',
      title: 'Security Analysis',
      findings,
      summary: `Found ${findings.filter(f => f.severity === 'error').length} security errors`,
    };
  }

  /**
   * Architecture analysis
   */
  private async runArchitectureAnalysis(files: ProjectFile[]): Promise<AnalysisResult> {
    const findings: Finding[] = [];

    // Check for common architectural patterns
    const hasComponents = files.some(f => f.name.includes('Component') || f.parentId?.includes('component'));
    const hasHooks = files.some(f => f.name.startsWith('use'));
    const hasServices = files.some(f => f.parentId?.includes('service'));
    const hasTests = files.some(f => f.name.includes('.test.') || f.name.includes('.spec.'));

    if (!hasComponents && files.length > 10) {
      findings.push({
        severity: 'suggestion',
        message: 'No component directory structure detected',
        suggestion: 'Consider organizing code into components/',
      });
    }

    if (!hasHooks && files.length > 10) {
      findings.push({
        severity: 'suggestion',
        message: 'No custom hooks detected',
        suggestion: 'Consider extracting reusable logic into custom hooks',
      });
    }

    if (!hasTests) {
      findings.push({
        severity: 'warning',
        message: 'No test files detected',
        suggestion: 'Add unit tests to improve code quality',
      });
    }

    // Check file organization
    const folders = files.filter(f => f.type === 'folder');
    if (folders.length < 3) {
      findings.push({
        severity: 'info',
        message: 'Flat directory structure detected',
        suggestion: 'Consider organizing files into meaningful directories',
      });
    }

    return {
      type: 'architecture',
      title: 'Architecture Analysis',
      findings,
      summary: findings.length > 0
        ? `${findings.length} architectural suggestions`
        : 'Project follows good architectural patterns',
    };
  }

  /**
   * Performance analysis
   */
  private async runPerformanceAnalysis(files: ProjectFile[]): Promise<AnalysisResult> {
    const findings: Finding[] = [];

    files
      .filter(f => f.type === 'file')
      .forEach(file => {
        if (!file.content) return;

        const lines = file.content.split('\n');

        lines.forEach((line, lineNum) => {
          // Check for performance anti-patterns
          if (line.includes('.map(') && line.includes('.filter(')) {
            findings.push({
              severity: 'suggestion',
              file: file.name,
              line: lineNum + 1,
              message: 'Chained array methods may cause multiple iterations',
              suggestion: 'Consider using a single loop or memoization',
            });
          }

          if (line.match(/\.\w+\(\s*function\s*\(/)) {
            findings.push({
              severity: 'info',
              file: file.name,
              line: lineNum + 1,
              message: 'Anonymous function in iteration',
              suggestion: 'Consider extracting to a named function',
            });
          }
        });
      });

    return {
      type: 'performance',
      title: 'Performance Analysis',
      findings,
      summary: `Found ${findings.length} performance suggestions`,
    };
  }

  /**
   * Dynamic analysis (runtime behavior)
   */
  private async runDynamicAnalysis(files: ProjectFile[]): Promise<AnalysisResult> {
    // This would typically require actual runtime execution
    // For now, return a placeholder
    return {
      type: 'dynamic',
      title: 'Dynamic Analysis',
      findings: [],
      summary: 'Dynamic analysis requires runtime execution',
    };
  }

  /**
   * Deep project audit (comprehensive analysis)
   */
  private async deepProjectAudit(files: ProjectFile[]): Promise<AnalysisResult> {
    // Run all analysis types and aggregate
    const [staticResult, securityResult, archResult, perfResult] = await Promise.all([
      this.runStaticAnalysis(files),
      this.runSecurityAnalysis(files),
      this.runArchitectureAnalysis(files),
      this.runPerformanceAnalysis(files),
    ]);

    const allFindings = [
      ...staticResult.findings,
      ...securityResult.findings,
      ...archResult.findings,
      ...perfResult.findings,
    ];

    const errors = allFindings.filter(f => f.severity === 'error').length;
    const warnings = allFindings.filter(f => f.severity === 'warning').length;

    return {
      type: 'deep',
      title: 'Deep Project Audit',
      findings: allFindings,
      summary: `Found ${errors} errors, ${warnings} warnings across ${files.length} files`,
      metadata: {
        staticFindings: staticResult.findings.length,
        securityFindings: securityResult.findings.length,
        archFindings: archResult.findings.length,
        perfFindings: perfResult.findings.length,
      },
    };
  }
}

export const analysisService = new AnalysisService();