// src/vite-env.d.ts
/// <reference types="vite/client" />

declare module '*.vue' {
  import type { DefineComponent } from 'vue'
  const component: DefineComponent<{}, {}, any>
  export default component
}

// You generally don't need this if "resolveJsonModule": true is in tsconfig.app.json
// declare module '*.json' {
//   const value: any;
//   export default value;
// }