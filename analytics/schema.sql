CREATE TABLE IF NOT EXISTS analytics_daily (
  day TEXT NOT NULL,
  event TEXT NOT NULL,
  page TEXT NOT NULL,
  detail TEXT NOT NULL DEFAULT '',
  count INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (day, event, page, detail)
) WITHOUT ROWID;
