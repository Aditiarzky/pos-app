// React Imports
import type { SVGAttributes } from "react";

const SwishUnderline = (props: SVGAttributes<SVGElement>) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 300 60"
      width="300"
      height="60"
      {...props}
    >
      <path
        d="M 10,45 C 30,20 50,55 80,35 C 110,15 130,50 160,30 C 185,14 210,45 240,38 C 260,33 275,40 290,36"
        fill="none"
        stroke="currentColor"
        strokeWidth="3.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};

export default SwishUnderline;
