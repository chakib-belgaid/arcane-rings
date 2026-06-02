import { X } from "lucide-react";
import { ReactNode, useEffect, useRef } from "react";

import { IconButton } from "./IconButton";

type ModalShellProps = {
  title: string;
  closeLabel: string;
  onClose: () => void;
  children: ReactNode;
  className?: string;
};

export function ModalShell({ title, closeLabel, onClose, children, className = "" }: ModalShellProps) {
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    closeRef.current?.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("keydown", onKeyDown);

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      previousFocus?.focus();
    };
  }, [onClose]);

  return (
    <div className="modal-backdrop">
      <section className={`modal-shell ${className}`.trim()} role="dialog" aria-modal="true" aria-label={title}>
        <header className="modal-shell__header">
          <h2>{title}</h2>
          <IconButton ref={closeRef} icon={X} label={closeLabel} onClick={onClose} />
        </header>
        {children}
      </section>
    </div>
  );
}
