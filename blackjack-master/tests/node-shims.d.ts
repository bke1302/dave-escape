/**
 * הצהרות טיפוס מינימליות למודולי הליבה של Node.
 * הסביבה חסומה מהתקנת חבילות (@types/node), ולכן מוגדר כאן רק מה שהבדיקות צורכות.
 */
declare module 'node:test' {
  interface TestContext {
    name: string;
  }
  type TestFn = (t: TestContext) => void | Promise<void>;
  function test(name: string, fn: TestFn): void;
  export default test;
}

declare module 'node:assert/strict' {
  interface AssertStrict {
    (value: unknown, message?: string): asserts value;
    ok(value: unknown, message?: string): asserts value;
    equal<T>(actual: unknown, expected: T, message?: string): asserts actual is T;
    notEqual(actual: unknown, expected: unknown, message?: string): void;
    deepEqual<T>(actual: unknown, expected: T, message?: string): void;
    notDeepEqual(actual: unknown, expected: unknown, message?: string): void;
    match(value: string, pattern: RegExp, message?: string): void;
    throws(fn: () => unknown, message?: string): void;
    fail(message?: string): never;
  }
  const assert: AssertStrict;
  export default assert;
}
