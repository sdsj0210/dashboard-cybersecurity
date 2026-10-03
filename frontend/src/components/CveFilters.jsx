import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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
        <div className="flex-1">
          <label
            htmlFor="from-date"
            className="mb-1 block text-sm text-muted-foreground"
          >
            Desde
          </label>

          <Input
            id="from-date"
            type="date"
            value={from}
            onChange={(e) => onFromChange(e.target.value)}
          />
        </div>

        <div className="flex-1">
          <label
            htmlFor="to-date"
            className="mb-1 block text-sm text-muted-foreground"
          >
            Hasta
          </label>

          <Input
            id="to-date"
            type="date"
            value={to}
            onChange={(e) => onToChange(e.target.value)}
          />
        </div>

        <Button onClick={onSearch}>Buscar</Button>

        <Button variant="outline" onClick={onClear}>
          Limpiar
        </Button>
      </div>
    </div>
  );
}

export default CveFilters;
