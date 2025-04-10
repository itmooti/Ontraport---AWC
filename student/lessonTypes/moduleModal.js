let showContentIfOriginal = document.querySelectorAll(".showContentIfOriginal");
let showContentIfReferenced = document.querySelectorAll(
  ".showContentIfReferenced"
);

function showIfOriginal() {
  showContentIfOriginal.forEach((content) => {
    content.classList.remove("hidden");
  });
  showContentIfReferenced.forEach((content) => {
    content.classList.add("hidden");
  });
}

function showIfReferenced() {
  showContentIfOriginal.forEach((content) => {
    content.classList.add("hidden");
  });
  showContentIfReferenced.forEach((content) => {
    content.classList.remove("hidden");
  });
}

document.addEventListener("DOMContentLoaded", function () {
  console.log(contentOrigin);
  if (contentOrigin === "Original" || contentOrigin === "") {
    showIfOriginal();
  } else {
    showIfReferenced();
  }
});

function downloadFile(fileLink, button, fileNames) {
  if (!fileLink || fileLink.trim() === "") return;
  // Update the text to "Downloading"
  const textElement = button.querySelector("div");
  if (textElement) {
    textElement.innerText = "Downloading...";
  }
  button.classList.add("state-disabled");
  fetch(fileLink)
    .then((response) => response.blob())
    .then((blob) => {
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = blobUrl;
      const filename = fileNames.split("/").pop().split("?")[0];
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
    })
    .catch((error) => console.error("Download failed", error))
    .finally(() => {
      // Revert the text back to "Download"
      if (textElement) {
        textElement.innerText = "Download";
      }
      button.classList.remove("state-disabled");
    });
}

async function navigateAfterUpdate(event, lessonID, href) {
  event.preventDefault();

  try {
    await updateResumeLesson(lessonID);
    console.log("Navigating to:", href);
    window.location.href = href;
  } catch (error) {
    console.error("Error updating lesson:", error);
  }
}

async function updateResumeLesson(lessonID) {
  const fullUrl = window.location.href;

  function getParam(paramName) {
    const fullUrl = window.location.href;
    const regex = new RegExp(`[?&]${paramName}=([^?&#]*)`, "i");
    const match = fullUrl.match(regex);
    return match ? decodeURIComponent(match[1]) : null;
  }

  const enrolmentId = getParam("eid");
  if (!enrolmentId) {
    console.error("Enrolment ID not found in the URL");
    return;
  }

  const graphqlEndpointas = "https://awc.vitalstats.app/api/v1/graphql";
  const apiKeyas = "mMzQezxyIwbtSc85rFPs3";

  const query = `
        mutation updateEnrolment($payload: EnrolmentUpdateInput) {
            updateEnrolment(
                query: [{ where: { id: ${enrolmentId} } }]
                payload: $payload
            ) {
                resume_lesson_unique_id
            }
        }
    `;

  const payload = {
    resume_lesson_unique_id: lessonID,
  };

  const requestBody = JSON.stringify({ query, variables: { payload } });

  try {
    const response = await fetch(graphqlEndpointas, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Api-Key": apiKeyas,
      },
      body: requestBody,
    });

    const result = await response.json();
    console.log("Mutation result:", result);
  } catch (error) {
    console.error("Error updating enrolment:", error);
  }
}

document.addEventListener("DOMContentLoaded", function () {
  let elements = document.querySelectorAll("iframe");

  elements.forEach((el) => {
    if (el.href && el.href.includes("/watch/")) {
      el.href = el.href.replace("/watch/", "/file/") + "/embed";
    }
    if (el.src && el.src.includes("/watch/")) {
      el.src = el.src.replace("/watch/", "/file/") + "/embed";
    }
  });
});

document.addEventListener("DOMContentLoaded", function () {
  // Get the current URL
  let currentUrl = window.location.href;

  // Extract the eid parameter using regex
  let match = currentUrl.match(/[\?&]eid=(\d+)/);
  let eid = match ? match[1] : null;

  if (eid) {
    // Select all elements with class "goBackToCourse"
    let courseLinks = document.querySelectorAll(".goBackToCourse");

    courseLinks.forEach((courseLink) => {
      let originalHref = courseLink.getAttribute("href");

      if (originalHref) {
        // Replace existing eid if present, or append if not
        let updatedHref = originalHref.includes("?eid=")
          ? originalHref.replace(/\?eid=\d+/, `?eid=${eid}`)
          : `${originalHref}?eid=${eid}`;

        courseLink.setAttribute("href", updatedHref);
      }
    });
  }
});


document.addEventListener("DOMContentLoaded", function () {
  // Extract and modify eid
  let currentUrl = window.location.href;
  let match = currentUrl.match(/[\?&]eid=(\d+)/);
  eid = match ? parseInt(match[1]) : null;

  if (!eid) {
    console.error("eid parameter not found in URL.");
  } else {
    console.log("Modified eid:", eid);
  }

  // Define getModulesQuery only after eid is set
  defineQuery();
});


document.addEventListener("DOMContentLoaded", async function () {
  if (lessonID) {
    await updateResumeLesson(lessonID);
  }
});

// let eid = null;

// document.addEventListener("DOMContentLoaded", function () {
//   // Extract and modify eid
//   let currentUrl = window.location.href;
//   let match = currentUrl.match(/[\?&]eid=(\d+)/);
//   eid = match ? parseInt(match[1]) : null;

//   if (!eid) {
//     console.error("eid parameter not found in URL.");
//   } else {
//     console.log("Modified eid:", eid);
//   }

//   // Define getModulesQuery only after eid is set
//   defineQuery();
//   startToProgress(eid);
// });

// //let getModulesQuery;
// //let getLessonsQuery;
// let completedQuery;
// let inProgressQuery;

// function defineQuery() {
//   completedQuery = `
//           query {
//               calcOEnrolmentLessonCompletionLessonCompletions(
//                   query: [{ where: { enrolment_lesson_completion_id: ${eid} } }]
//               ) {
//                   Lesson_Completion_ID: field(arg: ["lesson_completion_id"])
//               }
//           }
//       `;

//   inProgressQuery = `
//           query {
//               calcOLessonInProgressLessonEnrolmentinProgresses(
//                   query: [{ where: { lesson_enrolment_in_progress_id: ${eid} } }]
//               ) {
//                   Lesson_In_Progress_ID: field(arg: ["lesson_in_progress_id"])
//               }
//           }
//       `;
// }

// async function startToProgress(eid) {
//   const pageLessonID = parseInt("[Page//ID]");
//   const checkQuery = `
//        query calcOLessonInProgressLessonEnrolmentinProgresses {
//     calcOLessonInProgressLessonEnrolmentinProgresses(
//       query: [
//         { where: { lesson_enrolment_in_progress_id: ${eid} } }
//       ]
//     ) {
//       Lesson_In_Progress_ID: field(
//         arg: ["lesson_in_progress_id"]
//       )
//     }
//   }
//       `;
//   try {
//     const checkResponse = await fetch(
//       "https://awc.vitalstats.app/api/v1/graphql",
//       {
//         method: "POST",
//         headers: {
//           "Content-Type": "application/json",
//           "Api-Key": "mMzQezxyIwbtSc85rFPs3",
//         },
//         body: JSON.stringify({ query: checkQuery }),
//       }
//     );

//     const checkResult = await checkResponse.json();
//     const existingIDs =
//       checkResult?.data?.calcOLessonInProgressLessonEnrolmentinProgresses?.map(
//         (i) => i.Lesson_In_Progress_ID
//       );

//     if (existingIDs.includes(pageLessonID)) {
//       console.log("Lesson already in progress for this enrolment.");
//       return;
//     } else {
//       console.log("Lesson not in progress yet. Proceeding to create.");
//     }

//     const mutationQuery = `
//           mutation createOLessonInProgressLessonEnrolmentinProgress(
//             $payload: OLessonInProgressLessonEnrolmentinProgressCreateInput
//           ) {
//             createOLessonInProgressLessonEnrolmentinProgress(payload: $payload) {
//               lesson_in_progress_id
//               lesson_enrolment_in_progress_id
//             }
//           }
//         `;

//     const variables = {
//       payload: {
//         lesson_in_progress_id: pageLessonID,
//         lesson_enrolment_in_progress_id: eid,
//       },
//     };

//     const response = await fetch("https://awc.vitalstats.app/api/v1/graphql", {
//       method: "POST",
//       headers: {
//         "Content-Type": "application/json",
//         "Api-Key": "mMzQezxyIwbtSc85rFPs3",
//       },
//       body: JSON.stringify({ query: mutationQuery, variables }),
//     });

//     const result = await response.json();
//     console.log("Lesson progress created:", result);
//   } catch (error) {
//     console.error("Network or Fetch Error:", error);
//   }
// }
