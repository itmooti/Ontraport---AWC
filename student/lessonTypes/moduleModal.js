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

document.body.setAttribute(
  "x-data",
  `{ isExpanded: true,isOverlayVisible: false, openConformModal:false, currentUrl: '${window.location.href}', selectedTab: 'overview' }`
);

let eid = null;

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
let getModulesQuery;
let getLessonsQuery;
let completedQuery;
let inProgressQuery;
function defineQuery() {
  getModulesQuery = `
 query calcModules {
  calcModules(
   query: [
      {
        where: {
          Course: [
            {
              where: {
                Enrolments: [{ where: { id: ${eid} } }]
              }
            }
          ]
        }
      }
    ]
  ) {
        Module_Name: field(arg: ["module_name"]) 
		EnrolmentID: field(arg: ["Course", "Enrolments", "id"]) 
        Description: field(arg: ["description"]) 
        Order: field(arg: ["order"]) 
        ID: field(arg: ["id"])  
		Lesson_Count_Visible: field(arg: ["lesson__count__visible"]) 
		Lesson_Count_Progress: field(arg: ["lesson__count__progress"]) 
		Enrolment_Certificate_Link: field(arg: ["Course", "Enrolments", "certificate__link"])  
	 	Enrolment_Date_Completion: field(arg: ["Course", "Enrolments", "date_completion"])  
        Number_of_lessons_in_module: field( arg: ["number_of_lessons_in_module"]) 
        Module_Length_in_Hour: field(arg: ["module_length_in_hour"] ) 
        Module_Length_in_Minute: field( arg: ["module_length_in_minute"] ) 
        Module_Length_in_Second: field( arg: ["module_length_in_second"]) 
        Week_Open_from_Start_Date: field( arg: ["week_open_from_start_date"]) 
        Class_Start_Date: field(arg: [  "Course" "Classes_As_Active_Course""start_date"]) 
        Course_Course_Access_Type: field(arg: ["Course", "course_access_type"])  
   		Enrolment_Completed_Lessons: field(arg: ["Course", "Enrolments", "completed_lessons"])  
    	Don_t_Track_Progress: field(arg: ["don_t_track_progress"])  
  }
}
    `;

  // GraphQL Query for Lessons
  getLessonsQuery = `
query calcLessons {
  calcLessons(
    limit: 50000
    offset: 0
	orderBy: [{ path: ["order_in_module"], type: asc }]
  ) {
    ID: field(arg: ["id"])
    Module_ID: field(arg: ["module_id"]) 
    Assessment_Due_End_of_Week: field(arg: ["assessment_due_end_of_week"])  
	Custom_Button_Text: field(arg: ["custom__button__text"])   
	Lesson_Progress_Not_Tracked: field(arg: ["lesson__progress__not__tracked"]) 
    Lesson_Name: field(arg: ["lesson_name"]) 
    AWC_Lesson_Content_Page_URL: field(arg: ["awc_lesson_content_page_url"]) 
    Unique_ID: field(arg: ["unique_id"])
    Lesson_Length_in_Hour: field(arg: ["lesson_length_in_hour"])  
    Lesson_Length_in_Minute: field( arg: ["lesson_length_in_minute"]) 
    Lesson_Length_in_Second: field(arg: ["lesson_length_in_second"]) 
    Lesson_Introduction_Text: field(arg: ["lesson_introduction_text"]) 
    Lesson_Learning_Outcome: field(arg: ["lesson_learning_outcome"]) 
 	Type: field(arg: ["type"]) 
  }
}
`;

  completedQuery = `
        query {
            calcOEnrolmentLessonCompletionLessonCompletions(
                query: [{ where: { enrolment_lesson_completion_id: ${eid} } }]
            ) {
                Lesson_Completion_ID: field(arg: ["lesson_completion_id"])
            }
        }
    `;

  inProgressQuery = `
        query {
            calcOLessonInProgressLessonEnrolmentinProgresses(
                query: [{ where: { lesson_enrolment_in_progress_id: ${eid} } }]
            ) {
                Lesson_In_Progress_ID: field(arg: ["lesson_in_progress_id"])
            }
        }
    `;
}
