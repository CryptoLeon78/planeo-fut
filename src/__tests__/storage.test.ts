import { describe, expect, it } from "vitest";
import { storagePath, validateImageFile } from "@/lib/storage";

describe("secure storage helpers", () => {
  it("normalizes legacy public URLs to a storage path", () => {
    expect(storagePath(
      "https://example.supabase.co/storage/v1/object/public/team-images/user-1/shield.png",
      "team-images",
    )).toBe("user-1/shield.png");
    expect(storagePath("user-1/shield.png", "team-images")).toBe("user-1/shield.png");
  });

  it("rejects non-images and files over the configured limit", () => {
    expect(() => validateImageFile(new File(["text"], "notes.txt", { type: "text/plain" }))).toThrow("imagen");
    expect(() => validateImageFile(new File([new Uint8Array(5 * 1024 * 1024 + 1)], "large.png", { type: "image/png" }))).toThrow("5 MB");
  });
});
