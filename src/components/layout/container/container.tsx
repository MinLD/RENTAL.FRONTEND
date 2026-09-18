import type { ComponentPropsWithoutRef } from "react";

export type ContainerProps = ComponentPropsWithoutRef<"div">;


const baseClassName = "mx-auto w-full max-w-7xl px-4 md:px-6 lg:px-8";

export function Container({
  children,
  className,
  ...props
}: ContainerProps) {
  const classes = className ? `${baseClassName} ${className}` : baseClassName;

  return (
    <div className={classes} {...props}>
      {children}
    </div>
  );
}
