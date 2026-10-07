export type ActionError = {
  fieldErrors: Record<string, string[]>;
  message: string;
  status: number;
};

export type ActionResult<T> =
  { success: true; data: T } | { success: false; error: ActionError };

export type ServerActionProps<T> = {
  [K in keyof T]: T[K] extends (...args: infer Args) => Promise<infer Data>
    ? (...args: Args) => Promise<ActionResult<Data>>
    : T[K] extends object
      ? ServerActionProps<T[K]>
      : T[K];
};
