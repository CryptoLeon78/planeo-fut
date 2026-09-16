import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

/** Buckets privados de la aplicación. */
export type ImageBucket = "exercise-images" | "team-images";

const SIGNED_URL_TTL_SECONDS = 60 * 60;

/**
 * Sube una imagen al bucket indicado y devuelve la RUTA del objeto
 * (no una URL): los buckets son privados y las URLs se firman al mostrarlas.
 */
export async function uploadImage(
  bucket: ImageBucket,
  path: string,
  file: File,
): Promise<string> {
  const { error } = await supabase.storage.from(bucket).upload(path, file, { upsert: true });
  if (error) throw error;
  return path;
}

/** Firma una ruta de objeto para poder mostrarla en un <img>. */
export async function getSignedImageUrl(
  bucket: ImageBucket,
  path: string,
): Promise<string | null> {
  // Compatibilidad con valores antiguos que ya eran URLs absolutas.
  if (/^https?:\/\//.test(path)) return path;
  const { data, error } = await supabase.storage
    .from(bucket)
    .createSignedUrl(path, SIGNED_URL_TTL_SECONDS);
  if (error) return null;
  return data?.signedUrl ?? null;
}

/** URL firmada para una ruta almacenada; se refresca antes de caducar. */
export function useSignedImageUrl(bucket: ImageBucket, path: string | null | undefined) {
  const { data } = useQuery({
    queryKey: ["signed-image", bucket, path],
    enabled: Boolean(path),
    staleTime: (SIGNED_URL_TTL_SECONDS - 300) * 1000,
    queryFn: () => getSignedImageUrl(bucket, path as string),
  });
  return data ?? null;
}
