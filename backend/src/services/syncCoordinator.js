let syncInProgress = false;

class SyncInProgressError extends Error {
  constructor() {
    super("Ya hay una sincronización en curso");

    this.name = "SyncInProgressError";
    this.statusCode = 409;
  }
}

const runExclusiveSync = async (task) => {
  if (syncInProgress) {
    throw new SyncInProgressError();
  }

  syncInProgress = true;

  try {
    return await task();
  } finally {
    syncInProgress = false;
  }
};

const isSyncInProgress = () => {
  return syncInProgress;
};

module.exports = {
  runExclusiveSync,
  isSyncInProgress,
  SyncInProgressError,
};
