"use client";

import { useState } from "react";

interface PatternGroup {
  labelEs: string;
  n: number;
  avgGlucoseMgdl: number;
}

interface PatternDataRow {
  labelEs: string;
  detailEs: string;
  glucoseMgdl: number | null;
}

interface PatternResult {
  id: string;
  titleEs: string;
  emoji: string;
  available: boolean;
  insufficientMessageEs?: string;
  summaryEs?: string;
  groups?: PatternGroup[];
  dataRows?: PatternDataRow[];
}

export default function PatternCard({ pattern }: { pattern: PatternResult }) {
  const [showData, setShowData] = useState(false);

  const maxAvg = pattern.groups ? Math.max(...pattern.groups.map((g) => g.avgGlucoseMgdl)) : 0;

  return (
    <div className="card" style={{ marginBottom: "0.85rem" }}>
      <h3>
        {pattern.emoji} {pattern.titleEs}
      </h3>

      {!pattern.available ? (
        <p className="form-hint" style={{ margin: 0 }}>
          {pattern.insufficientMessageEs}
        </p>
      ) : (
        <>
          <p style={{ margin: "0 0 0.75rem", fontSize: "0.92rem" }}>{pattern.summaryEs}</p>

          {pattern.groups?.map((g) => (
            <div key={g.labelEs} className="stat-bar-row">
              <span className="stat-bar-label">{g.labelEs}</span>
              <div className="stat-bar-track">
                <div
                  className="stat-bar-fill"
                  style={{
                    width: `${maxAvg > 0 ? (g.avgGlucoseMgdl / maxAvg) * 100 : 0}%`,
                    background: "var(--color-primary)",
                  }}
                />
              </div>
              <span className="stat-bar-value">
                {g.avgGlucoseMgdl} <span style={{ fontWeight: 400 }}>({g.n})</span>
              </span>
            </div>
          ))}

          <button
            type="button"
            className="secondary-button"
            style={{ marginTop: "0.5rem", fontSize: "0.85rem" }}
            onClick={() => setShowData((s) => !s)}
          >
            {showData ? "Ocultar datos" : "Ver datos →"}
          </button>

          {showData && pattern.dataRows && (
            <ul className="card-details" style={{ marginTop: "0.6rem" }}>
              {pattern.dataRows.map((row, i) => (
                <li key={i}>
                  {row.labelEs} — {row.detailEs}
                  {row.glucoseMgdl != null && ` — ${row.glucoseMgdl} mg/dL`}
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </div>
  );
}