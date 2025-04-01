import { AxiosError } from "axios";
import { UseFormSetError } from "react-hook-form/dist/types/form";

import { IFormBEError } from "../api/apiTypes.ts";

export const addErrorFromBEToForm = <V extends Record<string, any>>(
  error: unknown,
  setError: UseFormSetError<V>,
) => {
  const errorResponse = (error as AxiosError)?.response?.data as IFormBEError;

  if (!errorResponse) return;

  const { message, field } = errorResponse;

  // @ts-ignore
  setError(field ?? "root", { message });
};
