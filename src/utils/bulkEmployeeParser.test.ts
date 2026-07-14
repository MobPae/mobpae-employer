import { describe, expect, it } from "vitest";
import { parseRows } from "./bulkEmployeeParser";

describe("parseRows", () => {
  it("parses a well-formed row with no errors", () => {
    const [row] = parseRows("EMP-001,Arjun Sharma,arjun@company.com,+91 98765 11111,54000,ACTIVE,false,Engineering");
    expect(row.errors).toEqual([]);
    expect(row.payload).toMatchObject({
      employeeCode: "EMP-001", name: "Arjun Sharma", email: "arjun@company.com",
      salaryInHand: 54000, employmentStatus: "ACTIVE", appActivated: false, department: "Engineering",
    });
  });

  it("skips blank lines", () => {
    const rows = parseRows("EMP-001,A,a@co.com,123,50000,ACTIVE,false,Eng\n\n\nEMP-002,B,b@co.com,124,50000,ACTIVE,false,Eng");
    expect(rows).toHaveLength(2);
  });

  it("flags every required field that's missing", () => {
    const [row] = parseRows(",,,,,,,");
    expect(row.errors).toEqual(
      expect.arrayContaining(["code required", "name required", "valid email required", "phone required"])
    );
  });

  it("rejects an email without an @", () => {
    const [row] = parseRows("EMP-001,Arjun,not-an-email,123,50000,ACTIVE,false,Eng");
    expect(row.errors).toContain("valid email required");
  });

  it("rejects a zero or negative salary", () => {
    expect(parseRows("EMP-001,A,a@co.com,123,0,ACTIVE,false,Eng")[0].errors).toContain("salary must be positive (remove commas)");
    expect(parseRows("EMP-001,A,a@co.com,123,-500,ACTIVE,false,Eng")[0].errors).toContain("salary must be positive (remove commas)");
  });

  it("strips comma thousands-separators from a quoted salary field before parsing", () => {
    // Regression: Number("50,000") is NaN, which used to fail validation
    // with a confusing "salary must be positive" and no hint why. The field
    // must also be quote-aware — a naive split(",") would otherwise shift
    // every column after an unquoted "50,000".
    const [row] = parseRows('EMP-001,Arjun,a@co.com,123,"50,000",ACTIVE,false,Eng');
    expect(row.payload.salaryInHand).toBe(50000);
    expect(row.payload.employmentStatus).toBe("ACTIVE");
    expect(row.payload.department).toBe("Eng");
    expect(row.errors).toEqual([]);
  });

  it("rejects an unrecognized employment status", () => {
    const [row] = parseRows("EMP-001,A,a@co.com,123,50000,ON_LEAVE,false,Eng");
    expect(row.errors).toContain("status: ACTIVE or INACTIVE");
  });

  it("accepts common truthy spellings for appActivated", () => {
    expect(parseRows("EMP-001,A,a@co.com,123,50000,ACTIVE,true,Eng")[0].payload.appActivated).toBe(true);
    expect(parseRows("EMP-001,A,a@co.com,123,50000,ACTIVE,yes,Eng")[0].payload.appActivated).toBe(true);
    expect(parseRows("EMP-001,A,a@co.com,123,50000,ACTIVE,1,Eng")[0].payload.appActivated).toBe(true);
    expect(parseRows("EMP-001,A,a@co.com,123,50000,ACTIVE,no,Eng")[0].payload.appActivated).toBe(false);
  });

  it("flags duplicate employee codes within the same paste, case-insensitively", () => {
    const rows = parseRows([
      "EMP-001,Arjun,a@co.com,111,50000,ACTIVE,false,Eng",
      "emp-001,Duplicate,b@co.com,222,60000,ACTIVE,false,Sales",
      "EMP-002,Unique,c@co.com,333,70000,ACTIVE,false,HR",
    ].join("\n"));

    expect(rows[0].errors).toContain("duplicate code in this file");
    expect(rows[1].errors).toContain("duplicate code in this file");
    expect(rows[2].errors).not.toContain("duplicate code in this file");
  });

  it("does not flag rows with a blank employee code as duplicates of each other", () => {
    const rows = parseRows([
      ",Arjun,a@co.com,111,50000,ACTIVE,false,Eng",
      ",Priya,b@co.com,222,60000,ACTIVE,false,Sales",
    ].join("\n"));
    expect(rows[0].errors).not.toContain("duplicate code in this file");
    expect(rows[1].errors).not.toContain("duplicate code in this file");
  });
});
