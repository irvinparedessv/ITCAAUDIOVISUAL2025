declare namespace JSX {
  interface IntrinsicElements {
    "model-viewer": React.DetailedHTMLProps<
      React.HTMLAttributes<HTMLElement>,
      HTMLElement
    > & {
      src?: string;
      alt?: string;
      autoRotate?: boolean;
      cameraControls?: boolean;
      ar?: boolean;
      shadowIntensity?: number;
      exposure?: number;
      poster?: string;
      // Puedes extender más props si las necesitas
    };
  }
}
