import { format } from "date-fns";
import { uk } from "date-fns/locale";

export const formatDate = (timestamp: number) => {
  return format(timestamp, "dd.MM.yy HH:mm", { locale: uk });
};
