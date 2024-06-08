import { memo, ReactNode } from "react";
import { DefaultValues, FormProvider, useForm } from "react-hook-form";
import { AnyObject, Maybe, ObjectSchema } from "yup";
import classNames from "classnames";

import { yupResolver } from "@hookform/resolvers/yup";
import styles from "./Form.module.scss";

interface FormProps<T extends Maybe<AnyObject>> {
  onSubmit: (data: T) => void;
  defaultValues?: DefaultValues<T>;
  validation?: ObjectSchema<T>;
  className?: string;
  children: ReactNode;
}

export const Form = <T extends Record<string, any>>({
  children,
  validation,
  onSubmit,
  defaultValues,
  className,
}: FormProps<T>) => {
  const methods = useForm({
    defaultValues,
    // @ts-expect-error
    resolver: validation ? yupResolver(validation) : undefined,
  });

  return (
    <FormProvider {...methods}>
      <form
        onSubmit={methods.handleSubmit(onSubmit)}
        className={classNames(styles.form, className)}
      >
        {children}
      </form>
    </FormProvider>
  );
};
