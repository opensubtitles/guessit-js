// Type augmentation for rebulk-js.
//
// Upstream types `Rebulk.rules(...)` as `Array<CustomRule | CustomRule>` — i.e.
// only rule *instances*. The runtime (and its own `Rules.load()`) also accepts
// rule *constructors* (classes), which this codebase passes throughout. Add the
// constructor variant as an overload so passing a class is type-correct.
import type { CustomRule } from 'rebulk-js';

declare module 'rebulk-js' {
  interface Rebulk {
    rules(...rules: Array<typeof CustomRule | CustomRule>): this;
  }
}
