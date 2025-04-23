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

let globalTribute = null;
async function fetchContactsAndInitializeTribute(classId) {
  const combinedQueryForAdminTeacherAndStudents = `
query calcContacts($class_id: AwcClassID, $id: AwcClassID) {
  calcContacts(
    query: [
      {
        where: {
          Enrolments: [{ where: { class_id: $class_id } }]
        }
      }
      { orWhere: { Classes: [{ where: { id: $id } }] } }
      { orWhere: { email: "courses@writerscentre.com.au" } }
    ]
    limit: 50000
    offset: 0
  ) {
    Display_Name: field(arg: ["display_name"]) 
    First_Name: field(arg: ["first_name"])
    Last_Name: field(arg: ["last_name"]) 
    Contact_ID: field(arg: ["id"])
    Profile_Image: field(arg: ["profile_image"])
    Is_Instructor: field(arg: ["is_instructor"])
    Is_Admin: field(arg: ["is_admin"])
  }
}
`;
  const variables = { class_id: classId, id: classId };
  const defaultImageUrl =
    "https://file.ontraport.com/media/d297d307c0b44ab987c4c3ea6ce4f4d1.phpn85eue?Expires=4894682981&Signature=ITOEXhMnfN8RhJFBAPNE1r88KEv0EiFdNUDs1XFJWHGM-VHUgvnRlmbUxX6NrMESiC0IcQBi~Ev-jWHzgWDaUhEQOkljQgB2uLQHrxc2wlH~coXW8ZHT0aOWH160uZd5a6gUgnZWzNoIFU01RQZsxHjvc4Ds~lUpCiIeAKycYgwvZsPv5ir1tKuH~o7HUjfmCNdbStVMhSzfmyvsgP6uDCFspM19KtePjXy~rWteI8vFqltP28VLVNhUVCJ3jT29DiHdZRMYMeDUWVdYFBgebh~cCepChYOMG1ZGlfun9YtYDLuA7O93C2COEScR~gfomDrBDU5dgFXspiXnbTp58w__&Key-Pair-Id=APKAJVAAMVW6XQYWSTNA";
  try {
    const response = await fetch("https://awc.vitalstats.app/api/v1/graphql", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Api-Key": "mMzQezxyIwbtSc85rFPs3",
      },
      body: JSON.stringify({
        query: combinedQueryForAdminTeacherAndStudents,
        variables,
      }),
    });
    if (!response.ok) throw new Error("HTTP Error");
    const result = await response.json();
    if (!result?.data?.calcContacts) {
      return;
    }
    // const finalContacts = result.data.calcContacts
    //   .filter((contact) => contact.Display_Name)
    //   .map((contact) => {
    //     let userType = "(Student)";
    //     if (contact.Is_Admin) {
    //       userType = "(Admin)";
    //     } else if (contact.Is_Instructor) {
    //       userType = "(Tutor)";
    //     }
    //     return {
    //       key: `${contact.Display_Name} ${userType}`,
    //       value: String(contact.Contact_ID),
    //       image: contact.Profile_Image || defaultImageUrl,
    //     };
    //   });
     const finalContacts = Array.from(
      new Map(
        result.data.calcContacts
          .filter((contact) => contact.Display_Name)
          .map((contact) => {
            let displayName = contact.Display_Name;
            if (!displayName && (contact.First_Name || contact.Last_Name)) {
              displayName = `${contact.First_Name || ""} ${contact.Last_Name || ""}`.trim();
            }
            if (!displayName) return null;
              
            let userType = "(Student)";
            if (contact.Is_Admin) {
              userType = "(Admin)";
            } else if (contact.Is_Instructor) {
              userType = "(Tutor)";
            }
            return [
              contact.Contact_ID,
              {
                // key: `${contact.Display_Name} ${userType}`,
                  key: `${displayName} ${userType}`,
                value: String(contact.Contact_ID),
                image: !contact.Profile_Image || contact.Profile_Image === "https://i.ontraport.com/abc.jpg" ? defaultImageUrl : contact.Profile_Image,
                //image: contact.Profile_Image || defaultImageUrl,
              },
            ];
          })
      ).values()
    );
    globalTribute = new Tribute({
      values: finalContacts,
      menuItemTemplate: function (item) {
        return `
              <div class="cursor-pointer inline-flex items-center gap-x-1">
                <img src="${item.original.image}" style="object-fit:cover;height:20px;width:20px;border-radius:50%">
                <span>${item.string}</span>
              </div>
            `;
      },
      selectTemplate: function (item) {
        return `<span class="mention-handle label bg-[#C7E6E6] py-1 px-2 rounded text-dark small-text" data-mention-id="${item.original.value}">@${item.original.key}</span>`;
      },
    });
  } catch (e) {}
}
fetchContactsAndInitializeTribute(classIdFromSubmission);
document.addEventListener("focusin", (e) => {
  const m = e.target.closest(".mentionable");
  if (m && !m.dataset.tributeAttached && globalTribute) {
    globalTribute.attach(m);
    m.dataset.tributeAttached = "true";
  }
});

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
  `{ isExpanded: true,isOverlayVisible: false, currentUrl: '${window.location.href}', assessmentOpen: false }`
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
