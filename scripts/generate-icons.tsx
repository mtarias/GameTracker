import { ImageResponse } from "next/og";
import { writeFileSync } from "node:fs";

async function generate(size: number, filename: string, maskable: boolean) {
  // El "safe zone" de Android para iconos maskable es ~66% del lienzo centrado.
  const contentScale = maskable ? 0.66 : 0.82;
  const fontSize = size * contentScale * 0.4;

  const response = new ImageResponse(
    (
      <div
        style={{
          width: size,
          height: size,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#0a0a0a",
          fontFamily: "sans-serif",
        }}
      >
        <div
          style={{
            width: size * contentScale,
            height: size * contentScale,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            borderRadius: size * 0.18,
            background: "linear-gradient(135deg, #22d3ee, #a855f7)",
          }}
        >
          <span
            style={{
              color: "#0a0a0a",
              fontSize,
              fontWeight: 800,
              letterSpacing: -2,
            }}
          >
            GT
          </span>
        </div>
      </div>
    ),
    { width: size, height: size },
  );

  const buffer = Buffer.from(await response.arrayBuffer());
  writeFileSync(`public/${filename}`, buffer);
  console.log(`Generated public/${filename}`);
}

async function main() {
  await generate(192, "icon-192.png", false);
  await generate(512, "icon-512.png", false);
  await generate(192, "icon-192-maskable.png", true);
  await generate(512, "icon-512-maskable.png", true);
}

main();
