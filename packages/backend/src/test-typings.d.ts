/* Archivo para declarar globales de test (evita instalar @types/jest si falla la instalación)
   Inclúyelo en `src` para que TypeScript lo recoja en el entorno del paquete backend.
*/

declare function describe(name: string, fn: () => void): void;
declare function it(name: string, fn: () => void | Promise<void>): void;
declare function test(name: string, fn: () => void | Promise<void>): void;
declare function beforeEach(fn: () => void | Promise<void>): void;
declare function afterEach(fn: () => void | Promise<void>): void;

declare const expect: any;
declare const jest: any;

export {};
