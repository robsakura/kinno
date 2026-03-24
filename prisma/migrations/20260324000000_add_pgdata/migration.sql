CREATE TABLE "PGData" (
    "imdbId"       TEXT NOT NULL,
    "sexNudity"    INTEGER NOT NULL,
    "violenceGore" INTEGER NOT NULL,
    "profanity"    INTEGER NOT NULL,
    "alcoholDrugs" INTEGER NOT NULL,
    "frightening"  INTEGER NOT NULL,
    CONSTRAINT "PGData_pkey" PRIMARY KEY ("imdbId")
);
