const cron = require("node-cron");

const cveService = require("../services/cveService");
const cveRepository = require("../repositories/cveRepository");

const {
  runExclusiveSync,
  SyncInProgressError,
} = require("../services/syncCoordinator");

const CHUNK_DAYS = 7;
const REVIEW_DAYS = 2;

const formatDate = (date) => {
  return date.toISOString().slice(0, 10);
};

const addDays = (dateString, days) => {
  const date = new Date(`${dateString}T00:00:00.000Z`);

  date.setUTCDate(date.getUTCDate() + days);

  return formatDate(date);
};

const getYesterday = () => {
  const today = new Date();

  today.setUTCDate(today.getUTCDate() - 1);

  return formatDate(today);
};

const splitRangeIntoChunks = (from, to) => {
  const ranges = [];

  let currentStart = from;

  while (currentStart <= to) {
    const proposedEnd = addDays(currentStart, CHUNK_DAYS - 1);

    const currentEnd = proposedEnd > to ? to : proposedEnd;

    ranges.push({
      from: currentStart,
      to: currentEnd,
    });

    currentStart = addDays(currentEnd, 1);
  }

  return ranges;
};

const getSyncStartDate = async (endDate) => {
  const syncRanges = await cveRepository.getSyncRanges();

  const synchronizedDates = syncRanges
    .map((range) => {
      if (typeof range.end_date !== "string") {
        throw new Error(
          "Las fechas de sincronización deben recibirse como cadenas YYYY-MM-DD",
        );
      }

      return range.end_date.slice(0, 10);
    })
    .filter((date) => date <= endDate)
    .sort();

  if (synchronizedDates.length === 0) {
    return endDate;
  }

  const lastSynchronizedDate = synchronizedDates[synchronizedDates.length - 1];

  return addDays(lastSynchronizedDate, -REVIEW_DAYS);
};

const synchronizePendingCves = async (source) => {
  try {
    await runExclusiveSync(async () => {
      const to = getYesterday();

      const from = await getSyncStartDate(to);

      console.log(`[${source}] Comprobando sincronización: ${from} → ${to}`);

      const ranges = splitRangeIntoChunks(from, to);

      let totalPublished = 0;
      let totalModified = 0;

      for (const range of ranges) {
        console.log(`[${source}] Procesando: ${range.from} → ${range.to}`);

        // Actualizar vulnerabilidades modificadas.
        const modifiedResult = await cveService.syncModifiedCves(
          range.from,
          range.to,
        );

        totalModified += modifiedResult.synchronized;

        // Recuperar vulnerabilidades publicadas.
        // El servicio omite los periodos ya sincronizados.
        const publishedResult = await cveService.syncCves(range.from, range.to);

        totalPublished += publishedResult.synchronized;

        console.log(
          `[${source}] Periodo completado: ${range.from} → ${range.to}`,
        );
      }

      console.log(`[${source}] Sincronización completada`);

      console.log(`[${source}] CVEs publicados procesados: ${totalPublished}`);

      console.log(`[${source}] CVEs modificados procesados: ${totalModified}`);
    });
  } catch (error) {
    if (error instanceof SyncInProgressError) {
      console.log(
        `[${source}] Sincronización omitida: ya existe otra en curso`,
      );

      return;
    }

    console.error(`[${source}] Error durante la sincronización:`, error);
  }
};

const startDailySync = () => {
  cron.schedule("0 2 * * *", () => synchronizePendingCves("Diaria"), {
    timezone: "Atlantic/Canary",
    noOverlap: true,
  });

  console.log("Sincronización automática diaria configurada: 02:00 (Canarias)");

  // Recuperar periodos pendientes al iniciar el backend.
  void synchronizePendingCves("Inicio del backend");
};

module.exports = {
  startDailySync,
};
