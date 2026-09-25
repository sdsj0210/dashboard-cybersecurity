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
      <div className="flex gap-2">
        <Input
          placeholder="Buscar por CVE ID"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
        />

        <Select value={severity || "ALL"} onValueChange={onSeverityChange}>
          <SelectTrigger className="w-44">
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

      <div className="flex items-end gap-2">
        <div className="flex-1">
          <label className="mb-1 block text-sm text-muted-foreground">
            Desde
          </label>

          <Input
            type="date"
            value={from}
            onChange={(e) => onFromChange(e.target.value)}
          />
        </div>

        <div className="flex-1">
          <label className="mb-1 block text-sm text-muted-foreground">
            Hasta
          </label>

          <Input
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
