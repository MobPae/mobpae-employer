import { describe, expect, it } from "vitest";
import { getPasswordStrength } from "./passwordStrength";

describe("getPasswordStrength", () => {
  it("rates an empty password as Weak with score 0", () => {
    expect(getPasswordStrength("")).toEqual({ score: 0, label: "Weak" });
  });

  it("rates a short all-lowercase password as Weak", () => {
    expect(getPasswordStrength("abc").label).toBe("Weak");
  });

  it("rates a long password with mixed case, digits, and symbols as Strong", () => {
    expect(getPasswordStrength("Correct-Horse-Battery-9").label).toBe("Strong");
  });

  it("never exceeds a score of 4", () => {
    expect(getPasswordStrength("Extremely-L0ng-P@ssphrase-With-Everything!!").score).toBeLessThanOrEqual(4);
  });
});
