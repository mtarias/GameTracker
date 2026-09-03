import { ImageResponse } from "next/og";
import { writeFileSync } from "node:fs";

async function generate(size: number, filename: string) {
  const response = new ImageResponse(
    (
      <div
        style={{
          width: size,
          height: size,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#171717",
          fontFamily: "sans-serif",
        }}
      >
        <span
          style={{
            color: "#f5f5f5",
            fontSize: size * 0.42,
            fontWeight: 700,
          }}
        >
          GT
        </span>
      </div>
    ),
    { width: size, height: size },
  );

  const buffer = Buffer.from(await response.arrayBuffer());
  writeFileSync(`public/${filename}`, buffer);
  console.log(`Generated public/${filename}`);
}

async function main() {
  await generate(192, "icon-192.png");
  await generate(512, "icon-512.png");
}

main();
