import { expect, test } from "bun:test";
import { parseCapacityToGB } from "./variants";

test("parseCapacityToGB: standard formats", () => {
  expect(parseCapacityToGB("128 GB")).toBe(128);
  expect(parseCapacityToGB("1 TB")).toBe(1024);
  expect(parseCapacityToGB("256GB")).toBe(256);
});

test("parseCapacityToGB: thousand separators (dot)", () => {
  // This was the bug: 1.024 TB was becoming 1.024 GB
  // It should be treated as 1024 GB (1 TB)
  expect(parseCapacityToGB("1.024 TB")).toBe(1024);
  expect(parseCapacityToGB("1.000 GB")).toBe(1000);
});

test("parseCapacityToGB: comma as decimal", () => {
  expect(parseCapacityToGB("1,5 TB")).toBe(1536);
});

test("parseCapacityToGB: mixed noise", () => {
  expect(parseCapacityToGB("Storage: 1.024 TB; Case: none")).toBe(1024);
});
