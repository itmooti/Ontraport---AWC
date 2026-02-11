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

async function resolveClassId(originalClassId) {
  const match = window.location.href.match(/[?&]eid=(\d+)/);
  const eid = match ? match[1] : null;

  if (!eid) return originalClassId;

  const query = `
    query calcClasses {
      calcClasses(
        query: [
          {
            where: {
              Enrolments: [
                { where: { status: "Active" } }
                { orWhere: { status: "New" } }
              ]
            }
          }
          {
            andWhere: { Enrolments: [{ where: { id: ${eid} } }] }
          }
        ]
      ) {
        ID: field(arg: ["id"])
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
      body: JSON.stringify({ query }),
    });

    if (!response.ok) return originalClassId;

    const result = await response.json();
    const resolvedId = result.data?.calcClasses?.[0]?.ID;
    return resolvedId || originalClassId;
  } catch (e) {
    return originalClassId;
  }
}


window.addEventListener("message", function (event) {
  const iframes = document.querySelectorAll(".submission-frame");
  iframes.forEach((iframe) => {
    if (iframe.src.startsWith(event.data.iframeSrc)) {
      iframe.style.height = event.data.iframeHeight + "px";
    }
  });
});

async function navigateAfterUpdate(event, lessonID, href) {
  event.preventDefault();
  try {
    await updateResumeLesson(lessonID);
    window.location.href = href;
  } catch (error) {}
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
  } catch (error) {}
}

let storedDueDate = null;

document.addEventListener("DOMContentLoaded", function () {
  const url = window.location.href;
  // Extract Due parameter without using URLSearchParams
  const match = url.match(/[?&]Due=([^&]+)/);
  storedDueDate = match ? decodeURIComponent(match[1]) : null;
  // Set Due Date inside elements on the parent page
  if (storedDueDate) {
    const changeDate = document.querySelectorAll(".changeDueDate");
    if (changeDate.length > 0) {
      changeDate.forEach((changeDateDue) => {
        changeDateDue.innerText = storedDueDate;
      });
    }
  } else {
    const mainwrapperforDueTop = document.querySelector(
      ".mainwrapperforDueTop"
    );
    if (mainwrapperforDueTop) {
      mainwrapperforDueTop.classList.add("hidden");
    }
  }
  const iframes = document.querySelectorAll("iframe");
  iframes.forEach((iframe) => {
    iframe.addEventListener("load", function () {
      // Send Due Date to the iframe when it loads
      if (storedDueDate) {
        iframe.contentWindow.postMessage(
          { dueDate: storedDueDate },
          "https://courses.writerscentre.com.au"
        );
      }
      iframe.contentWindow.postMessage({ requestHeight: true }, "*");
    });
  });
});

// Listen for requests from the iframe (if it loads late)
window.addEventListener("message", function (event) {
  if (event.origin !== "https://courses.writerscentre.com.au") return;
  if (event.data.requestDueDate && storedDueDate) {
    event.source.postMessage({ dueDate: storedDueDate }, event.origin);
  }
});

window.addEventListener("message", function (event) {
  if (event.data.frameHeight && event.data.frameId) {
    document.getElementById(event.data.frameId).style.height =
      event.data.frameHeight + "px";
  }
});
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

document.body.setAttribute(
  "x-data",
  `{ isExpanded: true,deleteSubmissionModal: false, openConformModal:false, isOverlayVisible: false, currentUrl: '${window.location.href}', assessmentOpen: false, deleteSubmissionModal: false,deleteCommentReplyModal: false }`
);

let assessmentVideoContainer = document.querySelectorAll(
  ".assessmentVideoContainer"
);
assessmentVideoContainer.forEach((container) => {
  if (!videoFile) {
    container.classList.add("hidden");
  } else {
    container.classList.remove("hidden");
  }
});

let assessmentAudioContainer = document.querySelectorAll(
  ".assessmentAudioContainer"
);
assessmentAudioContainer.forEach((container) => {
  if (!audFile) {
    container.classList.add("hidden");
  } else {
    container.classList.remove("hidden");
  }
});
