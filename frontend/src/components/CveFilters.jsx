import { useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CalendarDays } from "lucide-react";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Convierte YYYY-MM-DD a DD/MM/AAAA
const formatDate = (value) => {
  if (!value) return "";

  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return value;
  }

  const [year, month, day] = value.split("-");
  return `${day}/${month}/${year}`;
};

// Convierte DD/MM/AAAA a YYYY-MM-DD
const parseDate = (value) => {
  if (!/^\d{2}\/\d{2}\/\d{4}$/.test(value)) {
    return null;
  }

  const [day, month, year] = value.split("/");
  return `${year}-${month}-${day}`;
};

const isValidCalendarDate = (value) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }

  const date = new Date(`${value}T00:00:00.000Z`);

  return (
    !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value
  );
};

function CveFilters({
  search,
  product,
  severity,
  from,
  to,
  onSearchChange,
  onProductChange,
  onSeverityChange,
  onFromChange,
  onToChange,
  onSearch,
  onClear,
}) {
  const [fromText, setFromText] = useState(formatDate(from));
  const [toText, setToText] = useState(formatDate(to));

  const fromCalendarRef = useRef(null);
  const toCalendarRef = useRef(null);

  const handleFromTextChange = (value) => {
    setFromText(value);
    onFromChange(parseDate(value) ?? value);
  };

  const handleToTextChange = (value) => {
    setToText(value);
    onToChange(parseDate(value) ?? value);
  };

  const handleFromCalendarChange = (value) => {
    setFromText(formatDate(value));
    onFromChange(value);
  };

  const handleToCalendarChange = (value) => {
    setToText(formatDate(value));
    onToChange(value);
  };

  const handleClear = () => {
    setFromText("");
    setToText("");
    onClear();
  };

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-[1fr_auto_1fr]">
        <Input
          placeholder="Buscar por CVE ID"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
        />

        <Select value={severity || "ALL"} onValueChange={onSeverityChange}>
          <SelectTrigger className="w-full sm:w-36">
            <SelectValue>
              {severity === ""
                ? "Todas"
                : severity === "CRITICAL"
                  ? "Crítica"
                  : severity === "HIGH"
                    ? "Alta"
                    : severity === "MEDIUM"
                      ? "Media"
                      : severity === "LOW"
                        ? "Baja"
                        : "Todas"}
            </SelectValue>
          </SelectTrigger>

          <SelectContent>
            <SelectItem value="ALL">Todas</SelectItem>
            <SelectItem value="CRITICAL">Crítica</SelectItem>
            <SelectItem value="HIGH">Alta</SelectItem>
            <SelectItem value="MEDIUM">Media</SelectItem>
            <SelectItem value="LOW">Baja</SelectItem>
          </SelectContent>
        </Select>

        <Input
          placeholder="Buscar por producto"
          value={product}
          onChange={(e) => onProductChange(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-2 items-end gap-2 sm:grid-cols-[1fr_1fr_auto_auto]">
        {/* Fecha Desde */}
        <div className="min-w-0">
          <label
            htmlFor="from-date"
            className="mb-1 block text-sm text-muted-foreground"
          >
            Desde
          </label>

          <div className="relative">
            <Input
              id="from-date"
              type="text"
              placeholder="DD/MM/AAAA"
              value={fromText}
              onChange={(e) => handleFromTextChange(e.target.value)}
              maxLength={10}
              inputMode="numeric"
              className="pr-10"
            />

            <button
              type="button"
              aria-label="Abrir calendario desde"
              onClick={() => fromCalendarRef.current?.showPicker()}
              className="absolute inset-y-0 right-0 flex w-10 items-center justify-center text-muted-foreground hover:text-foreground"
            >
              <CalendarDays className="h-4 w-4" />
            </button>

            <input
              ref={fromCalendarRef}
              type="date"
              tabIndex={-1}
              aria-label="Seleccionar fecha desde"
              value={isValidCalendarDate(from) ? from : ""}
              onChange={(e) => handleFromCalendarChange(e.target.value)}
              className="pointer-events-none absolute right-0 bottom-0 h-px w-px opacity-0"
            />
          </div>
        </div>

        {/* Fecha Hasta */}
        <div className="min-w-0">
          <label
            htmlFor="to-date"
            className="mb-1 block text-sm text-muted-foreground"
          >
            Hasta
          </label>

          <div className="relative">
            <Input
              id="to-date"
              type="text"
              placeholder="DD/MM/AAAA"
              value={toText}
              onChange={(e) => handleToTextChange(e.target.value)}
              maxLength={10}
              inputMode="numeric"
              className="pr-10"
            />

            <button
              type="button"
              aria-label="Abrir calendario hasta"
              onClick={() => toCalendarRef.current?.showPicker()}
              className="absolute inset-y-0 right-0 flex w-10 items-center justify-center text-muted-foreground hover:text-foreground"
            >
              <CalendarDays className="h-4 w-4" />
            </button>

            <input
              ref={toCalendarRef}
              type="date"
              tabIndex={-1}
              aria-label="Seleccionar fecha hasta"
              value={isValidCalendarDate(to) ? to : ""}
              onChange={(e) => handleToCalendarChange(e.target.value)}
              className="pointer-events-none absolute right-0 bottom-0 h-px w-px opacity-0"
            />
          </div>
        </div>

        <Button onClick={onSearch}>Buscar</Button>

        <Button variant="outline" onClick={handleClear}>
          Limpiar
        </Button>
      </div>
    </div>
  );
}

export default CveFilters;
