import { ITEM_BY_ID, type Category } from "@/lib/game-catalog";

export type Equipped = Partial<Record<Category, string>>;

const art = (eq: Equipped, cat: Category) => {
  const id = eq[cat];
  const item = id ? ITEM_BY_ID[id] : undefined;
  return item?.art;
};

/* ---------------- かみがた ---------------- */

function Hair({ shape, color, front }: { shape: string; color: string; front: boolean }) {
  if (front) {
    switch (shape) {
      case "nobangs":
        return <path d="M62 62 Q100 30 138 62 Q120 50 100 50 Q80 50 62 62Z" fill={color} />;
      case "veryshort":
        return <path d="M64 66 Q100 40 136 66 Q100 54 64 66Z" fill={color} />;
      case "spiky":
        return (
          <path
            d="M62 66 L74 44 L84 62 L94 40 L104 62 L114 42 L126 62 L138 66 Q100 50 62 66Z"
            fill={color}
          />
        );
      case "curly":
        return (
          <g fill={color}>
            <circle cx="72" cy="58" r="12" />
            <circle cx="90" cy="50" r="13" />
            <circle cx="110" cy="50" r="13" />
            <circle cx="128" cy="58" r="12" />
          </g>
        );
      case "sporty":
        return <path d="M64 64 Q100 38 136 64 Q118 56 100 58 Q82 56 64 64Z" fill={color} />;
      default:
        return <path d="M60 68 Q100 30 140 68 Q124 46 100 46 Q76 46 60 68Z" fill={color} />;
    }
  }
  switch (shape) {
    case "bob":
      return <path d="M58 60 Q100 26 142 60 L142 104 Q126 92 122 60 L78 60 Q74 92 58 104Z" fill={color} />;
    case "medium":
      return <path d="M56 62 Q100 24 144 62 L144 124 Q128 108 124 62 L76 62 Q72 108 56 124Z" fill={color} />;
    case "long":
    case "straight":
      return <path d="M56 62 Q100 22 144 62 L146 168 L126 168 Q124 90 122 62 L78 62 Q76 90 74 168 L54 168Z" fill={color} />;
    case "fluffy":
      return (
        <g fill={color}>
          <path d="M54 66 Q100 20 146 66 L150 158 Q128 176 124 66 L76 66 Q72 176 50 158Z" />
          <circle cx="52" cy="150" r="16" />
          <circle cx="148" cy="150" r="16" />
        </g>
      );
    case "ponytail":
      return (
        <g fill={color}>
          <path d="M58 62 Q100 26 142 62 L142 96 Q126 88 122 62 L78 62 Q74 88 58 96Z" />
          <path d="M140 70 Q170 92 158 148 Q146 152 144 120 Q142 92 132 82Z" />
        </g>
      );
    case "twin":
      return (
        <g fill={color}>
          <path d="M58 62 Q100 26 142 62 L142 96 Q126 88 122 62 L78 62 Q74 88 58 96Z" />
          <ellipse cx="46" cy="118" rx="14" ry="30" />
          <ellipse cx="154" cy="118" rx="14" ry="30" />
        </g>
      );
    case "bun":
      return (
        <g fill={color}>
          <circle cx="100" cy="26" r="18" />
          <path d="M58 62 Q100 26 142 62 L142 96 Q126 88 122 62 L78 62 Q74 88 58 96Z" />
        </g>
      );
    case "unique":
      return (
        <g fill={color}>
          <path d="M58 62 Q100 22 142 62 L142 100 Q126 90 122 62 L78 62 Q74 90 58 100Z" />
          <path d="M100 18 L112 44 L88 44Z" />
        </g>
      );
    default:
      return <path d="M58 62 Q100 26 142 62 L142 96 Q126 88 122 62 L78 62 Q74 88 58 96Z" fill={color} />;
  }
}

/* ---------------- かお ---------------- */

function Eyes({ kind }: { kind: string }) {
  const l = 84;
  const r = 116;
  const y = 88;
  switch (kind) {
    case "happy":
      return (
        <g stroke="#1f2937" strokeWidth="3.5" fill="none" strokeLinecap="round">
          <path d={`M${l - 8} ${y + 2} q8 -9 16 0`} />
          <path d={`M${r - 8} ${y + 2} q8 -9 16 0`} />
        </g>
      );
    case "dot":
      return (
        <g fill="#1f2937">
          <circle cx={l} cy={y} r="3.5" />
          <circle cx={r} cy={y} r="3.5" />
        </g>
      );
    case "cool":
      return (
        <g fill="#1f2937">
          <rect x={l - 8} y={y - 3} width="16" height="6" rx="3" />
          <rect x={r - 8} y={y - 3} width="16" height="6" rx="3" />
        </g>
      );
    case "wink":
      return (
        <g stroke="#1f2937" strokeWidth="3.5" fill="#1f2937" strokeLinecap="round">
          <circle cx={l} cy={y} r="5.5" stroke="none" />
          <path d={`M${r - 8} ${y + 2} q8 -9 16 0`} fill="none" />
        </g>
      );
    case "star":
      return (
        <g fill="#f59e0b">
          <path d={`M${l} ${y - 8} l3 6 6 1 -4.5 4.5 1 6 -5.5 -3 -5.5 3 1 -6 -4.5 -4.5 6 -1Z`} />
          <path d={`M${r} ${y - 8} l3 6 6 1 -4.5 4.5 1 6 -5.5 -3 -5.5 3 1 -6 -4.5 -4.5 6 -1Z`} />
        </g>
      );
    case "sparkle":
      return (
        <g>
          <circle cx={l} cy={y} r="7" fill="#1f2937" />
          <circle cx={r} cy={y} r="7" fill="#1f2937" />
          <circle cx={l + 2.5} cy={y - 2.5} r="2.4" fill="#fff" />
          <circle cx={r + 2.5} cy={y - 2.5} r="2.4" fill="#fff" />
        </g>
      );
    case "sleepy":
      return (
        <g stroke="#1f2937" strokeWidth="3.5" strokeLinecap="round">
          <path d={`M${l - 8} ${y} h16`} />
          <path d={`M${r - 8} ${y} h16`} />
        </g>
      );
    case "big":
      return (
        <g>
          <ellipse cx={l} cy={y} rx="8" ry="9" fill="#1f2937" />
          <ellipse cx={r} cy={y} rx="8" ry="9" fill="#1f2937" />
          <circle cx={l + 3} cy={y - 3} r="2.6" fill="#fff" />
          <circle cx={r + 3} cy={y - 3} r="2.6" fill="#fff" />
        </g>
      );
    default:
      return (
        <g fill="#1f2937">
          <circle cx={l} cy={y} r="5.5" />
          <circle cx={r} cy={y} r="5.5" />
        </g>
      );
  }
}

function Mouth({ kind }: { kind: string }) {
  const y = 108;
  switch (kind) {
    case "open":
      return <ellipse cx="100" cy={y + 2} rx="8" ry="7" fill="#be123c" />;
    case "small":
      return <circle cx="100" cy={y} r="3" fill="#be123c" />;
    case "grin":
      return <path d={`M88 ${y - 2} q12 14 24 0 q-12 6 -24 0Z`} fill="#be123c" />;
    case "cat":
      return (
        <path d={`M92 ${y} q4 5 8 0 q4 5 8 0`} stroke="#be123c" strokeWidth="3" fill="none" strokeLinecap="round" />
      );
    case "flat":
      return <path d={`M92 ${y} h16`} stroke="#9f1239" strokeWidth="3" strokeLinecap="round" />;
    default:
      return <path d={`M91 ${y - 3} q9 10 18 0`} stroke="#be123c" strokeWidth="3" fill="none" strokeLinecap="round" />;
  }
}

/* ---------------- 服のかざり ---------------- */

function Deco({ deco, x = 100, y = 168 }: { deco?: string | undefined; x?: number; y?: number }) {
  if (!deco) return null;
  switch (deco) {
    case "heart":
      return <path d={`M${x} ${y + 6} l-9 -9 a6 6 0 0 1 9 -8 a6 6 0 0 1 9 8Z`} fill="#fff" opacity="0.9" />;
    case "star":
      return (
        <path
          d={`M${x} ${y - 10} l4 9 9 1 -7 6 2 9 -8 -5 -8 5 2 -9 -7 -6 9 -1Z`}
          fill="#fff"
          opacity="0.9"
        />
      );
    case "flower":
      return (
        <g fill="#fff" opacity="0.9">
          {[0, 72, 144, 216, 288].map((a) => (
            <ellipse key={a} cx={x} cy={y - 8} rx="4" ry="7" transform={`rotate(${a} ${x} ${y})`} />
          ))}
        </g>
      );
    case "paw":
      return (
        <g fill="#fff" opacity="0.9">
          <circle cx={x} cy={y + 2} r="6" />
          <circle cx={x - 7} cy={y - 6} r="3" />
          <circle cx={x} cy={y - 9} r="3" />
          <circle cx={x + 7} cy={y - 6} r="3" />
        </g>
      );
    case "dino":
      return (
        <g fill="#fff" opacity="0.9">
          <ellipse cx={x} cy={y} rx="11" ry="8" />
          <path d={`M${x - 12} ${y - 6} l6 -8 4 8Z`} />
        </g>
      );
    case "frog":
      return (
        <g fill="#fff" opacity="0.9">
          <circle cx={x} cy={y} r="9" />
          <circle cx={x - 5} cy={y - 8} r="4" />
          <circle cx={x + 5} cy={y - 8} r="4" />
        </g>
      );
    case "cat":
      return (
        <g fill="#fff" opacity="0.9">
          <circle cx={x} cy={y} r="9" />
          <path d={`M${x - 9} ${y - 6} l-1 -8 7 4Z`} />
          <path d={`M${x + 9} ${y - 6} l1 -8 -7 4Z`} />
        </g>
      );
    case "food":
      return (
        <g fill="#fff" opacity="0.9">
          <path d={`M${x - 10} ${y + 4} h20 l-10 -14Z`} />
        </g>
      );
    case "ghost":
      return (
        <g fill="#93c5fd" opacity="0.9">
          <path d={`M${x - 9} ${y + 6} v-10 a9 9 0 0 1 18 0 v10 l-4.5 -4 -4.5 4 -4.5 -4Z`} />
        </g>
      );
    case "line":
      return <rect x={x - 22} y={y - 2} width="44" height="4" rx="2" fill="#fff" opacity="0.85" />;
    case "ribbon":
      return (
        <g fill="#fff" opacity="0.95">
          <path d={`M${x - 12} ${y - 4} l10 6 -10 6Z`} />
          <path d={`M${x + 12} ${y - 4} l-10 6 10 6Z`} />
          <circle cx={x} cy={y + 2} r="3.5" />
        </g>
      );
    case "frill":
      return (
        <g fill="#fff" opacity="0.85">
          {[-18, -6, 6, 18].map((d) => (
            <circle key={d} cx={x + d} cy={y + 24} r="6" />
          ))}
        </g>
      );
    case "check":
      return (
        <g stroke="#fff" strokeWidth="2" opacity="0.7">
          <path d={`M${x - 16} ${y} h32 M${x - 16} ${y + 10} h32 M${x - 8} ${y - 8} v28 M${x + 8} ${y - 8} v28`} />
        </g>
      );
    case "pleat":
      return (
        <g stroke="#0f172a" strokeWidth="1.5" opacity="0.25">
          <path d={`M${x - 14} ${y - 8} v28 M${x} ${y - 8} v28 M${x + 14} ${y - 8} v28`} />
        </g>
      );
    default:
      return null;
  }
}

/* ---------------- 本体 ---------------- */

export function AvatarView({ equipped, size = 220 }: { equipped: Equipped; size?: number }) {
  const skin = art(equipped, "skin")?.["color"] ?? "#f7d9c4";
  const hairColor = art(equipped, "hairColor")?.["color"] ?? "#1f2430";
  const hair = art(equipped, "hair")?.["shape"];
  const face = art(equipped, "face");
  const tops = art(equipped, "tops");
  const bottoms = art(equipped, "bottoms");
  const shoes = art(equipped, "shoes");
  const hat = art(equipped, "hat");
  const glasses = art(equipped, "glasses");
  const mask = art(equipped, "mask");
  const acc = art(equipped, "accessory");
  const hold = art(equipped, "hold");

  const topShape = tops?.["shape"] ?? "tee";
  const suit = topShape === "suit";

  return (
    <svg viewBox="0 0 200 300" width={size} height={(size * 300) / 200} role="img" aria-label="アバター">
      {/* 足 */}
      <g fill={skin}>
        <rect x="84" y="216" width="12" height="42" rx="6" />
        <rect x="104" y="216" width="12" height="42" rx="6" />
      </g>
      {/* ボトムス */}
      {!suit && bottoms && (
        <g>
          {bottoms["shape"] === "skirt" ? (
            <path d="M74 198 L126 198 L136 240 L64 240Z" fill={bottoms["color"]} />
          ) : (
            <g fill={bottoms["color"]}>
              <rect x="76" y="196" width="22" height={bottoms["shape"] === "shorts" ? 32 : 56} rx="8" />
              <rect x="102" y="196" width="22" height={bottoms["shape"] === "shorts" ? 32 : 56} rx="8" />
            </g>
          )}
          <Deco deco={bottoms["deco"]} x={100} y={216} />
        </g>
      )}
      {/* くつ */}
      {shoes && (
        <g fill={shoes["color"]} stroke="#0f172a" strokeOpacity="0.15">
          {shoes["shape"] === "boots" ? (
            <>
              <rect x="76" y="234" width="24" height="30" rx="8" />
              <rect x="100" y="234" width="24" height="30" rx="8" />
            </>
          ) : (
            <>
              <rect x="74" y="252" width="26" height="14" rx="7" />
              <rect x="100" y="252" width="26" height="14" rx="7" />
            </>
          )}
          <Deco deco={shoes["deco"]} x={100} y={252} />
        </g>
      )}
      {/* からだ・トップス */}
      {tops ? (
        <g>
          <path
            d={
              suit
                ? "M68 152 Q100 140 132 152 L138 246 L62 246Z"
                : "M68 152 Q100 140 132 152 L136 206 L64 206Z"
            }
            fill={tops["color"]}
            stroke="#0f172a"
            strokeOpacity="0.12"
          />
          {(topShape === "hoodie" || topShape === "coat") && (
            <path d="M80 150 q20 22 40 0 q-20 10 -40 0Z" fill="#0f172a" opacity="0.15" />
          )}
          {topShape === "polo" && <path d="M92 150 l8 12 8 -12Z" fill="#0f172a" opacity="0.2" />}
          <Deco deco={tops["deco"]} x={100} y={176} />
        </g>
      ) : (
        <path d="M68 152 Q100 140 132 152 L136 206 L64 206Z" fill={skin} />
      )}
      {/* うで */}
      <g fill={tops ? tops["color"] : skin}>
        <rect x="52" y="152" width="18" height="52" rx="9" />
        <rect x="130" y="152" width="18" height="52" rx="9" />
      </g>
      <g fill={skin}>
        <circle cx="61" cy="208" r="9" />
        <circle cx="139" cy="208" r="9" />
      </g>
      {/* くび */}
      <rect x="92" y="132" width="16" height="18" rx="8" fill={skin} />
      {/* アクセサリー（くび） */}
      {acc && ["scarf", "necklace"].includes(acc["shape"] ?? "") && (
        <g>
          {acc["shape"] === "scarf" ? (
            <rect x="80" y="136" width="40" height="14" rx="7" fill={acc["color"]} />
          ) : (
            <g stroke={acc["color"]} strokeWidth="3" fill="none">
              <path d="M86 142 q14 14 28 0" />
              <circle cx="100" cy="152" r="4" fill={acc["color"]} />
            </g>
          )}
        </g>
      )}
      {/* かみ（うしろ） */}
      {hair && <Hair shape={hair} color={hairColor} front={false} />}
      {/* あたま */}
      <circle cx="100" cy="90" r="42" fill={skin} />
      {/* かみ（まえ） */}
      {hair && <Hair shape={hair} color={hairColor} front={true} />}
      {/* かお */}
      <Eyes kind={face?.["eye"] ?? "round"} />
      <Mouth kind={face?.["mouth"] ?? "smile"} />
      <g fill="#fda4af" opacity="0.5">
        <circle cx="74" cy="100" r="6" />
        <circle cx="126" cy="100" r="6" />
      </g>
      {/* メガネ */}
      {glasses && (
        <g stroke={glasses["color"]} strokeWidth="3" fill="none">
          {glasses["shape"] === "sun" ? (
            <g fill={glasses["color"]}>
              <rect x="72" y="82" width="22" height="14" rx="5" />
              <rect x="106" y="82" width="22" height="14" rx="5" />
              <path d="M94 88 h12" />
            </g>
          ) : glasses["shape"] === "starglass" ? (
            <g fill={glasses["color"]} stroke="none">
              <path d="M84 78 l4 9 9 1 -7 6 2 9 -8 -5 -8 5 2 -9 -7 -6 9 -1Z" />
              <path d="M116 78 l4 9 9 1 -7 6 2 9 -8 -5 -8 5 2 -9 -7 -6 9 -1Z" />
            </g>
          ) : (
            <g>
              <circle cx="84" cy="88" r="11" />
              <circle cx="116" cy="88" r="11" />
              <path d="M95 88 h10" />
            </g>
          )}
        </g>
      )}
      {/* マスク */}
      {mask && (
        <g>
          <path d="M76 100 q24 24 48 0 l2 14 q-26 18 -52 0Z" fill={mask["color"]} stroke="#94a3b8" />
        </g>
      )}
      {/* イヤーマフ */}
      {acc?.["shape"] === "earmuff" && (
        <g fill={acc["color"]}>
          <circle cx="58" cy="88" r="10" />
          <circle cx="142" cy="88" r="10" />
          <path d="M60 62 q40 -22 80 0" stroke={acc["color"]} strokeWidth="5" fill="none" />
        </g>
      )}
      {acc?.["shape"] === "watch" && <rect x="52" y="196" width="18" height="7" rx="3" fill={acc["color"]} />}
      {acc && ["heart", "star", "flower"].includes(acc["shape"] ?? "") && (
        <Deco deco={acc["shape"]} x={132} y={150} />
      )}
      {/* ぼうし */}
      {hat && <Hat art={hat} />}
      {/* もちもの */}
      {hold && <Hold art={hold} />}
    </svg>
  );
}

function Hat({ art: a }: { art: Record<string, string> }) {
  const c = a["color"] ?? "#16a34a";
  switch (a["shape"]) {
    case "knit":
      return (
        <g fill={c}>
          <path d="M64 62 q36 -40 72 0 v8 h-72Z" />
          <rect x="60" y="62" width="80" height="12" rx="6" />
          <circle cx="100" cy="22" r="8" />
        </g>
      );
    case "straw":
      return (
        <g fill={c}>
          <ellipse cx="100" cy="66" rx="62" ry="12" />
          <path d="M72 64 q28 -36 56 0Z" />
        </g>
      );
    case "bucket":
      return (
        <g fill={c}>
          <path d="M70 60 q30 -30 60 0 v10 h-60Z" />
          <ellipse cx="100" cy="70" rx="46" ry="10" />
        </g>
      );
    case "beret":
      return (
        <g fill={c}>
          <ellipse cx="100" cy="52" rx="40" ry="20" />
          <circle cx="126" cy="34" r="6" />
        </g>
      );
    case "ribbon":
      return (
        <g fill={c}>
          <path d="M74 50 l16 10 -16 10Z" />
          <path d="M106 50 l-16 10 16 10Z" />
          <circle cx="90" cy="60" r="5" />
        </g>
      );
    case "band":
      return <path d="M62 74 q38 -46 76 0" stroke={c} strokeWidth="7" fill="none" />;
    case "crown":
      return (
        <g fill={c}>
          <path d="M66 56 l10 -26 12 18 12 -24 12 24 12 -18 10 26Z" />
          <rect x="66" y="56" width="68" height="10" rx="4" />
        </g>
      );
    case "cat":
      return (
        <g fill={c}>
          <path d="M64 60 l2 -30 26 16Z" />
          <path d="M136 60 l-2 -30 -26 16Z" />
        </g>
      );
    case "rabbit":
      return (
        <g fill={c}>
          <ellipse cx="80" cy="26" rx="9" ry="26" />
          <ellipse cx="120" cy="26" rx="9" ry="26" />
        </g>
      );
    case "dino":
      return (
        <g fill={c}>
          <path d="M66 62 q34 -36 68 0Z" />
          <path d="M84 32 l8 -12 6 12Z M100 26 l8 -12 6 12Z" />
        </g>
      );
    case "headphone":
      return (
        <g fill={c}>
          <path d="M58 82 q42 -56 84 0" stroke={c} strokeWidth="7" fill="none" />
          <rect x="48" y="74" width="16" height="26" rx="7" />
          <rect x="136" y="74" width="16" height="26" rx="7" />
        </g>
      );
    case "santa":
      return (
        <g>
          <path d="M64 62 q36 -42 72 0Z" fill={c} />
          <rect x="60" y="60" width="80" height="12" rx="6" fill="#f8fafc" />
          <circle cx="140" cy="30" r="9" fill="#f8fafc" />
        </g>
      );
    case "oni":
      return (
        <g fill={c}>
          <path d="M74 52 l-4 -26 18 18Z" />
          <path d="M126 52 l4 -26 -18 18Z" />
        </g>
      );
    default:
      return (
        <g fill={c}>
          <path d="M66 62 q34 -38 68 0Z" />
          <path d="M126 60 q28 2 34 12 q-30 6 -34 -12Z" />
        </g>
      );
  }
}

function Hold({ art: a }: { art: Record<string, string> }) {
  const c = a["color"] ?? "#2563eb";
  switch (a["shape"]) {
    case "bag":
      return (
        <g fill={c}>
          <rect x="128" y="164" width="30" height="34" rx="7" />
          <path d="M132 164 q11 -14 22 0" stroke={c} strokeWidth="4" fill="none" />
        </g>
      );
    case "umbrella":
      return (
        <g>
          <path d="M144 190 q0 -30 24 -30 q24 0 24 30Z" fill={c} />
          <rect x="166" y="188" width="4" height="44" fill="#94a3b8" />
        </g>
      );
    case "bottle":
      return (
        <g fill={c}>
          <rect x="146" y="196" width="16" height="34" rx="6" />
          <rect x="150" y="188" width="8" height="8" rx="3" />
        </g>
      );
    case "plush":
      return (
        <g fill={c}>
          <circle cx="154" cy="206" r="14" />
          <circle cx="144" cy="192" r="6" />
          <circle cx="164" cy="192" r="6" />
        </g>
      );
    case "book":
      return <rect x="140" y="196" width="28" height="20" rx="3" fill={c} />;
    case "camera":
      return (
        <g fill={c}>
          <rect x="138" y="192" width="34" height="24" rx="5" />
          <circle cx="155" cy="204" r="7" fill="#e2e8f0" />
        </g>
      );
    case "magnifier":
      return (
        <g stroke={c} strokeWidth="4" fill="none">
          <circle cx="156" cy="198" r="12" />
          <path d="M164 208 l10 12" />
        </g>
      );
    case "net":
      return (
        <g stroke={c} strokeWidth="4" fill="none">
          <circle cx="166" cy="172" r="14" />
          <path d="M158 184 l-14 40" />
        </g>
      );
    case "fan":
      return (
        <g fill={c}>
          <circle cx="158" cy="196" r="14" />
          <rect x="155" y="208" width="6" height="22" rx="3" fill="#a16207" />
        </g>
      );
    default:
      return null;
  }
}

/* ---------------- ペット ---------------- */

export function PetView({
  petId,
  items,
  size = 130,
}: {
  petId?: string | undefined;
  items?: string[] | undefined;
  size?: number;
}) {
  const pet = petId ? ITEM_BY_ID[petId] : undefined;
  if (!pet) return null;
  const c = pet.art["color"] ?? "#d9a066";
  const kind = pet.art["kind"] ?? "dog";
  const equipped = (items ?? []).map((id) => ITEM_BY_ID[id]).filter(Boolean);
  const slot = (s: string) => equipped.find((i) => i!.art["slot"] === s);

  const ears = () => {
    switch (kind) {
      case "cat":
      case "fox":
        return (
          <g fill={c}>
            <path d="M42 44 l-2 -22 20 12Z" />
            <path d="M98 44 l2 -22 -20 12Z" />
          </g>
        );
      case "rabbit":
        return (
          <g fill={c}>
            <ellipse cx="55" cy="20" rx="7" ry="20" />
            <ellipse cx="85" cy="20" rx="7" ry="20" />
          </g>
        );
      case "bear":
      case "panda":
      case "hamster":
        return (
          <g fill={kind === "panda" ? "#1f2937" : c}>
            <circle cx="46" cy="36" r="12" />
            <circle cx="94" cy="36" r="12" />
          </g>
        );
      case "dino":
        return (
          <g fill="#15803d">
            <path d="M56 26 l8 -14 6 14Z" />
            <path d="M74 22 l8 -14 6 14Z" />
          </g>
        );
      case "dog":
        return (
          <g fill={c}>
            <ellipse cx="44" cy="52" rx="10" ry="18" />
            <ellipse cx="96" cy="52" rx="10" ry="18" />
          </g>
        );
      default:
        return null;
    }
  };

  return (
    <svg viewBox="0 0 140 140" width={size} height={size} role="img" aria-label={pet.name}>
      {ears()}
      <ellipse cx="70" cy="100" rx="34" ry="28" fill={c} />
      {slot("body") && <path d="M40 88 q30 -14 60 0 l-6 28 h-48Z" fill={slot("body")!.art["color"]} />}
      <circle cx="70" cy="58" r="34" fill={c} />
      {kind === "panda" && (
        <g fill="#1f2937">
          <ellipse cx="56" cy="56" rx="10" ry="12" />
          <ellipse cx="84" cy="56" rx="10" ry="12" />
        </g>
      )}
      {kind === "penguin" && <ellipse cx="70" cy="66" rx="20" ry="24" fill="#f8fafc" />}
      <g fill="#1f2937">
        <circle cx="58" cy="56" r="4.5" />
        <circle cx="82" cy="56" r="4.5" />
        <ellipse cx="70" cy="68" rx="6" ry="4.5" />
      </g>
      <path d="M62 74 q8 8 16 0" stroke="#1f2937" strokeWidth="2.5" fill="none" strokeLinecap="round" />
      {slot("face") && (
        <g stroke={slot("face")!.art["color"]} strokeWidth="2.5" fill="none">
          <circle cx="58" cy="56" r="9" />
          <circle cx="82" cy="56" r="9" />
          <path d="M67 56 h6" />
        </g>
      )}
      {slot("collar") && (
        <g>
          <rect x="48" y="84" width="44" height="9" rx="4.5" fill={slot("collar")!.art["color"]} />
          <circle cx="70" cy="95" r="5" fill="#fbbf24" />
        </g>
      )}
      {slot("hat") && (
        <g fill={slot("hat")!.art["color"]}>
          <path d="M48 30 q22 -24 44 0Z" />
          <rect x="44" y="28" width="52" height="8" rx="4" />
        </g>
      )}
    </svg>
  );
}

/* ---------------- マイルーム ---------------- */

export function RoomView({
  wallpaper,
  floor,
  furniture,
  equipped,
  petId,
  petItems,
}: {
  wallpaper?: string | undefined;
  floor?: string | undefined;
  furniture: string[];
  equipped: Equipped;
  petId?: string | undefined;
  petItems?: string[] | undefined;
}) {
  const wall = wallpaper ? ITEM_BY_ID[wallpaper] : undefined;
  const fl = floor ? ITEM_BY_ID[floor] : undefined;
  const fns = furniture.map((id) => ITEM_BY_ID[id]).filter(Boolean);

  return (
    <div className="relative overflow-hidden rounded-3xl border border-border">
      <div className="relative h-64 sm:h-80" style={{ background: wall?.art["color"] ?? "#f1f5f9" }}>
        {wall?.art["deco"] === "star" && (
          <div className="absolute inset-0 text-lg opacity-70">
            {["10%", "30%", "55%", "80%"].map((l, i) => (
              <span key={l} className="absolute" style={{ left: l, top: `${12 + i * 9}%` }}>
                ⭐
              </span>
            ))}
          </div>
        )}
        {/* かべのかぐ */}
        <div className="absolute left-0 right-0 top-3 flex justify-center gap-6 text-4xl">
          {fns
            .filter((f) => f!.subcategory === "wall")
            .map((f) => (
              <span key={f!.id} title={f!.name}>
                {f!.art["kind"] === "clock" ? "🕒" : f!.art["kind"] === "poster" ? "🖼️" : f!.art["kind"] === "light" ? "💡" : "🪟"}
              </span>
            ))}
        </div>
        {/* ゆか */}
        <div className="absolute bottom-0 left-0 right-0 h-24" style={{ background: fl?.art["color"] ?? "#d6b487" }} />
        {/* かぐ・アバター・ペット */}
        <div className="absolute bottom-2 left-0 right-0 flex items-end justify-center gap-1">
          <div className="flex items-end gap-1 text-4xl">
            {fns
              .filter((f) => f!.subcategory !== "wall")
              .slice(0, 3)
              .map((f) => (
                <span key={f!.id} title={f!.name}>
                  {FURNITURE_EMOJI[f!.art["kind"] ?? ""] ?? "📦"}
                </span>
              ))}
          </div>
          <AvatarView equipped={equipped} size={110} />
          <div className="flex items-end gap-1">
            <PetView petId={petId} items={petItems} size={80} />
            {fns
              .filter((f) => f!.subcategory !== "wall")
              .slice(3)
              .map((f) => (
                <span key={f!.id} className="text-4xl" title={f!.name}>
                  {FURNITURE_EMOJI[f!.art["kind"] ?? ""] ?? "📦"}
                </span>
              ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export const FURNITURE_EMOJI: Record<string, string> = {
  desk: "🪑",
  chair: "💺",
  bed: "🛏️",
  shelf: "🗄️",
  bookshelf: "📚",
  plush: "🧸",
  plant: "🪴",
  rug: "🟥",
  box: "📦",
  ball: "⚽",
  tree: "🎄",
  clock: "🕒",
  poster: "🖼️",
  window: "🪟",
  light: "💡",
};
