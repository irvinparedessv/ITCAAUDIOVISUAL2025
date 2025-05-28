import { useEffect, useRef } from "react";

interface PanoramaViewerProps {
  image: string;
  pitch?: number;
  yaw?: number;
  hfov?: number;
  width?: string;
  height?: string;
}

export default function PanoramaViewer({
  image,
  pitch = 0,
  yaw = 0,
  hfov = 100,
  width = "100%",
  height = "500px",
}: PanoramaViewerProps) {
  const viewerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (window.pannellum && viewerRef.current) {
      viewerRef.current.innerHTML = ""; // Limpiar instancia anterior
      window.pannellum.viewer(viewerRef.current, {
        type: "equirectangular",
        panorama: image,
        pitch,
        yaw,
        hfov,
        autoLoad: true,
        showZoomCtrl: false,
      });
    }
  }, [image, pitch, yaw, hfov]);

  return <div ref={viewerRef} style={{ width, height }} />;
}
