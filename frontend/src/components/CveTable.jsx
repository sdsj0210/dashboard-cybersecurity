import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { Link } from "react-router-dom";

function CveTable({ cves }) {
  if (cves.length === 0) {
    return (
      <div className="rounded-lg border bg-card p-8 text-center text-sm text-muted-foreground">
        No se encontraron vulnerabilidades.
      </div>
    );
  }

  return (
    <>
      {/* Vista móvil: tarjetas CVE */}
      <div className="space-y-3 md:hidden">
        {cves.map((cve) => (
          <div
            key={cve.cve_id}
            className="min-w-0 space-y-3 rounded-lg border bg-card p-4"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <Link
                to={`/cves/${cve.cve_id}`}
                className="font-semibold text-primary hover:underline"
              >
                {cve.cve_id}
              </Link>

              <span className="rounded-md bg-muted px-2 py-1 text-xs">
                {cve.severity ?? "Sin severidad"}
              </span>
            </div>

            <p className="line-clamp-3 wrap-break-word text-sm">
              {cve.description_es ?? cve.description_en ?? "Sin descripción"}
            </p>

            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-muted-foreground">CVSS</p>
                <p className="font-medium">{cve.score ?? "N/D"}</p>
              </div>

              <div>
                <p className="text-muted-foreground">Publicado</p>
                <p className="font-medium">
                  {cve.published_at
                    ? new Date(cve.published_at).toLocaleDateString()
                    : "N/D"}
                </p>
              </div>
            </div>

            <div className="min-w-0 border-t pt-2 text-sm">
              <p className="text-muted-foreground">Producto afectado</p>
              <p className="break-all">{cve.products_summary ?? "N/D"}</p>
            </div>

            <Link
              to={`/cves/${cve.cve_id}`}
              className="inline-block text-sm font-medium text-primary hover:underline"
            >
              Ver detalle →
            </Link>
          </div>
        ))}
      </div>

      {/* Vista escritorio: tabla shadcn */}
      <div className="hidden w-full min-w-0 overflow-x-auto rounded-lg border bg-card md:block">
        <Table className="min-w-212.5">
          <TableHeader>
            <TableRow>
              <TableHead>CVE ID</TableHead>
              <TableHead>Descripción</TableHead>
              <TableHead>CVSS</TableHead>
              <TableHead>Severidad</TableHead>
              <TableHead>Publicación</TableHead>
              <TableHead>Producto</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {cves.map((cve) => (
              <TableRow key={cve.cve_id}>
                <TableCell className="font-medium">
                  <Link
                    to={`/cves/${cve.cve_id}`}
                    className="text-primary hover:underline"
                  >
                    {cve.cve_id}
                  </Link>
                </TableCell>

                <TableCell className="max-w-md truncate">
                  {cve.description_en ?? "Sin descripción"}
                </TableCell>

                <TableCell>{cve.score ?? "N/D"}</TableCell>

                <TableCell>{cve.severity ?? "Sin severidad"}</TableCell>

                <TableCell>
                  {cve.published_at
                    ? new Date(cve.published_at).toLocaleDateString()
                    : "N/D"}
                </TableCell>

                <TableCell className="max-w-xs truncate">
                  {cve.products_summary ?? "N/D"}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </>
  );
}

export default CveTable;
