// ============================================================
// Inline SVG icon set — small, sharp, matched stroke weight.
// Usage: <Icon name="book" size={16} />
// ============================================================

const ICON_PATHS = {
  // navigation
  home: "M3 12 12 4l9 8M5 10v10h14V10",
  book: "M4 4h11a3 3 0 0 1 3 3v14H7a3 3 0 0 1-3-3V4Z M18 21V7",
  forum: "M4 5h16v10H7l-3 3V5Z M8 9h8 M8 12h5",
  user: "M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z M4 21c0-4.4 3.6-8 8-8s8 3.6 8 8",
  // actions
  back: "M15 18 9 12l6-6",
  forward: "M9 6l6 6-6 6",
  more: "M5 12h.01M12 12h.01M19 12h.01",
  search: "M11 19a8 8 0 1 1 0-16 8 8 0 0 1 0 16Z M21 21l-4.3-4.3",
  filter: "M3 5h18 M6 12h12 M10 19h4",
  close: "M6 6l12 12 M18 6 6 18",
  check: "M5 12l4 4L19 7",
  bookmark: "M6 4h12v17l-6-4-6 4V4Z",
  bookmarkFill: "M6 4h12v17l-6-4-6 4V4Z",
  star: "M12 4l2.6 5.3 5.9.9-4.3 4.1 1 5.9L12 17.4 6.8 20.2l1-5.9-4.3-4.1 5.9-.9L12 4Z",
  heart: "M12 21s-7-4.5-9-9.5C1.5 7 4.5 4 8 5c2 .5 3 2 4 3.5 1-1.5 2-3 4-3.5 3.5-1 6.5 2 5 6.5-2 5-9 9.5-9 9.5Z",
  // state / pro
  lock: "M6 11V8a6 6 0 0 1 12 0v3 M5 11h14v10H5z",
  sparkles: "M12 3l1.6 4.4L18 9l-4.4 1.6L12 15l-1.6-4.4L6 9l4.4-1.6L12 3Z M19 16l.8 2.2L22 19l-2.2.8L19 22l-.8-2.2L16 19l2.2-.8L19 16Z",
  zap: "M13 2 4 14h7l-1 8 9-12h-7l1-8Z",
  coin: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Z M12 7v10 M9 9.5c0-1.4 1.4-2.5 3-2.5s3 1.1 3 2.5-1.4 2.5-3 2.5-3 1.1-3 2.5S10.4 17 12 17s3-1.1 3-2.5",
  crown: "M3 17h18l-2-9-4 4-4-7-4 7-4-4-2 9Z M3 21h18",
  // ui
  chevronRight: "M9 6l6 6-6 6",
  chevronDown: "M6 9l6 6 6-6",
  chevronUp: "M6 15l6-6 6 6",
  chevronLeft: "M15 6l-6 6 6 6",
  plus: "M12 5v14 M5 12h14",
  edit: "M4 20h4l10-10-4-4L4 16v4Z M14 6l4 4",
  copy: "M9 9h11v11H9z M5 15V5h11",
  send: "M4 11 21 4l-7 17-3-7-7-3Z",
  upload: "M12 4v12 M6 10l6-6 6 6 M4 20h16",
  download: "M12 4v12 M6 14l6 6 6-6 M4 20h16",
  // content
  graph: "M4 20V8 M10 20v-8 M16 20V4 M22 20H2",
  brain: "M9 4a3 3 0 0 0-3 3v1a3 3 0 0 0-2 5 3 3 0 0 0 2 5v1a3 3 0 0 0 6 0V4a3 3 0 0 0-3 0Z M15 4a3 3 0 0 1 3 3v1a3 3 0 0 1 2 5 3 3 0 0 1-2 5v1a3 3 0 0 1-6 0",
  flame: "M12 2c4 5 5 8 5 11a5 5 0 1 1-10 0c0-2 1-3 2-5 1 1 2 1 3 0-1-3 0-4 0-6Z",
  bell: "M6 8a6 6 0 1 1 12 0c0 7 3 8 3 8H3s3-1 3-8Z M10 21a2 2 0 0 0 4 0",
  settings: "M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8Z M19 12a7 7 0 0 0-.1-1.2l2-1.5-2-3.4-2.4.8a7 7 0 0 0-2.1-1.2L14 3h-4l-.4 2.5a7 7 0 0 0-2.1 1.2L5.1 5.9l-2 3.4 2 1.5A7 7 0 0 0 5 12c0 .4 0 .8.1 1.2l-2 1.5 2 3.4 2.4-.8a7 7 0 0 0 2.1 1.2L10 21h4l.4-2.5a7 7 0 0 0 2.1-1.2l2.4.8 2-3.4-2-1.5c.1-.4.1-.8.1-1.2Z",
  pageRef: "M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9l-6-6Z M14 3v6h6 M9 14h6 M9 17h4",
  link: "M9 15a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7L11 7.5 M15 9a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7L13 16.5",
  flag: "M5 21V4h11l-2 4 2 4H5",
  // misc
  trophy: "M7 4h10v4a5 5 0 0 1-10 0V4Z M12 13v5 M8 21h8 M5 5H3v2a3 3 0 0 0 3 3 M19 5h2v2a3 3 0 0 1-3 3",
  globe: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Z M3 12h18 M12 3a14 14 0 0 1 0 18 M12 3a14 14 0 0 0 0 18",
  eye: "M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12Z M12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6Z",
  message: "M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v10Z",
  refresh: "M3 12a9 9 0 0 1 15-6.7L21 8 M21 3v5h-5 M21 12a9 9 0 0 1-15 6.7L3 16 M3 21v-5h5",
  thumbsUp: "M7 11v9H4v-9h3Z M7 11l4-7c1.5 0 3 .8 3 2.5V11h5a2 2 0 0 1 2 2.3l-1.4 6A2 2 0 0 1 17.6 21H7",
  trending: "M22 7 13.5 15.5 8.5 10.5 2 17 M16 7h6v6",
  zapOff: "M13 2L4 14h6m4 8 9-12h-7M2 2l20 20",
  alert: "M12 9v4 M12 17v.01 M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z",
  arrow_right: "M5 12h14 M13 6l6 6-6 6",
};

function Icon({ name, size = 18, className = "", strokeWidth = 1.8, fill = "none", ...rest }) {
  const d = ICON_PATHS[name];
  if (!d) return null;
  // Use multiple <path> when 'd' contains spaces breaking subpaths properly.
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={fill}
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      {...rest}
    >
      {d.split(" M").map((seg, i) => (
        <path key={i} d={i === 0 ? seg : "M" + seg} />
      ))}
    </svg>
  );
}

window.Icon = Icon;
