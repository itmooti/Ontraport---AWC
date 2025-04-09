// initial loader
window.addEventListener("load", function () {
  const loader = document.getElementById("loader");
  setTimeout(() => {
    loader.classList.add("fade-out");
  }, 500);
});

// tailwind config
tailwind.config = {
  theme: {
    extend: {
      colors: {
        primary: "var(--primary)",
        background: "var(--background)",
        dark: "var(--dark)",
        grey: "var(--grey)",
        white: "var(--white)",
        line: "var(--line)",
        secondary: "var(--secondary)",
        danger: "var(--danger)",
        warning: "var(--warning)",
        cool: "var(--cool)",
        success: "var(--success)",
      },
      screens: {
        xlg: "1100px",
      },
      fontSize: {
        h1: ["32px", { lineHeight: "40px", fontWeight: "400" }],
        h2: ["24px", { lineHeight: "32px", fontWeight: "400" }],
        h3: ["20px", { lineHeight: "24px", fontWeight: "600" }],
        h4: ["14px", { lineHeight: "18px", fontWeight: "600" }],
        largeBodyText: ["18px", { lineHeight: "28px", fontWeight: "400" }],
        bodyText: ["16px", { lineHeight: "24px", fontWeight: "400" }],
        button: ["16px", { lineHeight: "16px", fontWeight: "600" }],
        label: ["12px", { lineHeight: "12px", fontWeight: "600" }],
        blockquote: ["40px", { lineHeight: "48px", fontWeight: "600" }],
        sub: [
          "14px",
          { lineHeight: "14px", fontWeight: "600", letterSpacing: "0.06em" },
        ],
        smallText: ["14px", { lineHeight: "20px", fontWeight: "400" }],
        extraSmallText: ["12px", { lineHeight: "16px", fontWeight: "400" }],
      },
    },
  },
};
