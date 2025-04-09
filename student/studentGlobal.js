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
    const response = await fetch("https://awc.vitalstats.app/api/v1/graphql", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Api-Key": "mMzQezxyIwbtSc85rFPs3",
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

// get created at date
let createdAt;
var dateElements = document.querySelectorAll("[data-date-enrolled]");
var dates = [];
dateElements.forEach(function (el) {
  var timestamp = parseInt(el.getAttribute("data-date-enrolled"), 10);
  if (!isNaN(timestamp)) {
    dates.push(timestamp);
  }
});
if (dates.length > 0) {
  createdAt = Math.min.apply(null, dates);
  window.earliestEnrollmentDate = createdAt;
}
