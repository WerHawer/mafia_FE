import { useTranslation } from "react-i18next";

import annaCard from "@/assets/images/cards/anna.webp";
import cardBack from "@/assets/images/cards/card_back.webp";
import doctorCard from "@/assets/images/cards/doctor.webp";
import mafia1 from "@/assets/images/cards/mafia_1.webp";
import mafiaDon from "@/assets/images/cards/mafia_don.webp";
import prostituteCard from "@/assets/images/cards/prostitute.webp";
import sheriffCard from "@/assets/images/cards/sheriff.webp";
import { Typography } from "@/UI/Typography";

import styles from "./Rules.module.scss";

type RoleCardData = {
  image: string;
  nameKey: string;
  color: string;
  taglineKey: string;
  nightKey: string;
  goalKey: string;
  tipKey: string;
};

type FlowStep = {
  emoji: string;
  titleKey: string;
  textKey: string;
};

const ROLE_COLOR_MAFIA = "#ff4444";
const ROLE_COLOR_TOWN = "#58a6ff";
const ROLE_COLOR_SHERIFF = "#ffd700";
const ROLE_COLOR_DOCTOR = "#52c41a";
const ROLE_COLOR_PROSTITUTE = "#e91e8c";

const ROLES: RoleCardData[] = [
  {
    image: mafia1,
    nameKey: "roles.mafia",
    color: ROLE_COLOR_MAFIA,
    taglineKey: "rules.roles.mafia.tagline",
    nightKey: "rules.roles.mafia.night",
    goalKey: "rules.roles.mafia.goal",
    tipKey: "rules.roles.mafia.tip",
  },
  {
    image: mafiaDon,
    nameKey: "roles.don",
    color: ROLE_COLOR_MAFIA,
    taglineKey: "rules.roles.don.tagline",
    nightKey: "rules.roles.don.night",
    goalKey: "rules.roles.don.goal",
    tipKey: "rules.roles.don.tip",
  },
  {
    image: annaCard,
    nameKey: "roles.citizens",
    color: ROLE_COLOR_TOWN,
    taglineKey: "rules.roles.citizen.tagline",
    nightKey: "rules.roles.citizen.night",
    goalKey: "rules.roles.citizen.goal",
    tipKey: "rules.roles.citizen.tip",
  },
  {
    image: sheriffCard,
    nameKey: "roles.sheriff",
    color: ROLE_COLOR_SHERIFF,
    taglineKey: "rules.roles.sheriff.tagline",
    nightKey: "rules.roles.sheriff.night",
    goalKey: "rules.roles.sheriff.goal",
    tipKey: "rules.roles.sheriff.tip",
  },
  {
    image: doctorCard,
    nameKey: "roles.doctor",
    color: ROLE_COLOR_DOCTOR,
    taglineKey: "rules.roles.doctor.tagline",
    nightKey: "rules.roles.doctor.night",
    goalKey: "rules.roles.doctor.goal",
    tipKey: "rules.roles.doctor.tip",
  },
  {
    image: prostituteCard,
    nameKey: "roles.prostitute",
    color: ROLE_COLOR_PROSTITUTE,
    taglineKey: "rules.roles.prostitute.tagline",
    nightKey: "rules.roles.prostitute.night",
    goalKey: "rules.roles.prostitute.goal",
    tipKey: "rules.roles.prostitute.tip",
  },
];

const FLOW_STEPS: FlowStep[] = [
  { emoji: "🌙", titleKey: "rules.flow.step1.title", textKey: "rules.flow.step1.text" },
  { emoji: "☀️", titleKey: "rules.flow.step2.title", textKey: "rules.flow.step2.text" },
  { emoji: "🌙", titleKey: "rules.flow.step3.title", textKey: "rules.flow.step3.text" },
  { emoji: "🌅", titleKey: "rules.flow.step4.title", textKey: "rules.flow.step4.text" },
  { emoji: "🏆", titleKey: "rules.flow.step5.title", textKey: "rules.flow.step5.text" },
];

const TIPS_KEYS = [
  { emoji: "👁️", key: "rules.tips.1" },
  { emoji: "🤫", key: "rules.tips.2" },
  { emoji: "🗣️", key: "rules.tips.3" },
  { emoji: "🎯", key: "rules.tips.4" },
  { emoji: "🤝", key: "rules.tips.5" },
];

type RoleCardProps = {
  image: string;
  name: string;
  color: string;
  tagline: string;
  night: string;
  goal: string;
  tip: string;
};

const RuleRoleCard = ({ image, name, color, tagline, night, goal, tip }: RoleCardProps) => {
  const { t } = useTranslation();

  return (
    <div className={styles.roleCard}>
      <div className={styles.roleImageWrapper}>
        <img src={image} alt={name} className={styles.roleImage} />
        <span className={styles.roleNameBadge} style={{ color }}>
          {name}
        </span>
      </div>

      <div className={styles.roleContent}>
        <Typography variant="caption" className={styles.roleTagline}>
          {tagline}
        </Typography>

        <div className={styles.roleRow}>
          <span className={styles.roleLabel}>{t("rules.label.night")}</span>
          <Typography variant="caption" className={styles.roleText}>
            {night}
          </Typography>
        </div>

        <div className={styles.roleRow}>
          <span className={styles.roleLabel}>{t("rules.label.goal")}</span>
          <Typography variant="caption" className={styles.roleText}>
            {goal}
          </Typography>
        </div>

        <div className={styles.roleTip}>
          <span className={styles.roleTipEmoji}>💡</span>
          <Typography variant="caption" className={styles.roleTipText}>
            {tip}
          </Typography>
        </div>
      </div>
    </div>
  );
};

const Rules = () => {
  const { t } = useTranslation();

  return (
    <div className={styles.scrollWrapper}>
      <div className={styles.container}>
      <Typography variant="title" className={styles.pageTitle}>
        {t("rules.title")}
      </Typography>

      {/* About the Game */}
      <section className={styles.section}>
        <Typography variant="subtitle" className={styles.sectionTitle}>
          {t("rules.intro.title")}
        </Typography>

        <div className={styles.introBlock}>
          <img src={cardBack} alt="card" className={styles.introImage} />
          <Typography variant="body" className={styles.introText}>
            {t("rules.intro.text")}
          </Typography>
        </div>
      </section>

      {/* How to Play */}
      <section className={styles.section}>
        <Typography variant="subtitle" className={styles.sectionTitle}>
          {t("rules.flow.title")}
        </Typography>

        <ol className={styles.stepsList}>
          {FLOW_STEPS.map((step, index) => (
            <li key={step.titleKey} className={styles.step}>
              <span className={styles.stepEmoji}>{step.emoji}</span>
              <div className={styles.stepContent}>
                <Typography variant="h3" className={styles.stepTitle}>
                  {`${index + 1}. ${t(step.titleKey)}`}
                </Typography>
                <Typography variant="caption" className={styles.stepText}>
                  {t(step.textKey)}
                </Typography>
              </div>
            </li>
          ))}
        </ol>
      </section>

      {/* Roles */}
      <section className={styles.section}>
        <Typography variant="subtitle" className={styles.sectionTitle}>
          {t("rules.roles.title")}
        </Typography>

        <div className={styles.rolesGrid}>
          {ROLES.map((role) => (
            <RuleRoleCard
              key={role.nameKey}
              image={role.image}
              name={t(role.nameKey)}
              color={role.color}
              tagline={t(role.taglineKey)}
              night={t(role.nightKey)}
              goal={t(role.goalKey)}
              tip={t(role.tipKey)}
            />
          ))}
        </div>
      </section>

      {/* Tips */}
      <section className={styles.section}>
        <Typography variant="subtitle" className={styles.sectionTitle}>
          {t("rules.tips.title")}
        </Typography>

        <ul className={styles.tipsList}>
          {TIPS_KEYS.map(({ emoji, key }) => (
            <li key={key} className={styles.tip}>
              <span className={styles.tipEmoji}>{emoji}</span>
              <Typography variant="caption" className={styles.tipText}>
                {t(key)}
              </Typography>
            </li>
          ))}
        </ul>
      </section>
    </div>
  </div>
  );
};

export default Rules;



