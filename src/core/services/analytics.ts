export type AnalyticsProps = Record<string, string | number | boolean | null>;

/** Single analytics entry point. Does nothing until real analytics are approved. */
export function track(_event: string, _props?: AnalyticsProps): void {}
