import { AnalysisOptionsSchema } from "../types/schemas.js";
import type { AnalysisOptions } from "../types/index.js";

export class AnalysisOptionsModel {
  private constructor(private readonly options: AnalysisOptions) {}

  static create(raw: Partial<AnalysisOptions> = {}): AnalysisOptionsModel {
    const parsed = AnalysisOptionsSchema.parse(raw);
    return new AnalysisOptionsModel(parsed);
  }

  get path(): string {
    return this.options.path;
  }

  get excludePatterns(): string[] {
    return this.options.excludePatterns;
  }

  get verbose(): boolean {
    return this.options.verbose;
  }

  get timeout(): number {
    return this.options.timeout;
  }

  get maxFileSize(): number {
    return this.options.maxFileSize;
  }

  get scopeType(): string {
    return this.options.scopeType;
  }

  get targetPath(): string {
    return this.options.targetPath;
  }

  toObject(): AnalysisOptions {
    return { ...this.options };
  }
}
