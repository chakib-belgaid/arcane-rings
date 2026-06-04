import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement>;

function IconBase({ children, ...props }: IconProps) {
  return (
    <svg aria-hidden="true" focusable="false" viewBox="0 0 24 24" {...props}>
      {children}
    </svg>
  );
}

export function UndoIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M9 8H4V3" />
      <path d="M4 8c2.1-3 5.8-4.3 9.3-3.1 4.2 1.5 6.5 6 5 10.2-1.4 4.1-5.8 6.3-10 5" />
    </IconBase>
  );
}

export function HintIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M9 18h6" />
      <path d="M10 22h4" />
      <path d="M8.5 14.5c-1.4-1.1-2.2-2.8-2.2-4.6a5.7 5.7 0 1 1 11.4 0c0 1.8-.8 3.5-2.2 4.6-.8.7-1.2 1.4-1.3 2.5h-4.4c-.1-1.1-.5-1.8-1.3-2.5Z" />
      <path d="M12 2v1.8" />
      <path d="m4.6 5.2 1.3 1.3" />
      <path d="m19.4 5.2-1.3 1.3" />
    </IconBase>
  );
}

export function MapIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <circle cx="6" cy="6" r="2.4" />
      <circle cx="18" cy="7" r="2.4" />
      <circle cx="12" cy="18" r="2.4" />
      <path d="M8.2 6.2 15.8 7" />
      <path d="m17 9-4 7" />
      <path d="m10.6 16.6-3.1-8.4" />
    </IconBase>
  );
}

export function ImageIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <rect x="4" y="5" width="16" height="14" rx="2" />
      <circle cx="9" cy="10" r="1.8" />
      <path d="m5.5 17 4.8-4.8 3.1 3.1 2-2L19 17" />
    </IconBase>
  );
}

export function CalendarIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <rect x="4" y="5" width="16" height="15" rx="2" />
      <path d="M8 3v4" />
      <path d="M16 3v4" />
      <path d="M4 10h16" />
      <path d="M8 14h2" />
      <path d="M14 14h2" />
    </IconBase>
  );
}

export function BookIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M5 5.5c2.6-.8 4.8-.5 7 1.1v13c-2.2-1.6-4.4-1.9-7-1.1v-13Z" />
      <path d="M19 5.5c-2.6-.8-4.8-.5-7 1.1v13c2.2-1.6 4.4-1.9 7-1.1v-13Z" />
    </IconBase>
  );
}

export function CollectionIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M7 4h10v16H7z" />
      <path d="M4 7h3v10H4z" />
      <path d="M17 7h3v10h-3z" />
      <path d="M9.5 8h5" />
      <path d="M9.5 12h5" />
      <path d="M9.5 16h3" />
    </IconBase>
  );
}

export function SettingsIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M12 8.4a3.6 3.6 0 1 0 0 7.2 3.6 3.6 0 0 0 0-7.2Z" />
      <path d="m4.6 10 .9-2.1 2.1.2 1.2-1.2-.2-2.1 2.1-.9 1.4 1.6h1.8l1.4-1.6 2.1.9-.2 2.1 1.2 1.2 2.1-.2.9 2.1-1.6 1.4v1.8l1.6 1.4-.9 2.1-2.1-.2-1.2 1.2.2 2.1-2.1.9-1.4-1.6h-1.8l-1.4 1.6-2.1-.9.2-2.1-1.2-1.2-2.1.2-.9-2.1 1.6-1.4v-1.8L4.6 10Z" />
    </IconBase>
  );
}

export function CloseIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M6 6 18 18" />
      <path d="M18 6 6 18" />
    </IconBase>
  );
}

export function RestartIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M20 12a8 8 0 1 1-2.4-5.7" />
      <path d="M20 4v6h-6" />
    </IconBase>
  );
}

export function ChevronIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="m9 6 6 6-6 6" />
    </IconBase>
  );
}
