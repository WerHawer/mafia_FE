// @ts-ignore
import { QueriesResults } from "@tanstack/react-query/build/legacy/useQueries";

export const getDataFromQueries = (data: QueriesResults<never>[]) => {
  return data.reduce((acc, query) => {
    if (query.data) {
      acc.push(query.data.data);
    }

    return acc;
  }, []);
};
