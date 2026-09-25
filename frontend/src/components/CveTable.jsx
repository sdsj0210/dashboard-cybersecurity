import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

function CveTable({ cves }) {
  return (
    <div className="rounded-lg border bg-card">
      <Table>
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
              <TableCell className="font-medium">{cve.cve_id}</TableCell>

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
  );
}

export default CveTable;
