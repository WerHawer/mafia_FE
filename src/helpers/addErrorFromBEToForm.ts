import { AxiosError } from "axios";
import { IFormBEError } from "../api/apiTypes.ts";
import { UseFormSetError } from "react-hook-form/dist/types/form";

export const addErrorFromBEToForm = <V extends Record<string, any>>(
  error: unknown,
  formErrorSet: UseFormSetError<V>,
) => {
  const errorResponse = (error as AxiosError)?.response?.data as IFormBEError;

  if (!errorResponse) return;

  const { message, field } = errorResponse;

  // @ts-ignore
  formErrorSet(field ?? "root", { message });
};
