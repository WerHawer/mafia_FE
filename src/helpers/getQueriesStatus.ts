export const getQueriesStatus = (data: any[]) => {
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
