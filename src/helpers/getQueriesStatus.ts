// @ts-ignore
import { QueriesResults } from "@tanstack/react-query/build/legacy/useQueries";

export const getQueriesStatus = (data: QueriesResults<never>[]) => {
  const isLoading = data.some((query) => query.isLoading);
  const withError = data.some((query) => query.isError);
  const isSuccess = data.every((query) => query.isSuccess);
  const isErrored = data.every((query) => query.isError);

  return {
    isLoading,
    withError,
    isSuccess,
    isErrored,
  };
};
