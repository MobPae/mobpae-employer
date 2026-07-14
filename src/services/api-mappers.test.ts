import { describe, expect, it } from "vitest";
import {
  mapAuthUser,
  mapDashboardStats,
  mapEmployee,
  mapLoanApplication,
  mapLoanApplicationHistoryEvent,
  mapSettlement,
  mapUserSession,
  unwrapItem,
  unwrapList,
} from "./api-mappers";

describe("mapAuthUser", () => {
  it("never fabricates a company name when the API omits it", () => {
    // Regression test: mapAuthUser used to default a missing companyName to
    // the literal string "MobPae Employer", which read as real data and hid
    // a missing API field. It must come back empty so the UI can show an
    // honest fallback instead.
    const user = mapAuthUser({ email: "hr@acme.com", role: "EMPLOYER" });
    expect(user.companyName).toBe("");
    expect(user.companyCode).toBe("");
  });

  it("falls back to email for name when the API omits both name and fullName", () => {
    const user = mapAuthUser({ email: "hr@acme.com", role: "EMPLOYER" });
    expect(user.name).toBe("hr@acme.com");
  });

  it("prefers an explicit name over email", () => {
    const user = mapAuthUser({ name: "Arjun Sharma", email: "hr@acme.com", role: "EMPLOYER" });
    expect(user.name).toBe("Arjun Sharma");
  });

  it("reads companyName/companyCode from a nested employer object", () => {
    const user = mapAuthUser({
      email: "hr@acme.com",
      role: "EMPLOYER",
      employer: { companyName: "Acme Corp", companyCode: "ACME01" },
    });
    expect(user.companyName).toBe("Acme Corp");
    expect(user.companyCode).toBe("ACME01");
  });

  it("passes through a real lastLoginAt string", () => {
    const user = mapAuthUser({ email: "hr@acme.com", role: "EMPLOYER", lastLoginAt: "2026-07-13T08:00:00Z" });
    expect(user.lastLoginAt).toBe("2026-07-13T08:00:00Z");
  });

  it("defaults lastLoginAt to null rather than a placeholder", () => {
    const user = mapAuthUser({ email: "hr@acme.com", role: "EMPLOYER" });
    expect(user.lastLoginAt).toBeNull();
  });

  it("defaults an unrecognized role to EMPLOYER", () => {
    const user = mapAuthUser({ email: "hr@acme.com" });
    expect(user.role).toBe("EMPLOYER");
  });

  it("handles completely empty input without throwing", () => {
    expect(() => mapAuthUser({})).not.toThrow();
    expect(() => mapAuthUser(null)).not.toThrow();
    expect(() => mapAuthUser(undefined)).not.toThrow();
  });
});

describe("mapEmployee", () => {
  it("maps a well-formed record", () => {
    const emp = mapEmployee({
      id: "e1", employeeCode: "EMP-001", name: "Ananya Sharma", email: "a@co.com",
      phone: "9876500000", salaryInHand: 50000, employmentStatus: "ACTIVE",
      appActivated: true, department: "Engineering",
    });
    expect(emp).toMatchObject({
      id: "e1", employeeCode: "EMP-001", name: "Ananya Sharma",
      salaryInHand: 50000, employmentStatus: "ACTIVE", appActivated: true,
    });
  });

  it("derives name from firstName + lastName when name/fullName are absent", () => {
    const emp = mapEmployee({ firstName: "Ananya", lastName: "Sharma" });
    expect(emp.name).toBe("Ananya Sharma");
  });

  it("normalizes unknown employment status to ACTIVE, INACTIVE-like values to INACTIVE", () => {
    expect(mapEmployee({ employmentStatus: "TERMINATED" }).employmentStatus).toBe("INACTIVE");
    expect(mapEmployee({ employmentStatus: "banana" }).employmentStatus).toBe("ACTIVE");
  });
});

describe("mapLoanApplication", () => {
  it("defaults employerApprovedAmount to the requested amount once approved/disbursed", () => {
    const app = mapLoanApplication({ requestedAmount: 20000, status: "DISBURSED" });
    expect(app.employerApprovedAmount).toBe(20000);
  });

  it("defaults employerApprovedAmount to 0 while still pending", () => {
    const app = mapLoanApplication({ requestedAmount: 20000, status: "SUBMITTED" });
    expect(app.employerApprovedAmount).toBe(0);
  });

  it("falls back to SUBMITTED for an unrecognized status rather than crashing", () => {
    const app = mapLoanApplication({ status: "SOME_FUTURE_STATUS" });
    expect(app.status).toBe("SUBMITTED");
  });
});

describe("mapLoanApplicationHistoryEvent", () => {
  it("maps a well-formed history event", () => {
    const event = mapLoanApplicationHistoryEvent({
      id: "evt_1", status: "EMPLOYER_APPROVED", actorType: "EMPLOYER",
      actorName: "Rohan Mehta", actorId: "usr1", note: null, createdAt: "2026-07-10T14:22:00Z",
    });
    expect(event).toMatchObject({ status: "EMPLOYER_APPROVED", actorType: "EMPLOYER", actorName: "Rohan Mehta" });
  });

  it("defaults an unrecognized actorType to SYSTEM instead of throwing", () => {
    const event = mapLoanApplicationHistoryEvent({ actorType: "ROBOT" });
    expect(event.actorType).toBe("SYSTEM");
  });

  it("treats an empty note string as null, not an empty bubble", () => {
    const event = mapLoanApplicationHistoryEvent({ note: "" });
    expect(event.note).toBeNull();
  });
});

describe("mapUserSession", () => {
  it("maps a well-formed session", () => {
    const session = mapUserSession({
      id: "s1", current: true, device: "Chrome on macOS", ipAddress: "::1",
      loginAt: "2026-07-10T09:15:00Z", lastActiveAt: "2026-07-14T11:02:00Z",
    });
    expect(session).toMatchObject({ id: "s1", current: true, device: "Chrome on macOS" });
  });

  it("defaults to a non-current session with an honest 'unknown device' label", () => {
    const session = mapUserSession({});
    expect(session.current).toBe(false);
    expect(session.device).toBe("Unknown device");
  });
});

describe("mapSettlement", () => {
  it("parses amounts that arrive as numeric strings from the backend", () => {
    const settlement = mapSettlement({ totalAmount: "24680.5", outstandingAmount: "0" });
    expect(settlement.totalAmount).toBe(24680.5);
    expect(settlement.outstandingAmount).toBe(0);
  });

  it("normalizes legacy PENDING/NO_DUES statuses to GENERATED", () => {
    expect(mapSettlement({ status: "PENDING" }).status).toBe("GENERATED");
    expect(mapSettlement({ status: "NO_DUES" }).status).toBe("GENERATED");
  });
});

describe("mapDashboardStats", () => {
  it("reads nested employer-dashboard shape", () => {
    const stats = mapDashboardStats({
      employees: { total: 128, active: 120, appActivated: 96 },
      salaryRequests: { pending: 7, approved: 34 },
    });
    expect(stats.totalEmployees).toBe(128);
    expect(stats.appActivatedEmployees).toBe(96);
    expect(stats.pendingLoanApplications).toBe(7);
  });

  it("falls back to flat/legacy field names when nested objects are absent", () => {
    const stats = mapDashboardStats({ totalEmployees: 50, pendingLoanApplications: 3 });
    expect(stats.totalEmployees).toBe(50);
    expect(stats.pendingLoanApplications).toBe(3);
  });

  it("never throws on a completely empty payload", () => {
    expect(() => mapDashboardStats({})).not.toThrow();
    const stats = mapDashboardStats({});
    expect(stats.totalEmployees).toBe(0);
    expect(stats.recentActivity).toEqual([]);
  });
});

describe("unwrapList", () => {
  it("returns a bare array unchanged", () => {
    expect(unwrapList([1, 2, 3])).toEqual([1, 2, 3]);
  });

  it("finds an array under a named key", () => {
    expect(unwrapList({ sessions: [1, 2] }, ["sessions"])).toEqual([1, 2]);
  });

  it("returns an empty array when nothing matches, instead of throwing", () => {
    expect(unwrapList({ foo: "bar" })).toEqual([]);
    expect(unwrapList(null)).toEqual([]);
  });
});

describe("unwrapItem", () => {
  it("finds an object under a named key", () => {
    expect(unwrapItem({ profile: { a: 1 } }, ["profile"])).toEqual({ a: 1 });
  });

  it("falls back to the raw value when no wrapper key matches", () => {
    expect(unwrapItem({ a: 1 })).toEqual({ a: 1 });
  });
});
