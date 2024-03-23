import {
  PuffLoader,
  BarLoader,
  BeatLoader,
  BounceLoader,
  FadeLoader,
  PropagateLoader,
  PulseLoader,
  ScaleLoader,
  SyncLoader,
} from "react-spinners";
import styles from "./Loader.module.scss";
import { useTranslation } from "react-i18next";
import classNames from "classnames";
import {
  LoaderColor,
  LoaderDirection,
  LoaderFunction,
  LoaderIcon,
  LoaderSize,
} from "./LoaderTypes.ts";

const loaderMap: Record<LoaderIcon, LoaderFunction> = {
  [LoaderIcon.Puff]: PuffLoader,
  [LoaderIcon.Bar]: BarLoader,
  [LoaderIcon.Beat]: BeatLoader,
  [LoaderIcon.Bounce]: BounceLoader,
  [LoaderIcon.Fade]: FadeLoader,
  [LoaderIcon.Propagate]: PropagateLoader,
  [LoaderIcon.Pulse]: PulseLoader,
  [LoaderIcon.Scale]: ScaleLoader,
  [LoaderIcon.Sync]: SyncLoader,
};

const colorsMap: Record<LoaderColor, string> = {
  [LoaderColor.Primary]: "#8B949E",
  [LoaderColor.Secondary]: "#5865f2",
};

const sizesMap: Record<LoaderSize, number> = {
  [LoaderSize.Small]: 30,
  [LoaderSize.Medium]: 50,
  [LoaderSize.Large]: 70,
};

type LoaderProps = {
  label?: string;
  i18nKey?: string;
  direction?: LoaderDirection;
  size?: LoaderSize;
  color?: LoaderColor;
  icon?: LoaderIcon;
};

export const Loader = ({
  label = "Loading...",
  direction = LoaderDirection.Row,
  size = LoaderSize.Medium,
  color = LoaderColor.Primary,
  icon = LoaderIcon.Puff,
  i18nKey,
}: LoaderProps) => {
  const { t } = useTranslation();

  const LoaderComponent = loaderMap[icon] || PuffLoader;
  const loaderSize = sizesMap[size];
  const loaderColor = colorsMap[color];

  return (
    <div
      className={classNames(styles.loaderContainer, {
        [styles.column]: direction === LoaderDirection.Column,
      })}
    >
      <LoaderComponent
        size={loaderSize}
        color={loaderColor}
        speedMultiplier={0.75}
      />
      <span>{i18nKey ? t("waitingForPlayers") : label}</span>
    </div>
  );
};
