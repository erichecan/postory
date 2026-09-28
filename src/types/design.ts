export type ElementStyle = {
  color?: string;
  fontSize?: string;
  fontFamily?: string;
  fontWeight?: string;
  fontStyle?: string;
  lineHeight?: number;
  letterSpacing?: string;
  textAlign?: "left" | "center" | "right";
  textDecoration?: string;
  textMode?: "fit";
  minFontSize?: string;
  verticalAlign?: "flex-start" | "center" | "flex-end";
  backgroundColor?: string;
  fill?: string;
  stroke?: string;
  strokeWidth?: number | string;
  borderRadius?: string;
  borderColor?: string;
  borderStyle?: string;
  borderWidth?: string;
  objectFit?: "cover" | "contain";
  objectPosition?: string;
  opacity?: number;
  filter?: string;
  mixBlendMode?: string;
};

export type ElementType = "text" | "shape" | "image";

export type DesignElement = {
  id: string;
  type: ElementType;
  name?: string | null;
  x: number;
  y: number;
  w: number;
  h: number;
  z: number;
  rotation: number;
  style: ElementStyle;
  content?: string;
  shapeType?: "rectangle" | "circle" | "line";
  locked?: boolean;
  hidden?: boolean;
};

export type DesignPage = {
  name: string;
  width: number;
  height: number;
  background: string;
  elements: DesignElement[];
};
