export function HeroBackground() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 z-0 overflow-hidden"
    >
      {/* Base gradient field — rich dark purple with midnight base */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 140% 105% at 50% 32%, #32105a 0%, #220842 30%, #15042c 58%, #0b0219 82%, #04010b 100%)",
        }}
      />

      {/* Top blue-violet corner glow */}
      <div
        className="absolute inset-x-0 top-0 h-[35%]"
        style={{
          background:
            "linear-gradient(to bottom, rgba(45, 40, 100, 0.4) 0%, rgba(35, 20, 80, 0.15) 60%, transparent 100%)",
        }}
      />

      {/* Distinct bright sky-blue / white top spotlight shining down over navbar */}
      <div
        className="absolute left-1/2 top-[-12%] h-[48%] w-[75%] -translate-x-1/2"
        style={{
          background:
            "radial-gradient(ellipse at 50% 0%, rgba(195, 230, 255, 0.65) 0%, rgba(135, 175, 255, 0.3) 22%, rgba(90, 50, 180, 0.12) 48%, transparent 75%)",
        }}
      />

      {/* Rich vibrant violet-purple core behind headline text */}
     



      {/* Luminous purple glow supporting the 3D artwork in lower viewport */}
      <div
        className="absolute left-1/2 bottom-[-8%] h-[60%] w-[120%] -translate-x-1/2"
        style={{
          background:
            "radial-gradient(ellipse at 50% 75%, rgba(95, 38, 180, 0.65) 0%, rgba(55, 18, 115, 0.4) 42%, transparent 75%)",
        }}
      />

      {/* Soft edge falloff */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 90% 82% at 50% 45%, transparent 40%, rgba(5, 1, 14, 0.65) 100%)",
        }}
      />
    </div>
  );
}
