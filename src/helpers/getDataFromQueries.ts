// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const getDataFromQueries = (data: any[]) => {
  return data.reduce((acc, query) => {
    if (query.data) {
      acc.push(query.data.data);
    }

    return acc;
  }, []);
};
