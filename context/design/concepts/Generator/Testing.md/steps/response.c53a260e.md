---
timestamp: 'Thu Oct 30 2025 00:19:40 GMT-0400 (Eastern Daylight Time)'
parent: '[[../20251030_001940.b00b8cf0.md]]'
content_id: c53a260e4547c91835e5a39265612a35427bd4d040da1c4575861c6440366c87
---

# response:

The issue with `t.beforeEach` and `t.afterAll` is that they are not part of Deno's `Deno.test` API for nested `t.step` calls in the way they are used in other testing frameworks.

To achieve the desired isolation (a fresh `ConceptGenerator` and `MockLLM` for each `t.step`), the most idiomatic Deno way is to initialize these instances at the beginning of each `t.step` function itself.

For the `testDb` setup/teardown, `Deno.test.afterAll` should be called at the top level of the test module to ensure it runs once after all tests in the file complete. The `testDb()` call can remain at the beginning of the main `Deno.test` block.

Here's the rewritten test file:
