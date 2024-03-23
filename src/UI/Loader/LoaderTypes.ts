import { LoaderSizeMarginProps } from "react-spinners/helpers/props";

export enum LoaderSize {
  Small = "small",
  Medium = "medium",
  Large = "large",
}

export enum LoaderColor {
  Primary = "primary",
  Secondary = "secondary",
}

export enum LoaderDirection {
  Row = "row",
  Column = "column",
}

export enum LoaderIcon {
  Puff = "puff",
  Bar = "bar",
  Beat = "beat",
  Bounce = "bounce",
  Fade = "fade",
  Propagate = "propagate",
  Pulse = "pulse",
  Scale = "scale",
  Sync = "sync",
}

export type LoaderFunction = (
  options: LoaderSizeMarginProps,
) => JSX.Element | null;
