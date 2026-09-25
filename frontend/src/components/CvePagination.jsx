import { Button } from "@/components/ui/button";

function CvePagination({ page, pagination, onPrevious, onNext }) {
  if (!pagination) {
    return null;
  }

  return (
    <div className="flex items-center justify-between">
      <p className="text-sm text-muted-foreground">
        Página {pagination.page} de {pagination.totalPages}
      </p>

      <div className="flex gap-2">
        <Button variant="outline" disabled={page === 1} onClick={onPrevious}>
          Anterior
        </Button>

        <Button
          variant="outline"
          disabled={page === pagination.totalPages}
          onClick={onNext}
        >
          Siguiente
        </Button>
      </div>
    </div>
  );
}

export default CvePagination;
