export const LogoMark = ({ size = 36 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 64 64"
    fill="none"
    aria-hidden="true"
    data-testid="sai-logo-mark"
  >
    <path d="M14 50 H50" stroke="#C8A97E" strokeWidth="3" strokeLinecap="square" />
    <rect x="19" y="26" width="5" height="24" fill="#C8A97E" />
    <rect x="29.5" y="14" width="5" height="36" fill="#F4F4F6" />
    <rect x="40" y="34" width="5" height="16" fill="#B85B35" />
  </svg>
);

export default LogoMark;
