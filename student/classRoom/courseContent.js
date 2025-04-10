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

// Define helper function to count 'Completed' status
$.views.helpers({
  countCompleted: function (arr) {
    return arr.filter((item) => item.Status === "Completed").length;
  },
});

$.views.helpers({
    formatNewLines: function (text) {
        return text ? text.replace(/\n/g, "<br>") : "";
    },
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


const courseContenturl = window.location.href;
const urlParams = new URLSearchParams(window.location.search);
const studentseid = urlParams.get("eid");
async function fetchGraphQL(query) {
    try {
        const response = await fetch(
            "https://awc.vitalstats.app/api/v1/graphql",
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Api-Key": "mMzQezxyIwbtSc85rFPs3",
                },
                body: JSON.stringify({ query }),
            }
        );
        const result = await response.json();
        return result?.data || {};
    } catch (error) {
        return {};
    }
}

// Format a unix timestamp to a human-readable date
function formatDate(unixTimestamp) {
    if (!unixTimestamp) return "Invalid Date";
    const date = new Date(unixTimestamp * 1000);
    return date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
    });
}

// Get the upcoming Sunday given a start date and a weeks offset
function getUpcomingSunday(startDateUnix, weeksOffset = 0) {
    const startDate = new Date(startDateUnix * 1000);
    let nextSunday = new Date(startDate);
    nextSunday.setDate(
        nextSunday.getDate() + (7 - nextSunday.getDay()) + weeksOffset * 7
    );
    return Math.floor(nextSunday.getTime() / 1000);
}

// Synchronously determine the due date for assessment lessons using customisation data from the unified query
function determineAssessmentDueDateUnified(
    lesson,
    moduleStartDateUnix,
    customisation
) {
    const dueWeek = lesson.assessmentDueEndOfWeek;
    let dueDateUnix, dueDateText;
    if (customisation) {
        if (customisation.specific_date) {
            dueDateUnix =
                customisation.specific_date > 9999999999
                    ? Math.floor(customisation.specific_date / 1000)
                    : customisation.specific_date;
            dueDateText = `Due on ${formatDate(dueDateUnix)}`;
        } else if (
            customisation.days_to_offset !== null &&
            customisation.days_to_offset !== undefined
        ) {
            if (customisation.days_to_offset === 0) {
                dueDateUnix = moduleStartDateUnix;
            } else if (customisation.days_to_offset === -1) {
                dueDateUnix =
                    getUpcomingSunday(moduleStartDateUnix, 0) - 24 * 60 * 60;
            } else if (customisation.days_to_offset === 1) {
                dueDateUnix =
                    getUpcomingSunday(moduleStartDateUnix, 1) + 24 * 60 * 60;
            } else {
                dueDateUnix = getUpcomingSunday(
                    moduleStartDateUnix,
                    customisation.days_to_offset
                );
            }
            dueDateText = `Due on ${formatDate(dueDateUnix)}`;
        } else {
            dueDateUnix = getUpcomingSunday(moduleStartDateUnix, dueWeek);
            dueDateText = `Due on ${formatDate(dueDateUnix)}`;
        }
    } else {
        dueDateUnix =
            dueWeek === 0
                ? moduleStartDateUnix
                : getUpcomingSunday(moduleStartDateUnix, dueWeek);
        dueDateText = `Due on ${formatDate(dueDateUnix)}`;
    }
    return { dueDateUnix, dueDateText };
}
// Determine lesson/module availability using the provided customisation data from the unified query
function determineAvailability(startDateUnix, weeks, customisation) {
    if (!startDateUnix) {
        return { isAvailable: false, openDateText: "No Start Date" };
    }
    let openDateUnix, openDateText;
    if (!customisation) {
        openDateUnix = startDateUnix + weeks * 7 * 24 * 60 * 60;
        openDateText = `Unlocks on ${formatDate(openDateUnix)}`;
    } else {
        if (customisation.specific_date) {
            openDateUnix =
                customisation.specific_date > 9999999999
                    ? Math.floor(customisation.specific_date / 1000)
                    : customisation.specific_date;
            openDateText = `Unlocks on ${formatDate(openDateUnix)}`;
        } else if (
            customisation.days_to_offset !== null &&
            customisation.days_to_offset !== undefined
        ) {
            openDateUnix =
                startDateUnix + customisation.days_to_offset * 24 * 60 * 60;
            openDateText = `Unlocks on ${formatDate(openDateUnix)}`;
        } else {
            openDateUnix = startDateUnix + weeks * 7 * 24 * 60 * 60;
            openDateText = `Unlocks on ${formatDate(openDateUnix)}`;
        }
    }
    const todayUnix = Math.floor(Date.now() / 1000);
    // Original logic preserved: available if unlock date is greater than or equal to today
    const isAvailable = openDateUnix >= todayUnix;
    return { isAvailable, openDateText };
}

// Unified GraphQL query (includes all customisations)
const lmsQuery = `
    query LMSQuery {
LMSQuery: getCourses(query: [{ where: { id: ${COURSE_ID} } }]) {
Enrolments_As_Course(query: [{ where: {id: ${studentseid}} }]) { 
resume_lesson_unique_id           
id
date_completion
certificate__link
completed__lessons
Class {
  start_date
  end_date
}
}
course_name
course_access_type
Modules {
id
unique_id
order
module_name
description
week_open_from_start_date
don_t_track_progress
zoom_session
module_default_is_open
module_length_in_hour
module_length_in_minute
number_of_lessons_in_module
lesson__count__visible
lesson__count__progress
don_t_track_progress
ClassCustomisations(
  limit: 1
  offset: 0
  orderBy: [{ path: ["created_at"], type: desc }]
) {
  id
  created_at
  days_to_offset
  specific_date
}
Lessons {
  id
  unique_id
  order_in_module
  order_in_course
  type
  lesson_name
  lesson_introduction_text
  lesson_learning_outcome
  time_to_complete
  lesson_length_in_hour
  lesson_length_in_minute
  awc_lesson_content_page_url
  custom__button__text
  lesson__progress__not__tracked
  Assessments {
    name
  }
  assessment_due_end_of_week
  assessment__due__date
  Lesson_Enrolment_in_Progresses(
    query: [{ where: {id: ${studentseid}} }]
  ) {
    id
  Lesson_In_Progresses{
      id
    }
  }
  Enrolment_Lesson_Completions(
    query: [{ where: {id: ${studentseid}} }]
  ) {
    id
          Lesson_Completions{
      id
    }
  }
  ClassCustomisations(
    query: [
      { where: { type: "Assessment" } }
    ]
    limit: 1
    offset: 0
    orderBy: [{ path: ["created_at"], type: desc }]
  ) {
    id
    created_at
    days_to_offset
    specific_date
  }
}
}
}
}
  `;

// Fetch and map the unified data from the new query
async function fetchLmsUnifiedData() {
    try {
        const response = await fetchGraphQL(lmsQuery);

        if (!response || !response.LMSQuery || !response.LMSQuery.length) {
            return null;
        }

        const course = response.LMSQuery[0];
        const mappedData = {
            courseName: course.course_name,
            courseAccessType: course.course_access_type,
            enrolments: (course.Enrolments_As_Course ?? []).map((enr) => ({
                id: enr.id,
                resumeLessonUniqueId: enr.resume_lesson_unique_id,
                dateCompletion: enr.date_completion,
                certificateLink: enr.certificate__link,
                completedLessons: enr.completed__lessons,
                classInfo: enr.Class
                    ? {
                        startDate: enr.Class.start_date,
                        endDate: enr.Class.end_date,
                    }
                    : null,
            })),
            modules: (course.Modules ?? []).map((mod) => ({
                id: mod.id,
                uniqueId: mod.unique_id,
                order: mod.order,
                moduleName: mod.module_name,
                description: mod.description,
                weekOpenFromStartDate: mod.week_open_from_start_date,
                dontTrackProgress: mod.don_t_track_progress,
                zoomSession: mod.zoom_session,
                moduleDefaultIsOpen: mod.module_default_is_open,
                moduleLengthInHour: mod.module_length_in_hour,
                moduleLengthInMinute: mod.module_length_in_minute,
                numberOfLessons: mod.number_of_lessons_in_module,
                lessonCountVisible: mod.lesson__count__visible,
                lessonCountProgress: mod.lesson__count__progress,
                customisations: mod.ClassCustomisations,
                lessons: (mod.Lessons ?? []).map((les) => ({
                    id: les.id,
                    uniqueId: les.unique_id,
                    orderInModule: les.order_in_module,
                    orderInCourse: les.order_in_course,
                    type: les.type,
                    lessonName: les.lesson_name,
                    lessonIntroductionText: les.lesson_introduction_text,
                    lessonLearningOutcome: les.lesson_learning_outcome,
                    timeToComplete: les.time_to_complete,
                    lessonLengthInHour: les.lesson_length_in_hour,
                    lessonLengthInMinute: les.lesson_length_in_minute,
                    awcLessonContentPageUrl: les.awc_lesson_content_page_url,
                    customButtonText: les.custom__button__text,
                    lessonProgressNotTracked: les.lesson__progress__not__tracked,
                    assessments: les.Assessments,
                    assessmentDueEndOfWeek: les.assessment_due_end_of_week,
                    assessmentDueDate: les.assessment__due__date,
                    lessonEnrolmentInProgresses: les.Lesson_Enrolment_in_Progresses,
                    enrolmentLessonCompletions: les.Enrolment_Lesson_Completions,
                    lessonCustomisations: les.ClassCustomisations,
                })),
            })),
        };
        return mappedData;
    } catch (error) {
        return null;
    }
}

// Combine and map course, module, and lesson data with progress and due date calculations
async function combineUnifiedData() {
    const data = await fetchLmsUnifiedData();

    if (!data) return null;
    const enrolments = (data.enrolments || []).map((enr) => ({
        id: enr.id,
        resumeLessonUniqueId: enr.resumeLessonUniqueId,
        dateCompletion: enr.dateCompletion,
        certificateLink: enr.certificateLink,
        completedLessons: enr.completedLessons,
        classInfo: enr.classInfo
            ? {
                startDate: enr.classInfo.startDate,
                endDate: enr.classInfo.endDate,
            }
            : null,
    }));


    // Use class start date from enrolments (fallback to current time)
    const defaultClassStartDate = enrolments.length && enrolments[0].classInfo?.startDate
        ? Number(enrolments[0].classInfo.startDate)
        : Math.floor(Date.now() / 1000);
    const modules = await Promise.all(
        data.modules.map(async (module) => {
            // Use customisations from the unified query for module-level due/open date
            const moduleCustomisation =
                module.customisations && module.customisations.length > 0
                    ? module.customisations[0]
                    : null;
            const availability = determineAvailability(
                defaultClassStartDate,
                module.weekOpenFromStartDate,
                moduleCustomisation
            );

            const lessons = await Promise.all(
                module.lessons.map(async (lesson) => {
                    let status = "NotStarted";
                    if (
                        lesson.enrolmentLessonCompletions &&
                        lesson.enrolmentLessonCompletions.length > 0
                    ) {
                        status = "Completed";
                    } else if (
                        lesson.lessonEnrolmentInProgresses &&
                        lesson.lessonEnrolmentInProgresses.length > 0
                    ) {
                        status = "InProgress";
                    }
                    let dueDateInfo = {
                        dueDateUnix: null,
                        dueDateText: "No Due Date",
                    };
                    if (lesson.type === "Assessment") {
                        // Use lesson customisation data from the unified query
                        const lessonCustomisation =
                            lesson.lessonCustomisations &&
                                lesson.lessonCustomisations.length > 0
                                ? lesson.lessonCustomisations[0]
                                : null;
                        dueDateInfo = determineAssessmentDueDateUnified(
                            lesson,
                            defaultClassStartDate,
                            lessonCustomisation
                        );
                    }
                    return {
                        ...lesson,
                        status,
                        eid: data.enrolments?.[0]?.id || null,
                        dueDateUnix: dueDateInfo.dueDateUnix,
                        dontTrackProgress: module.dontTrackProgress,
                        dueDateText: dueDateInfo.dueDateText,
                        availability: availability.isAvailable,
                        openDateText: availability.openDateText,
                        courseAccessType: data.courseAccessType,
                        dateCompletion: data.enrolments?.[0]?.dateCompletion || null,


                    };
                })
            );
            const lessonCompletedIDsFlat = module.lessons.flatMap((lesson) =>
                (lesson.enrolmentLessonCompletions || []).flatMap((elc) =>
                    (elc.Lesson_Completions || []).map((comp) => comp.id)
                )
            );

            // Optional deduplication:
            const uniqueCompletedIDs = new Set(lessonCompletedIDsFlat);

            const completedCount = module.lessons.filter((lesson) =>
                uniqueCompletedIDs.has(lesson.id)
            ).length;


            return {
                ...module,
                lessons,
                dontTrackProgress: module.dontTrackProgress,

                lessonID: module.lessons.map((lesson) => lesson.id),
                lessonCompletedID: Array.from(uniqueCompletedIDs),
                completedCount,
                courseName: data.courseName,
                eid: data.enrolments?.[0]?.id || null,
                courseAccessType: data.courseAccessType,
                availability: availability.isAvailable,
                dateCompletion: data.enrolments?.[0]?.dateCompletion || null,
                openDateText: availability.openDateText,
            };
        })
    );
    return {
        courseName: data.courseName,
        courseAccessType: data.courseAccessType,
        dateCompletion: data.enrolments?.[0]?.dateCompletion || null,
        eid: data.enrolments?.[0]?.id || null,
        modules,

    };
}

// Render modules and progress sections using JS render templates
async function renderUnifiedModules() {
    const skeletonHTML = `
      <div class="skeleton-container">
        <div class="skeleton-card skeleton-shimmer"></div>
        <div class="skeleton-card skeleton-shimmer"></div>
        <div class="skeleton-card skeleton-shimmer"></div>
        <div class="skeleton-card skeleton-shimmer"></div>
        <div class="skeleton-card skeleton-shimmer"></div>
      </div>
    `;
    $("#modulesContainer").html(skeletonHTML);
    // $("#progressModulesContainer").html(skeletonHTML);
    const unifiedData = await combineUnifiedData();

    if (!unifiedData || !Array.isArray(unifiedData.modules)) {
        return;
    }
    const template = $.templates("#modulesTemplate");
    const htmlOutput = template.render({
        modules: unifiedData.modules,
        courseName: unifiedData.courseName,
    });
    const progressTemplate = $.templates("#progressModulesTemplate");
    const progressOutput = progressTemplate.render({ modules: unifiedData.modules, courseName: unifiedData.courseName });
    $("#modulesContainer").html(htmlOutput);
    $("#progressModulesContainer").html(progressOutput);
}

// Helper to add event listeners if element exists
function addEventListenerIfExists(id, event, handler) {
    const element = document.getElementById(id);
    if (element) {
        element.addEventListener(event, async () => {
            await handler();
        });
    }
}

// Attach events on DOM load
document.addEventListener("DOMContentLoaded", function () {
    addEventListenerIfExists("fetchModulesLessons", "click", renderUnifiedModules);
    addEventListenerIfExists("fetchProgressModulesLessons", "click", renderUnifiedModules);
    addEventListenerIfExists("finalMessageButton", "click", renderUnifiedModules);
});