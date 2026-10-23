function CveReferences({ references }) {
  return (
    <section className="space-y-2">
      <h3 className="font-semibold">Referencias externas</h3>

      {references?.length > 0 ? (
        <ul className="space-y-2">
          {references.map((reference, index) => (
            <li key={index} className="break-all">
              <a
                href={reference.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary underline"
              >
                {reference.url}
              </a>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-muted-foreground">
          No hay referencias disponibles.
        </p>
      )}
    </section>
  );
}

export default CveReferences;
