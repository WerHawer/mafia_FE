import { AxiosError } from "axios";
import { IFormBEError } from "../api/apiTypes.ts";
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-expect-error
import { UseFormSetError } from "react-hook-form/dist/types/form";

export const addErrorFromBEToForm = (
  error: unknown,
  formErrorSet: UseFormSetError,
) => {
  const errorResponse = (error as AxiosError)?.response?.data as IFormBEError;

  if (!errorResponse) return;

  const { message, field } = errorResponse;

  formErrorSet(field ?? "root", { message });
};
