import { observer } from "mobx-react-lite";

import city from "@/assets/images/bg/city.avif";
import city_1 from "@/assets/images/bg/city_1.avif";
import city_2 from "@/assets/images/bg/city_2.jpg";
import dark_3 from "@/assets/images/bg/dark_3.jpg";
import dark from "@/assets/images/bg/dark.jpg";
import dark_1 from "@/assets/images/bg/dark_1.jpg";
import dark_2 from "@/assets/images/bg/dark_2.jpg";
import forest from "@/assets/images/bg/Forest.jpg";
import forest_1 from "@/assets/images/bg/Forest_1.jpg";
import lights from "@/assets/images/bg/lights.jpg";
import natural_c from "@/assets/images/bg/natural_c.jpg";
import office from "@/assets/images/bg/office.png";
import office_1 from "@/assets/images/bg/office_1.jpg";
import office_2 from "@/assets/images/bg/office_2.jpg";
import office_3 from "@/assets/images/bg/office_3.avif";
import office_4 from "@/assets/images/bg/office_4.webp";
import office_5 from "@/assets/images/bg/office_5.jpg";
import office_a from "@/assets/images/bg/Office_a.jpg";
import office_b from "@/assets/images/bg/office_b.webp";
import space_b from "@/assets/images/bg/space_b.jpg";
import space_c from "@/assets/images/bg/space_c.jpg";
import starWars from "@/assets/images/bg/starWars.jpg";
import wall from "@/assets/images/bg/wall.webp";
import styles from "@/components/VideoConfig/VideoConfig.module.scss";
import { rootStore } from "@/store/rootStore.ts";

export const BackgroundImageList = observer(
  ({ onImageClick }: { onImageClick: (url: string) => void }) => {
    const { streamsStore, usersStore } = rootStore;
    const { myId } = usersStore;

    const myBackgroundImages = myId
      ? streamsStore.getUserBackgroundImages(myId)
      : [];

    const images: string[] = [
      city,
      city_1,
      city_2,
      dark_3,
      dark,
      dark_1,
      dark_2,
      forest,
      forest_1,
      lights,
      natural_c,
      office,
      office_1,
      office_2,
      office_3,
      office_4,
      office_5,
      office_a,
      office_b,
      space_b,
      space_c,
      starWars,
      wall,
      ...myBackgroundImages,
    ];

    return (
      <div className={styles.imageContainer}>
        {images
          .sort((a, b) => a.localeCompare(b, "en"))
          .map((src) => (
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
  }
);
