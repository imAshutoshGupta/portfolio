import { ImageResponse } from "next/og";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const title = searchParams.get("title") ?? "ASHUTOSH GUPTA";
  const subtitle = searchParams.get("subtitle") ?? "Full-Stack Engineer";

  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "#08070f",
          padding: "72px",
          backgroundImage:
            "radial-gradient(600px 500px at 12% -10%, rgba(157,139,255,0.35), transparent 60%), radial-gradient(560px 480px at 95% 5%, rgba(103,182,255,0.28), transparent 60%)",
        }}
      >
        <div style={{ display: "flex", fontFamily: "monospace", fontSize: 24, color: "#9b97ad" }}>
          ashutosh<span style={{ color: "#9d8bff" }}>@</span>gupta<span style={{ color: "#9d8bff" }}>:~$</span>
        </div>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div
            style={{
              display: "flex",
              fontSize: 128,
              fontWeight: 700,
              letterSpacing: "-4px",
              color: "#f1eff8",
              lineHeight: 1,
            }}
          >
            {title}
            <span style={{ color: "#9d8bff" }}>*</span>
          </div>
          <div style={{ display: "flex", marginTop: 24, fontSize: 40, color: "#9d8bff" }}>
            {subtitle}
          </div>
        </div>
        <div style={{ display: "flex", fontFamily: "monospace", fontSize: 22, color: "#5d5872" }}>
          Next.js · NestJS · React · Node · AWS
        </div>
      </div>
    ),
    { width: 1200, height: 630 }
  );
}
