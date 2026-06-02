import { LucideIcon } from "lucide-react";
import { ButtonHTMLAttributes, forwardRef } from "react";

type IconButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  icon: LucideIcon;
  label: string;
  text?: string;
  variant?: "ghost" | "primary" | "danger";
};

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(function IconButton(
  { icon: Icon, label, text, variant = "ghost", className = "", ...props },
  ref,
) {
  return (
    <button
      {...props}
      ref={ref}
      type={props.type ?? "button"}
      className={`icon-button icon-button--${variant} ${className}`.trim()}
      aria-label={label}
    >
      <Icon aria-hidden="true" size={18} strokeWidth={1.9} />
      {text ? <span>{text}</span> : null}
    </button>
  );
});
