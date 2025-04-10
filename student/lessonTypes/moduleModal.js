
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
    window.location.href = href;
  } catch (error) {
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
  } catch (error) {
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

document.addEventListener("DOMContentLoaded", async function () {
  if (lessonID) {
    await updateResumeLesson(lessonID);
  }
});


