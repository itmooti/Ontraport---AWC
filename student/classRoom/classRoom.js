var classIdFormEnrolment = document
  .querySelector("#classId")
  .getAttribute("data-id");

document.body.setAttribute(
  "x-data",
  "(() => ({ selectedTab: `${selectedTab}`}))()"
);

document.addEventListener("DOMContentLoaded", function () {
  var learningOutcomes = document
    .getElementById("allLearningOutcomes")
    .dataset.learningoutcomes.trim();
  var isEmpty = !learningOutcomes;

  if (isEmpty) {
    document.querySelectorAll(".hideIfNoLearningOutcome").forEach((el) => {
      el.style.display = "none";
    });
  }
});

function selectedTabChange(tabname) {
  let url = window.location.href;
  let match = url.match(/(\?|\&)eid=\d+/);
  if (!match) {
    return;
  }
  let eidIndex = url.indexOf(match[0]) + match[0].length;
  let newUrl = url.substring(0, eidIndex) + `&selectedTab=${tabname}`;
  window.history.replaceState(null, "", newUrl);
}

if (selectedTab === "content" || selectedTab === "progress") {
  console.log("Start:", selectedTab);
  document.addEventListener("DOMContentLoaded", async () => {
    await fetchEnrollmentProgress();
    renderUnifiedModules();
  });
}

if (selectedTab === "anouncemnt") {
  fetchAnnouncements();
}

if (selectedTab === "courseChat") {
  loadPosts("all");
}

$.views.helpers({
  formatNewLines: function (text) {
    return text ? text.replace(/\n/g, "<br>") : "";
  },
});

let assessmentoverviewBodyContainer = document.querySelectorAll(
  ".assessmentoverviewBodyContainer"
);

assessmentoverviewBodyContainer.forEach((container) => {
  if (!overviewBody) {
    container.classList.add("hidden");
  } else {
    container.classList.remove("hidden");
  }
});

let textContent = document.querySelectorAll(".textContentContainer");

textContent.forEach((container) => {
  if (!contentBody.trim()) {
    container.classList.add("hidden");
  } else {
    container.classList.remove("hidden");
  }
});

document.addEventListener(
  "keydown",
  function (e) {
    if (e.key === "ArrowUp" || e.key === "ArrowDown") {
      e.stopPropagation();
    }
  },
  true
);

function getEnrolmentLessonCompletionID() {
  let urls = window.location.href;
  let matchs = urls.match(/[\?&]eid=(\d+)/);
  return matchs ? parseInt(matchs[1]) : null;
}

let eid = null;

document.addEventListener("DOMContentLoaded", function () {
  let currentUrl = window.location.href;
  let match = currentUrl.match(/[\?&]eid=(\d+)/);
  eid = match ? parseInt(match[1]) : null;

  if (!eid) {
    console.error("eid parameter not found in URL.");
  } else {
  }
  defineQuery();
});

let completedQuery;
let inProgressQuery;
let enrollmentCourseProgressQuery;
let lessonDateProgress;
let getEnrollmentFormat;

function defineQuery() {
  getEnrollmentFormat = `
        query calcEnrolments {
          calcEnrolments(query: [{ where: { id: ${eid} } }]) {
            Format: field(arg: ["format"])
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

  enrollmentCourseProgressQuery = `query calcEnrolments {
  calcEnrolments(query: [{ where: { id: ${eid} } }]) {
    Course_Course_Name: field(
      arg: ["Course", "course_name"]
    ) 
 Lesson_CompletionsTotal_Count: countDistinct(
      args: [{ field: ["Lesson_Completions", "id"] }]
    ) 
  
  }
}`;
  lessonDateProgress = `query calcEnrolments {
  calcEnrolments(query: [{ where: { id: ${eid} } }]) {
    Class_Start_Date: field(arg: ["Class", "start_date"]) 
    Class_End_Date: field(arg: ["Class", "end_date"]) 
  }
}
`;
}

// Define helper function to count 'Completed' status
$.views.helpers({
  countCompleted: function (arr) {
    return arr.filter((item) => item.Status === "Completed").length;
  },
});

document.addEventListener("DOMContentLoaded", function () {
  let currentUrl = window.location.href;
  let tabMatch = currentUrl.match(/[?&]selectedTab=([^?&#]*)/);
  let selectedTab = tabMatch ? decodeURIComponent(tabMatch[1]) : null;
  let announcementMatch = currentUrl.match(
    /[?&]data-announcement-template-id=(\d+)/
  );
  let announcementId = announcementMatch ? announcementMatch[1] : null;
  let postMatch = currentUrl.match(/[?&]current-post-id=(\d+)/);
  let postId = postMatch ? postMatch[1] : null;
  function highlightElement() {
    let targetElement = null;
    if (selectedTab === "anouncemnt" && announcementId) {
      targetElement = document.querySelector(
        `[data-announcement-template-id="${announcementId}"]`
      );
    } else if (selectedTab === "courseChat" && postId) {
      targetElement = document.querySelector(`[current-post-id="${postId}"]`);
    }
    if (targetElement) {
      targetElement.classList.add("highlightTheSelected");
      setTimeout(() => {
        targetElement.scrollIntoView({ behavior: "smooth", block: "center" });
      }, 1000);
      return true;
    }
    return false;
  }
  if (!highlightElement()) {
    const observer = new MutationObserver(() => {
      if (highlightElement()) {
        observer.disconnect();
      }
    });
    observer.observe(document.body, { childList: true, subtree: true });
  }
});

$.views.helpers({
  getToday: function () {
    let today = new Date();
    return today.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  },
  extractDate: function (text) {
    let dateMatch = text.match(/([A-Za-z]+ \d{1,2}, \d{4})/);
    return dateMatch ? dateMatch[0] : "";
  },
});

let selectedTab = "overview";
let currentUrl = window.location.href;
let match = currentUrl.match(/[?&]selectedTab=([^?&#]*)/);

if (match) {
  selectedTab = decodeURIComponent(match[1]);
}

//helper jsrender function to count the number of lessons inside the module that is completed
$.views.helpers({
  countMatchingLessons: function (lessons) {
    return lessons.filter((lesson) => lesson.Status === "Completed").length;
  },
});

// Function to hide SVG if the corresponding div is empty
function checkLearningOutcomes() {
  const outcomes = [
    { textId: "learningOutcome1", svgId: "svgOutcome1" },
    { textId: "learningOutcome2", svgId: "svgOutcome2" },
    { textId: "learningOutcome3", svgId: "svgOutcome3" },
    { textId: "learningOutcome4", svgId: "svgOutcome4" },
    { textId: "learningOutcome5", svgId: "svgOutcome5" },
    { textId: "learningOutcome6", svgId: "svgOutcome6" },
    { textId: "learningOutcome7", svgId: "svgOutcome7" },
    { textId: "learningOutcome8", svgId: "svgOutcome8" },
  ];

  outcomes.forEach((outcome) => {
    const textElement = document.getElementById(outcome.textId);
    const svgElement = document.getElementById(outcome.svgId);

    if (!textElement || !textElement.textContent.trim()) {
      svgElement.style.display = "none";
    }
  });
}

window.onload = checkLearningOutcomes;
