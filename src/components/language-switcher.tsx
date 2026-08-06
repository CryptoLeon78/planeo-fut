import { useRef } from "react";
import { Languages } from "lucide-react";
import { useLanguage, type AppLanguage } from "@/lib/i18n";
import { cn } from "@/lib/utils";

const options: Array<{ value: AppLanguage; short: string; label: string; announcement: string }> = [
  { value: "es-ES", short: "ES", label: "Español (España)", announcement: "Idioma cambiado a español de España" },
  { value: "en-GB", short: "EN", label: "English (United Kingdom)", announcement: "Language switched to British English" },
];

export function LanguageSwitcher() {
  const { language, setLanguage } = useLanguage();
  const refs = useRef<Array<HTMLButtonElement | null>>([]);
  const activeIndex = options.findIndex((option) => option.value === language);

  function focusOption(index: number) {
    const next = (index + options.length) % options.length;
    const option = options[next];
    if (!option) return;
    setLanguage(option.value);
    refs.current[next]?.focus();
  }

  return (
    <div
      role="radiogroup"
      aria-label="Idioma de la aplicación / Application language"
      className="flex items-center gap-1"
      onKeyDown={(event) => {
        if (event.key === "ArrowRight" || event.key === "ArrowDown") {
          event.preventDefault();
          focusOption(activeIndex + 1);
        }
        if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
          event.preventDefault();
          focusOption(activeIndex - 1);
        }
        if (event.key === "Home") {
          event.preventDefault();
          focusOption(0);
        }
        if (event.key === "End") {
          event.preventDefault();
          focusOption(options.length - 1);
        }
      }}
    >
      <Languages className="mr-1 h-3.5 w-3.5 text-muted-foreground" aria-hidden="true" />
      {options.map((option, index) => {
        const selected = language === option.value;
        return (
          <button
            key={option.value}
            ref={(node) => {
              refs.current[index] = node;
            }}
            type="button"
            role="radio"
            aria-checked={selected}
            aria-label={option.label}
            title={option.label}
            tabIndex={selected ? 0 : -1}
            onClick={() => setLanguage(option.value)}
            className={cn(
              "inline-flex h-8 min-w-11 items-center justify-center rounded-md px-2 text-xs font-medium transition-colors",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
              selected
                ? "bg-secondary text-secondary-foreground"
                : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
            )}
          >
            {option.short}
          </button>
        );
      })}
      <span className="sr-only" role="status" aria-live="polite">
        {options[activeIndex]?.announcement ?? ""}
      </span>
    </div>
  );
}
