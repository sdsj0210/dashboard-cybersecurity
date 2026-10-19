import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import CveDateField from "@/components/CveDateField";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { formatDate, parseDate } from "@/utils/dateUtils";

const severityLabels = {
  CRITICAL: "Crítica",
  HIGH: "Alta",
  MEDIUM: "Media",
  LOW: "Baja",
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
            <SelectValue>{severityLabels[severity] || "Todas"}</SelectValue>
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
        <CveDateField
          id="from-date"
          label="Desde"
          text={fromText}
          date={from}
          onTextChange={handleFromTextChange}
          onCalendarChange={handleFromCalendarChange}
        />

        <CveDateField
          id="to-date"
          label="Hasta"
          text={toText}
          date={to}
          onTextChange={handleToTextChange}
          onCalendarChange={handleToCalendarChange}
        />

        <Button onClick={onSearch}>Buscar</Button>

        <Button variant="outline" onClick={handleClear}>
          Limpiar
        </Button>
      </div>
    </div>
  );
}

export default CveFilters;
