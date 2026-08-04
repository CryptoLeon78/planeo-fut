import { Languages } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLanguage, type AppLanguage } from "@/lib/i18n";

const options: Array<{ value: AppLanguage; short: string; label: string }> = [
  { value: "es-ES", short: "ES", label: "Español (España)" },
  { value: "en-GB", short: "EN", label: "English (United Kingdom)" },
];

export function LanguageSwitcher() {
  const { language, setLanguage } = useLanguage();
  return (
    <div className="flex items-center gap-1" role="group" aria-label="Idioma de la aplicación">
      <Languages className="mr-1 h-3.5 w-3.5 text-muted-foreground" aria-hidden />
      {options.map((option) => (
        <Button
          key={option.value}
          type="button"
          size="sm"
          variant={language === option.value ? "secondary" : "ghost"}
          className="h-7 min-w-9 px-2 text-xs"
          aria-pressed={language === option.value}
          aria-label={option.label}
          title={option.label}
          onClick={() => setLanguage(option.value)}
        >
          {option.short}
        </Button>
      ))}
    </div>
  );
}