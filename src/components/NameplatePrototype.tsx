/** Static laboratory artwork only; never connected to catalog or equipment. */
export function NameplatePrototype({ name }: { name: string }) {
  return (
    <div className="prototype-plate" role="img" aria-label={`${name}の試作プレート`}>
      <div className="prototype-plate__rim prototype-plate__rim--top" aria-hidden="true"><i className="prototype-plate__reflection" /></div>
      <div className="prototype-plate__rim prototype-plate__rim--bottom" aria-hidden="true"><i className="prototype-plate__reflection" /></div>
      <span className="prototype-plate__glow" aria-hidden="true" />
      {["left", "right"].map((side) => (
        <span key={side} className={`prototype-plate__crystal prototype-plate__crystal--${side}`} aria-hidden="true">
          <svg viewBox="0 0 48 64" focusable="false">
            <path className="prototype-crystal__shell" d="M24 4 42 18 42 46 24 60 6 46 6 18Z" />
            <path className="prototype-crystal__facet" d="M24 4 30 22 42 18 24 60 18 42 6 46Z" />
            <path className="prototype-crystal__core" d="M24 15 33 26 33 38 24 49 15 38 15 26Z" />
          </svg>
          <span className="prototype-plate__spark" />
        </span>
      ))}
      <span className="prototype-plate__name">{name}</span>
    </div>
  );
}