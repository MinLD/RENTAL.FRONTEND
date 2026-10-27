import test from "node:test";
import assert from "node:assert/strict";

import { isOwnerRole, isOwnerUser } from "../src/utils/auth-user.ts";

test("isOwnerRole identifies owner roles case-insensitively and handles whitespace", () => {
  assert.equal(isOwnerRole("Owner"), true);
  assert.equal(isOwnerRole("owner"), true);
  assert.equal(isOwnerRole("OWNER"), true);
  assert.equal(isOwnerRole(" own "), true);
  assert.equal(isOwnerRole("supplier"), true);
  assert.equal(isOwnerRole("sup"), true);

  assert.equal(isOwnerRole("admin"), false);
  assert.equal(isOwnerRole("customer"), false);
  assert.equal(isOwnerRole("cus"), false);
  assert.equal(isOwnerRole(""), false);
  assert.equal(isOwnerRole(null), false);
  assert.equal(isOwnerRole(undefined), false);
});

test("isOwnerUser returns true for users with Owner in globalRoles, roles, or role string", () => {
  // Case from database / screenshot Image #1: globalRoles has ["customer", "Owner"]
  assert.equal(
    isOwnerUser({
      globalRoles: ["customer", "Owner"],
      role: "customer, Owner",
    }),
    true,
  );

  // Case with only role string
  assert.equal(
    isOwnerUser({
      role: "Owner",
    }),
    true,
  );

  // Case with only roles array
  assert.equal(
    isOwnerUser({
      roles: ["customer", "own"],
    }),
    true,
  );

  // Case for normal customer
  assert.equal(
    isOwnerUser({
      globalRoles: ["customer"],
      role: "customer",
    }),
    false,
  );

  // Case for admin
  assert.equal(
    isOwnerUser({
      globalRoles: ["admin"],
      role: "admin",
    }),
    false,
  );

  // Null or undefined user
  assert.equal(isOwnerUser(null), false);
  assert.equal(isOwnerUser(undefined), false);
});
