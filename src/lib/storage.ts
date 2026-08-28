import { supabase } from "@/integrations/supabase/client";

const SIGNED_URL_TTL_SECONDS = 60 * 60;
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

export function validateImageFile(file: File) {
  if (!file.type.startsWith("image/")) throw new Error("El archivo debe ser una imagen");
  if (file.size > MAX_IMAGE_BYTES) throw new Error("La imagen no puede superar 5 MB");
}

/** Accepts both new storage paths and legacy public URLs during the cutover. */
export function storagePath(value: string, bucket: string) {
  const marker = `/storage/v1/object/public/${bucket}/`;
  const index = value.indexOf(marker);
  if (index < 0) return value;
  const rawPath = value.slice(index + marker.length);
  try {
    return decodeURIComponent(rawPath);
  } catch {
    return rawPath;
  }
}

export async function resolveStorageUrl(bucket: string, value: string | null | undefined) {
  if (!value) return null;
  const path = storagePath(value, bucket);
  const { data, error } = await supabase.storage.from(bucket).createSignedUrl(path, SIGNED_URL_TTL_SECONDS);
  if (error) return null;
  return data.signedUrl;
}
