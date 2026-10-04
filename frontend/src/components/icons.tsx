import type { SVGProps } from "react";

/* Single Lucide-style outline set. Stroke = currentColor, 1.8px, round caps.
   Add an icon only when it communicates something new. */

function base(props: SVGProps<SVGSVGElement>, children: React.ReactNode) {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      {children}
    </svg>
  );
}

export const IconHome = (p: SVGProps<SVGSVGElement>) =>
  base(p, (<><path d="M4 11l8-7 8 7" /><path d="M6 9.5V20h12V9.5" /></>));

export const IconBook = (p: SVGProps<SVGSVGElement>) =>
  base(p, (<><path d="M12 6.5C10 4.8 7.4 4.3 4.5 5v13.5c2.9-.7 5.5-.2 7.5 1.5 2-1.7 4.6-2.2 7.5-1.5V5c-2.9-.7-5.5-.2-7.5 1.5Z" /><path d="M12 6.5V20" /></>));

export const IconChat = (p: SVGProps<SVGSVGElement>) =>
  base(p, (<><path d="M4 6.5A3.5 3.5 0 0 1 7.5 3h9A3.5 3.5 0 0 1 20 6.5v6a3.5 3.5 0 0 1-3.5 3.5H9l-5 4V6.5Z" /></>));

export const IconDoc = (p: SVGProps<SVGSVGElement>) =>
  base(p, (<><path d="M6 3h8l4 4v14H6V3Z" /><path d="M14 3v4h4" /><path d="M9 12h6M9 16h6" /></>));

export const IconQuiz = (p: SVGProps<SVGSVGElement>) =>
  base(p, (<><rect x="4" y="4" width="16" height="16" rx="3" /><path d="M8.5 12.5l2.5 2.5 4.5-5.5" /></>));

export const IconCards = (p: SVGProps<SVGSVGElement>) =>
  base(p, (<><rect x="7" y="7" width="13" height="13" rx="3" /><path d="M4 15V6a2 2 0 0 1 2-2h9" /></>));

export const IconPlan = (p: SVGProps<SVGSVGElement>) =>
  base(p, (<><rect x="4" y="5" width="16" height="15" rx="3" /><path d="M4 10h16M8.5 3v4M15.5 3v4" /></>));

export const IconGear = (p: SVGProps<SVGSVGElement>) =>
  base(
    p,
    (<>
      <circle cx="12" cy="12" r="3.2" />
      <path d="M12 2.8v2.6M12 18.6v2.6M4.2 7.2l2.3 1.3M17.5 15.5l2.3 1.3M4.2 16.8l2.3-1.3M17.5 8.5l2.3-1.3M2.8 12h2.6M18.6 12h2.6" />
    </>),
  );

export const IconUpload = (p: SVGProps<SVGSVGElement>) =>
  base(p, (<><path d="M12 15V4m0 0L7.5 8.5M12 4l4.5 4.5" /><path d="M4 15v4a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-4" /></>));

export const IconFile = (p: SVGProps<SVGSVGElement>) =>
  base(p, (<><path d="M6 3h8l4 4v14H6V3Z" /><path d="M14 3v4h4" /></>));

export const IconSend = (p: SVGProps<SVGSVGElement>) =>
  base(p, (<><path d="M20 4L10.5 13.5" /><path d="M20 4l-6.5 16-3-6.5L4 10.5 20 4Z" /></>));

export const IconSearch = (p: SVGProps<SVGSVGElement>) =>
  base(p, (<><circle cx="11" cy="11" r="7" /><path d="M20 20l-3.8-3.8" /></>));

export const IconCheck = (p: SVGProps<SVGSVGElement>) => base(p, <path d="M5 12.5l4.5 4.5L19 7.5" />);

export const IconClock = (p: SVGProps<SVGSVGElement>) =>
  base(p, (<><circle cx="12" cy="12" r="8.5" /><path d="M12 7.5V12l3 2" /></>));

export const IconArrow = (p: SVGProps<SVGSVGElement>) => base(p, <path d="M4 12h15m0 0l-6-6m6 6l-6 6" />);

export const IconMenu = (p: SVGProps<SVGSVGElement>) => base(p, <path d="M4 7h16M4 12h16M4 17h16" />);
