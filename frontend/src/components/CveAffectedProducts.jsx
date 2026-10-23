function CveAffectedProducts({ products }) {
  return (
    <section className="space-y-2">
      <h3 className="font-semibold">Productos afectados</h3>

      {products?.length > 0 ? (
        products.map((product) => (
          <div
            key={product.id}
            className="min-w-0 rounded-lg border bg-card p-4"
          >
            <p>Proveedor: {product.vendor ?? "N/D"}</p>
            <p>Producto: {product.product ?? "N/D"}</p>
            <p>Paquete: {product.package_name ?? "N/D"}</p>

            {product.versions?.length > 0 && (
              <div className="mt-2">
                <p className="font-medium">Versiones afectadas</p>

                {product.versions.map((version, index) => (
                  <p key={index} className="break-all">
                    {version.version ?? "N/D"}
                    {version.less_than && ` - anterior a ${version.less_than}`}
                    {version.less_than_or_equal &&
                      ` - hasta ${version.less_than_or_equal}`}
                  </p>
                ))}
              </div>
            )}
          </div>
        ))
      ) : (
        <p className="text-sm text-muted-foreground">
          No hay productos disponibles.
        </p>
      )}
    </section>
  );
}

export default CveAffectedProducts;
