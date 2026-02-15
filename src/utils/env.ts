/**
 * 环境变量获取工具
 */

export function getEnv(key: string, defaultValue: string): string {
  // 从全局变量获取（在 Workers 中通过 this 访问）
  const globalAny = globalThis as any;
  return globalAny[key] || globalAny.env?.[key] || defaultValue;
}

export function getEnvNumber(key: string, defaultValue: number): number {
  const value = getEnv(key, '');
  const parsed = parseFloat(value);
  return isNaN(parsed) ? defaultValue : parsed;
}

export function getEnvBoolean(key: string, defaultValue: boolean): boolean {
  const value = getEnv(key, '').toLowerCase();
  if (value === 'true' || value === '1') return true;
  if (value === 'false' || value === '0') return false;
  return defaultValue;
}
