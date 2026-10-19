import { useRef } from "react";
import { CalendarDays } from "lucide-react";

import { Input } from "@/components/ui/input";
import { isValidDate } from "@/utils/dateUtils";

function CveDateField({
  id,
  label,
  text,
  date,
  onTextChange,
  onCalendarChange,
}) {
  const calendarRef = useRef(null);

  const openCalendar = () => {
    calendarRef.current?.showPicker?.();
  };

  return (
    <div className="min-w-0">
      <label htmlFor={id} className="mb-1 block text-sm text-muted-foreground">
        {label}
      </label>

      <div className="relative">
        <Input
          id={id}
          type="text"
          placeholder="DD/MM/AAAA"
          value={text}
          onChange={(e) => onTextChange(e.target.value)}
          maxLength={10}
          inputMode="numeric"
          className="pr-10"
        />

        <button
          type="button"
          aria-label={`Abrir calendario ${label.toLowerCase()}`}
          onClick={openCalendar}
          className="absolute inset-y-0 right-0 flex w-10 items-center justify-center text-muted-foreground hover:text-foreground"
        >
          <CalendarDays className="h-4 w-4" />
        </button>

        <input
          ref={calendarRef}
          type="date"
          tabIndex={-1}
          aria-label={`Seleccionar fecha ${label.toLowerCase()}`}
          value={isValidDate(date) ? date : ""}
          onChange={(e) => onCalendarChange(e.target.value)}
          className="pointer-events-none absolute right-0 bottom-0 h-px w-px opacity-0"
        />
      </div>
    </div>
  );
}

export default CveDateField;
