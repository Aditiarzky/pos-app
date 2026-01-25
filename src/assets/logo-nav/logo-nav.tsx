import Image from "next/image";
import LogoIcon from "./gm-icon.png";
import { cn } from "@/lib/utils";

const LogoNav = ({
  height,
  type,
}: {
  height: number;
  type: "nav" | "sidebar";
}) => {
  return (
    <div className="flex font-instrument gap-2 transition-all duration-300">
      <Image
        src={LogoIcon}
        alt="Logo nav"
        width={height}
        height={height}
        className="dark:invert"
      />
      <div
        className={cn(
          "flex items-end gap-1 overflow-hidden",
          type === "nav" ? "hidden md:flex" : "",
        )}
      >
        <h1 className="text-xl font-instrument">Gunung Muria</h1>
        <i className="text-sm">Grosir</i>
      </div>
    </div>
  );
};

export default LogoNav;
