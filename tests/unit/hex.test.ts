import { describe, expect, it } from "vitest";
import { parseHexInput } from "@/lib/color/hex";
import { HEX_HELP } from "@/lib/color/constants";

describe("PAL hex parsing", () => {
  it("PAL 01 expands three-digit hex", () => {
    expect(parseHexInput("abc")).toEqual({ ok: true, hex: "#AABBCC" });
    expect(parseHexInput("#abc")).toEqual({ ok: true, hex: "#AABBCC" });
  });

  it("PAL 02 rejects invalid and eight-digit values", () => {
    expect(parseHexInput("zzzzzz")).toEqual({ ok: false, message: HEX_HELP });
    expect(parseHexInput("#D8A7B1FF")).toEqual({ ok: false, message: HEX_HELP });
    expect(parseHexInput("rgb(1,2,3)")).toEqual({ ok: false, message: HEX_HELP });
  });

  it("normalizes six-digit values", () => {
    expect(parseHexInput("d8a7b1")).toEqual({ ok: true, hex: "#D8A7B1" });
  });
});
