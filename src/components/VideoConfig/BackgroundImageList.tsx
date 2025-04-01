import { observer } from "mobx-react-lite";

import natural1 from "@/assets/images/bg/natural_a.jpeg";
import natural2 from "@/assets/images/bg/natural_b.jpg";
import natural3 from "@/assets/images/bg/natural_c.jpg";
import office1 from "@/assets/images/bg/Office_a.jpg";
import office2 from "@/assets/images/bg/office_b.webp";
import space1 from "@/assets/images/bg/space_a.jpg";
import space2 from "@/assets/images/bg/space_b.jpg";
import space3 from "@/assets/images/bg/space_c.jpg";
import space4 from "@/assets/images/bg/starWars.jpg";
import wall from "@/assets/images/bg/wall.webp";
import styles from "@/components/VideoConfig/VideoConfig.module.scss";
import { rootStore } from "@/store/rootStore.ts";

export const BackgroundImageList = observer(
  ({ onImageClick }: { onImageClick: (url: string) => void }) => {
    const { streamsStore } = rootStore;
    const { myBackgroundImages } = streamsStore;

    const images: string[] = [
      natural1,
      natural2,
      natural3,
      space1,
      space2,
      space3,
      space4,
      office1,
      office2,
      wall,
      ...myBackgroundImages,
    ];

    return (
      <div className={styles.imageContainer}>
        {images.map((src) => (
          <img
            key={src}
            className={styles.imagePreview}
            src={src}
            alt="background image"
            onClick={() => onImageClick(src)}
            width="40"
            height="40"
          />
        ))}
      </div>
    );
  },
);
