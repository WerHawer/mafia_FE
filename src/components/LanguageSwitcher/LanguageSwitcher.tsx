import classNames from "classnames";
import { Fragment, memo, useCallback } from "react";
import { useTranslation } from "react-i18next";

import styles from "./LanguageSwitcher.module.scss";

const languages = [
  { label: "En", code: "en" },
  { label: "Укр", code: "ua" },
];

export const LanguageSwitcher = memo(() => {
  const { i18n } = useTranslation();

  const handleLanguageChange = useCallback(
    (lang: string) => () => {
      i18n.changeLanguage(lang.toLowerCase());
    },
    [i18n],
  );

  return (
    <div className={styles.container}>
      {languages.map(({ label, code }, i) => (
        <Fragment key={code}>
          <button
            key={label}
            className={classNames(styles.button, {
              [styles.active]: i18n.language === code,
            })}
            onClick={handleLanguageChange(code)}
          >
            {code}
          </button>

          {i + 1 !== languages.length && (
            <span className={styles.separator}>|</span>
          )}
        </Fragment>
      ))}
    </div>
  );
});
