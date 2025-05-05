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
        Date_Completion: field(arg: ["date_completion"]) @dateFormat(value: "DD MONTH YYYY")
        Class_Show_Course_Chat: field(arg: ["Class", "show_course_chat"])
        Class_Show_Announcements: field(arg: ["Class", "show_announcements"])
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
    const enrolment = result?.data?.calcEnrolments?.[0];
    const enrolmentCompletionDate = enrolment?.Date_Completion;

    document.querySelectorAll(".enrolmentCompletionDateDiv").forEach(div => {
      div.textContent = enrolmentCompletionDate;
    });

    const chatEnabled = enrolment?.Class_Show_Course_Chat;
    document.querySelectorAll(".hideIfOnline").forEach(el => {
      if (chatEnabled) {
        el.classList.add("flex");
        el.classList.remove("hidden");
      } else {
        el.classList.remove("flex");
        el.classList.add("hidden");
      }
    });

    const announcementsEnabled = enrolment?.Class_Show_Announcements;
    document.querySelectorAll(".hideIfNoAnnouncement").forEach(el => {
      if (announcementsEnabled) {
        el.classList.add("flex");
        el.classList.remove("hidden");
      } else {
        el.classList.remove("flex");
        el.classList.add("hidden");
      }
    });

  } catch (error) {
    console.error("GraphQL fetch error:", error);
  }
});

