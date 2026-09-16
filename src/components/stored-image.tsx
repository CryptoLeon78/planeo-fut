import { useSignedImageUrl, type ImageBucket } from "@/lib/storage";

type StoredImageProps = {
  bucket: ImageBucket;
  path: string | null | undefined;
  alt: string;
  className?: string;
};

/** Muestra una imagen guardada en un bucket privado usando una URL firmada. */
export function StoredImage({ bucket, path, alt, className }: StoredImageProps) {
  const url = useSignedImageUrl(bucket, path);
  if (!path || !url) return null;
  return <img src={url} alt={alt} className={className} loading="lazy" />;
}
