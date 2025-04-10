// get student enrolment id
const getEIDFromURLOnly = () => {
  const match = window.location.href.match(/[?&]eid=(\d+)/);
  return match ? match[1] : null;
};

// get enrolments format
document.addEventListener("DOMContentLoaded", async () => {
  const eid = getEIDFromURLOnly();
  if (!eid) return;

  const getEnrollmentFormat = `
      query calcEnrolments {
        calcEnrolments(query: [{ where: { id: ${eid} } }]) {
          Format: field(arg: ["format"])
        }
      }
    `;

  try {
    const response = await fetch(graphQlApiEndpointUrlAwc, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Api-Key": graphQlApiKeyAwc,
      },
      body: JSON.stringify({ query: getEnrollmentFormat }),
    });

    const result = await response.json();
    const format = result?.data?.calcEnrolments?.[0]?.Format;

    if (format === "Online Tutor-led" || format === "Online Live") {
      document.querySelectorAll(".hideIfOnline").forEach((el) => {
        el.classList.add("flex");
        el.classList.remove("hidden");
      });
    } else {
      document.querySelectorAll(".hideIfOnline").forEach((el) => {
        el.classList.remove("flex");
        el.classList.add("hidden");
      });
    }
  } catch (error) {
    console.error("GraphQL fetch error:", error);
  }
});

let showContentIfOriginal = document.querySelectorAll(".showContentIfOriginal");
let showContentIfReferenced = document.querySelectorAll(".showContentIfReferenced");

function showIfOriginal() {
  showContentIfOriginal.forEach((content) => {
    content.classList.remove("hidden");
  })

  showContentIfReferenced.forEach((content) => {
    content.classList.add("hidden");
  })
}

function showIfReferenced() {
  showContentIfOriginal.forEach((content) => {
    content.classList.add("hidden");
  })

  showContentIfReferenced.forEach((content) => {
    content.classList.remove("hidden");
  })
}

document.addEventListener("DOMContentLoaded", function () {
  if (contentOrigin === "Original" || contentOrigin === "") {
    showIfOriginal();
  } else {
    showIfReferenced();
  }
});