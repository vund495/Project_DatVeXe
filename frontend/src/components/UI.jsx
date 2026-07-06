import React from 'react';

export function Stat({ value, label }) {
  return <div className="stat"><b>{value}</b><span>{label}</span></div>;
}

export function Field({ label, children }) {
  return <label className="field"><span>{label}</span>{children}</label>;
}

export function SectionTitle({ label, title, accent }) {
  return (
    <div className="section-title">
      {label && <div className="section-eyebrow">{label}</div>}
      <h2>{title} <span>{accent}</span></h2>
    </div>
  );
}

export function Metric({ icon, value, label }) {
  return <div className="metric"><span>{icon}</span><b>{value}</b><small>{label}</small><i /></div>;
}
