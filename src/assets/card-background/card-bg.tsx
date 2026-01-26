export const CardBg = () => {
  return (
    <div
      className="absolute inset-0 z-0 w-full h-full pointer-events-none opacity-[0.4]"
      style={{
        backgroundImage: `
          linear-gradient(to right, #d1d5db 1px, transparent 1px),
          linear-gradient(to bottom, #d1d5db 1px, transparent 1px)
        `,
        backgroundSize: "24px 24px",
        WebkitMaskImage:
          "radial-gradient(ellipse 80% 80% at 100% 100%, #000 50%, transparent 100%)",
        maskImage:
          "radial-gradient(ellipse 80% 80% at 100% 100%, #000 50%, transparent 100%)",
      }}
    />
  );
};

export const OrnamentCard = () => {
  return <div className="absolute inset-0 z-0 w-2 h-24 bg-primary" />;
};
