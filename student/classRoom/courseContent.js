console.log("Script start: initializing variables");
let completedQuery;
let inProgressQuery;
let enrollmentCourseProgressQuery;
let lessonDateProgress;
let getEnrollmentFormat;
let globalClassId = null;
let showDripFed = false;
let prevLesson = "";
let nextLesson = "";
let unifiedNewModules = [];
console.log("Initial state:", {
  completedQuery,
  inProgressQuery,
  enrollmentCourseProgressQuery,
  lessonDateProgress,
  getEnrollmentFormat,
  globalClassId,
  showDripFed,
  prevLesson,
  nextLesson,
  unifiedNewModules,
});

function getSydneyMidnightTimestamp(msTime) {
  // 1) Build a Date for your input time
  const d = new Date(msTime);

  // 2) Pull out the Sydney Y-M-D string (e.g. "2025-07-04")
  const dateStr = d.toLocaleDateString("en-CA", {
    timeZone: "Australia/Sydney",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  const [year, month, day] = dateStr.split("-").map(Number);

  // 3) Find Sydney’s offset at that moment, like "+10:00" or "+11:00"
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Australia/Sydney",
    timeZoneName: "shortOffset",
  }).formatToParts(d);
  const offsetPart =
    parts.find((p) => p.type === "timeZoneName")?.value || "+10:00";
  const m = offsetPart.match(/([+-])(\d{2}):(\d{2})/);
  const offsetMinutes = m
    ? (parseInt(m[2], 10) * 60 + parseInt(m[3], 10)) * (m[1] === "+" ? 1 : -1)
    : 600; // fallback to +10h

  // 4) Compute the UTC-ms for Sydney midnight:
  //    UTC midnight minus the Sydney offset
  return Date.UTC(year, month - 1, day, 0, 0, 0) - offsetMinutes * 60 * 1000;
}


async function fetchClassIdFromUrl() {
  console.log("fetchClassIdFromUrl start, URL:", window.location.href);

  const url               = new URL(window.location.href);
  const eidforEnroll      = url.searchParams.get("eid");
  const fallbackClassId   = url.searchParams.get("currentClassID") || url.searchParams.get("classIdFromUrl");

  if (!eidforEnroll) {
    console.log("  No eid found; using fallback class ID:", fallbackClassId);
    return fallbackClassId || null;
  }

  const query = {
    query: `
      query calcEnrolments {
        calcEnrolments(
          query: [
            { where: { id: "${eidforEnroll}" } }
            { andWhere: { course_id: "${COURSE_ID}" } }
          ]
        ) {
          Class_ID: field(arg: ["class_id"])
        }
      }
    `,
  };
  console.log("  GraphQL query:", query.query.trim());

  try {
    const response   = await fetch("https://awc.vitalstats.app/api/v1/graphql", {
      method:  "POST",
      headers: {
        "Content-Type": "application/json",
        "Api-Key":      "mMzQezxyIwbtSc85rFPs3",
      },
      body: JSON.stringify(query),
    });
    console.log("  fetch response:", response);

    const data        = await response.json();
    const enrolments  = data?.data?.calcEnrolments;
    console.log("  enrolments array:", enrolments);

    if (Array.isArray(enrolments) && enrolments.length > 0) {
      console.log("  Returning Class_ID:", enrolments[0].Class_ID);
      return enrolments[0].Class_ID;
    }
  } catch (err) {
    console.error("  fetchClassIdFromUrl error:", err);
  }

  console.log("  GraphQL returned no result; using fallback class ID:", fallbackClassId);
  return fallbackClassId || null;
}


function getSydneyUnixFromLocalNow() {
  console.log("getSydneyUnixFromLocalNow called");
  const userTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  console.log("  Local timezone:", userTimeZone);
  if (userTimeZone === "Australia/Sydney") {
    const sydneyNow = Date.now();
    console.log("  Already in Sydney TZ, timestamp (ms):", sydneyNow);
    return sydneyNow;
  }
  const now = new Date();
  console.log("  Current local Date object:", now);
  const options = {
    timeZone: "Australia/Sydney",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  };
  const parts = new Intl.DateTimeFormat("en-CA", options).formatToParts(now);
  console.log("  Intl parts for Sydney:", parts);

  const sydney = {
    year: parts.find((p) => p.type === "year").value,
    month: parts.find((p) => p.type === "month").value,
    day: parts.find((p) => p.type === "day").value,
    hour: parts.find((p) => p.type === "hour").value,
    minute: parts.find((p) => p.type === "minute").value,
    second: parts.find((p) => p.type === "second").value,
  };
  console.log("  Parsed Sydney date/time components:", sydney);

  const utcDate = new Date(now.toISOString());
  const offsetMinutes = -utcDate.getTimezoneOffset();
  console.log("  Local offset minutes:", offsetMinutes);
  const sydneyOffsetMinutes = new Date()
    .toLocaleTimeString("en-US", {
      timeZone: "Australia/Sydney",
      timeZoneName: "short",
    })
    .includes("AEDT")
    ? 660
    : 600;
  console.log("  Sydney offset minutes (AEDT/AEST):", sydneyOffsetMinutes);
  const timezoneOffset = sydneyOffsetMinutes - offsetMinutes;
  console.log("  Computed timezoneOffset:", timezoneOffset);

  const adjustedDate = new Date(now.getTime() + timezoneOffset * 60000);
  console.log("  Adjusted Date for Sydney:", adjustedDate);
  const sydneyUnixMs = adjustedDate.getTime();
  console.log("getSydneyUnixFromLocalNow returning:", sydneyUnixMs);
  return sydneyUnixMs;
}

function getRemainingTime(openDateUnixMs, todayUnixMs) {
  console.log(
    "getRemainingTime called with openDateUnixMs:",
    openDateUnixMs,
    "todayUnixMs:",
    todayUnixMs
  );
  if (todayUnixMs > openDateUnixMs) {
    console.log("  Already unlocked");
    return;
  }

  const diffMs = openDateUnixMs - todayUnixMs;
  const seconds = Math.floor((diffMs / 1000) % 60);
  const minutes = Math.floor((diffMs / (1000 * 60)) % 60);
  const hours = Math.floor((diffMs / (1000 * 60 * 60)) % 24);
  const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const formatted = `${days}d ${hours}h ${minutes}m ${seconds}s`;
  console.log("Remaining to unlock:", formatted);
  return formatted;
}

function defineQuery() {
  console.log("defineQuery called with eid:", eid);
  getEnrollmentFormat = `
    query calcEnrolments {
      calcEnrolments(query: [{ where: { id: ${eid} } }]) {
        Format: field(arg: ["format"])
      }
    }
  `;
  console.log("  getEnrollmentFormat set to:", getEnrollmentFormat.trim());

  completedQuery = `
    query {
      calcOEnrolmentLessonCompletionLessonCompletions(
        query: [{ where: { enrolment_lesson_completion_id: ${eid} } }]
      ) {
        Lesson_Completion_ID: field(arg: ["lesson_completion_id"])
      }
    }
  `;
  console.log("  completedQuery set to:", completedQuery.trim());

  inProgressQuery = `
    query {
      calcOLessonInProgressLessonEnrolmentinProgresses(
        query: [{ where: { lesson_enrolment_in_progress_id: ${eid} } }]
      ) {
        Lesson_In_Progress_ID: field(arg: ["lesson_in_progress_id"])
      }
    }
  `;
  console.log("  inProgressQuery set to:", inProgressQuery.trim());

  enrollmentCourseProgressQuery = `
    query calcEnrolments {
      calcEnrolments(query: [{ where: { id: ${eid} } }]) {
        Course_Course_Name: field(arg: ["Course", "course_name"])
        Lesson_CompletionsTotal_Count: countDistinct(args: [{ field: ["Lesson_Completions", "id"] }])
      }
    }
  `;
  console.log(
    "  enrollmentCourseProgressQuery set to:",
    enrollmentCourseProgressQuery.trim()
  );

  lessonDateProgress = `
    query calcEnrolments {
      calcEnrolments(query: [{ where: { id: ${eid} } }]) {
        Class_Start_Date: field(arg: ["Class", "start_date"])
        Class_End_Date: field(arg: ["Class", "end_date"])
      }
    }
  `;
  console.log("  lessonDateProgress set to:", lessonDateProgress.trim());
}

function getEnrolmentLessonCompletionID() {
  console.log(
    "getEnrolmentLessonCompletionID called, URL:",
    window.location.href
  );
  const urls = window.location.href;
  const matchs = urls.match(/[\?&]eid=(\d+)/);
  const result = matchs ? parseInt(matchs[1]) : null;
  console.log("  Returning enrolmentLessonCompletionID:", result);
  return result;
}

let eid = null;

document.addEventListener("DOMContentLoaded", function () {
  console.log("DOMContentLoaded #1: setting up eid and queries");
  const currentUrl = window.location.href;
  const match = currentUrl.match(/[\?&]eid=(\d+)/);
  eid = match ? parseInt(match[1]) : null;
  console.log("  Parsed eid:", eid);
  if (!eid) {
    console.log("  No eid, skipping defineQuery");
    return;
  }
  defineQuery();
});

$.views.helpers({
  formatNewLines: function (text) {
    console.log("formatNewLines helper called with:", text);
    return text ? text.replace(/\n/g, "<br>") : "";
  },
});

$.views.helpers({
  countMatchingLessons: function (lessons) {
    console.log("countMatchingLessons helper called, lessons:", lessons);
    return lessons.filter((lesson) => lesson.Status === "Completed").length;
  },
});

function checkLearningOutcomes() {
  console.log("checkLearningOutcomes called");
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
    console.log("  Checking outcome:", outcome);
    const textElement = document.getElementById(outcome.textId);
    const svgElement = document.getElementById(outcome.svgId);
    console.log("    textElement:", textElement, "svgElement:", svgElement);

    if (!textElement || !textElement.textContent.trim()) {
      console.log("    Hiding svg for", outcome.svgId);
      if (svgElement) {
        svgElement.style.display = "none";
      }
    }
  });
}

window.onload = function () {
  console.log("window.onload: invoking checkLearningOutcomes");
  checkLearningOutcomes();
};

const courseContenturl = window.location.href;
console.log("courseContenturl:", courseContenturl);
const urlParams = new URLSearchParams(window.location.search);
const studentseid = urlParams.get("eid");
console.log("studentseid from URLSearchParams:", studentseid);

async function fetchGraphQL(query) {
  console.log("fetchGraphQL called with query:", query.trim());
  try {
    const response = await fetch("https://awc.vitalstats.app/api/v1/graphql", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Api-Key": "mMzQezxyIwbtSc85rFPs3",
      },
      body: JSON.stringify({ query }),
    });
    console.log("  fetchGraphQL response:", response);
    const result = await response.json();
    console.log("  fetchGraphQL parsed JSON:", result);
    return result?.data || {};
  } catch (error) {
    console.error("  fetchGraphQL error:", error);
    return {};
  }
}

function formatDate(unixTimestamp) {
  console.log("formatDate called with unixTimestamp (s):", unixTimestamp);
  if (!unixTimestamp) return "Invalid Date";
  const date = new Date(unixTimestamp * 1000);
  const formatted = date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  console.log("  formatDate returning:", formatted);
  return formatted;
}

function formatDateNew(unixTimestamp) {
  console.log("formatDateNew called with unixTimestamp (ms):", unixTimestamp);
  if (!unixTimestamp) return "Invalid Date";
  const date = new Date(unixTimestamp);
  const formatted = date.toLocaleDateString("en-US", {
    timeZone: "Australia/Sydney",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  console.log("  formatDateNew returning:", formatted);
  return formatted;
}



function determineAvailability(startDateUnix, weekOpen, customisations = []) {
  console.log("determineAvailability called with:", {
    startDateUnix,
    weekOpen,
    customisations,
  });

  const todayUnix = getSydneyUnixFromLocalNow();
  console.log("  todayUnix:", todayUnix);

  if (!startDateUnix) {
    console.log("  No startDateUnix, returning unavailable");
    return { isAvailable: false, openDateText: "No Start Date" };
  }
  if (weekOpen === null || weekOpen === 0) {
    console.log("  weekOpen is null or 0, returning unavailable");
    return { isAvailable: false, openDateText: "Unavailable" };
  }

  const SECONDS_IN_DAY = 86400;
  const SECONDS_IN_WEEK = 7 * SECONDS_IN_DAY;
  let openDateUnix;

  const sortedCustomisations = [...customisations].sort(
    (a, b) => new Date(b.created_at) - new Date(a.created_at)
  );
  console.log("  sortedCustomisations:", sortedCustomisations);

  const latestWithDate = sortedCustomisations.find((c) => c.specific_date);
  console.log("  latestWithDate:", latestWithDate);

  const latestWithOffset = sortedCustomisations.find(
    (c) => c.days_to_offset !== null && c.days_to_offset !== undefined
  );
  console.log("  latestWithOffset:", latestWithOffset);

  if (latestWithDate) {
    openDateUnix =
      latestWithDate.specific_date > 9999999999
        ? latestWithDate.specific_date
        : latestWithDate.specific_date * 1000;
    console.log("  Using specific_date, openDateUnix:", openDateUnix);
  } else {
    openDateUnix = (startDateUnix + (weekOpen - 1) * SECONDS_IN_WEEK) * 1000;
    openDateUnix = getSydneyMidnightTimestamp(openDateUnix);
    console.log("  After weekOpen, raw openDateUnix:", openDateUnix);

    if (latestWithOffset) {
      openDateUnix += latestWithOffset.days_to_offset * SECONDS_IN_DAY * 1000;
      console.log("  After offset, raw openDateUnix:", openDateUnix);
      openDateUnix = getSydneyMidnightTimestamp(openDateUnix);
      console.log("  Snapped to Sydney midnight, openDateUnix:", openDateUnix);
    }
  }

  const isAvailable = todayUnix <= openDateUnix;
  const openDateText = `Unlocks on ${formatDateNew(openDateUnix)}`;
  console.log("  determineAvailability returning:", {
    isAvailable,
    openDateText,
    openDateUnix,
  });
  return { isAvailable, openDateText, openDateUnix };
}


function determineAssessmentDueDateUnified(
  lesson,
  moduleStartDateUnix,
  customisations = []
) {
  console.log("determineAssessmentDueDateUnified called with:", {
    lesson,
    moduleStartDateUnix,
    customisations,
  });
  const dueWeek = lesson.assessmentDueEndOfWeek;
  console.log("  dueWeek:", dueWeek);
  let dueDateUnix = null,
    dueDateText = null;

  if (dueWeek === 0 || dueWeek === null) {
    console.log("  No dueWeek or dueWeek=0, returning no due date");
    return { dueDateUnix: null, dueDateText: null };
  }

  const baseDate = new Date(moduleStartDateUnix);
  baseDate.setUTCHours(0, 0, 0, 0);
  const normalizedStartUnix = baseDate.getTime();
  console.log("  normalizedStartUnix:", normalizedStartUnix);

  const sorted = [...customisations].sort(
    (a, b) => new Date(b.created_at) - new Date(a.created_at)
  );
  console.log("  sorted assessment customisations:", sorted);
  const latestWithDate = sorted.find((c) => c.specific_date);
  console.log("  latestWithDate (assessment):", latestWithDate);
  const latestWithOffset = sorted.find(
    (c) => c.days_to_offset !== null && c.days_to_offset !== undefined
  );
  console.log("  latestWithOffset (assessment):", latestWithOffset);

  if (latestWithDate) {
    dueDateUnix =
      latestWithDate.specific_date > 9999999999
        ? latestWithDate.specific_date
        : latestWithDate.specific_date * 1000;
    dueDateText = `Due on ${formatDateNew(dueDateUnix)}`;
    console.log("  Specific-date due date:", { dueDateUnix, dueDateText });
    return { dueDateUnix, dueDateText };
  }

  if (latestWithOffset) {
    dueDateUnix =
      normalizedStartUnix + latestWithOffset.days_to_offset * 86400 * 1000;
    dueDateText = `Due on ${formatDateNew(dueDateUnix)}`;
    console.log("  Offset-based due date:", { dueDateUnix, dueDateText });
    return { dueDateUnix, dueDateText };
  }

  const endOfDayOffsetMs = (23 * 3600 + 59 * 60) * 1000;
  dueDateUnix =
    normalizedStartUnix + (dueWeek) * 86400 * 1000 + endOfDayOffsetMs;
  dueDateText = `Due on ${formatDateNew(dueDateUnix)}`;
  console.log("  Default end-of-week due date:", { dueDateUnix, dueDateText });
  return { dueDateUnix, dueDateText };
}

function generateLmsQuery(classID, studentseid, courseID) {
  console.log("generateLmsQuery called with:", {
    classID,
    studentseid,
    courseID,
  });
  const q = `
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
            id
            class_name
            unique_id
            show_modules_drop_fed
          }
        }
        course_name
        course_access_type
        Modules(
          limit: 1000 
          orderBy: [{ path: ["order"], type: asc }]
        ) {
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
            query: [{ where: {class_to_modify_id: ${classID}} }]
            orderBy: [{ path: ["created_at"], type: desc }]
          ) {
            id
            created_at
            days_to_offset
            specific_date
          }
          Lessons(
            limit: 1000 
            orderBy: [{ path: ["order_in_module"], type: asc }]
          ) {
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
            due_days_after_module_open_date
            assessment__due__date
            Lesson_Enrolment_in_Progresses(
              query: [{ where: {id: ${studentseid}} }]
            ) {
              id
              Lesson_In_Progresses {
                id
              }
            }
            Enrolment_Lesson_Completions(
              query: [{ where: {id: ${studentseid}} }]
            ) {
              id
              Lesson_Completions {
                id
              }
            }
            ClassCustomisations(
              query: [{ where: { class_to_modify_id: ${classID} } }]
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
  console.log("generateLmsQuery returning query string");
  return q;
}

async function fetchLmsUnifiedData() {
  console.log("fetchLmsUnifiedData start");
  try {
    const classID = await fetchClassIdFromUrl();
    console.log("  fetchLmsUnifiedData got classID:", classID);
    if (!classID) {
      console.log("  No classID, returning null");
      return null;
    }
    const lmsQuery = generateLmsQuery(classID, studentseid, COURSE_ID);
    const response = await fetchGraphQL(lmsQuery);
    console.log("  fetchLmsUnifiedData GraphQL response:", response);
    if (!response?.LMSQuery?.length) {
      console.log("  No LMSQuery data, returning null");
      return null;
    }

    const course = response.LMSQuery[0];
    console.log("  Course object:", course);
    const classId = course.Enrolments_As_Course?.[0]?.Class?.id ?? null;
    const classUidForStudent =
      course.Enrolments_As_Course?.[0]?.Class?.unique_id ?? null;
    const classNameForStudent =
      course.Enrolments_As_Course?.[0]?.Class?.class_name ?? null;
    globalClassId = classId;
    console.log("  Mapped classId, classUidForStudent, classNameForStudent:", {
      classId,
      classUidForStudent,
      classNameForStudent,
    });

    const dripFad =
      course.Enrolments_As_Course?.[0]?.Class?.show_modules_drop_fed ?? null;
    showDripFed = dripFad;
    console.log("  showDripFed:", showDripFed);

    const mappedData = {
      courseName: course.course_name,
      courseAccessType: course.course_access_type,
      classId,
      classUidForStudent,
      classNameForStudent,
      dripFad,
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
        classId,
        classUidForStudent,
        classNameForStudent,
        dripFad,
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
          assessmentDueEndOfWeek: les.due_days_after_module_open_date,
          assessmentDueDate: les.assessment__due__date,
          lessonEnrolmentInProgresses: les.Lesson_Enrolment_in_Progresses,
          enrolmentLessonCompletions: les.Enrolment_Lesson_Completions,
          lessonCustomisations: les.ClassCustomisations,
        })),
      })),
    };
    console.log("fetchLmsUnifiedData returning mappedData:", mappedData);
    return mappedData;
  } catch (error) {
    console.error("fetchLmsUnifiedData error:", error);
    return null;
  }
}

async function combineUnifiedData() {
  console.log("combineUnifiedData start");
  const data = await fetchLmsUnifiedData();
  console.log("  Data from fetchLmsUnifiedData:", data);
  if (!data) {
    console.log("  No data, returning null");
    return null;
  }

  const enrolments = (data.enrolments || []).map((enr) => ({
    id: enr.id,
    resumeLessonUniqueId: enr.resumeLessonUniqueId,
    dateCompletion: enr.dateCompletion,
    certificateLink: enr.certificateLink,
    completedLessons: enr.completedLessons,
    classInfo: enr.classInfo,
  }));
  console.log("  Mapped enrolments:", enrolments);

  const todayUnix = getSydneyUnixFromLocalNow();
  console.log("  todayUnix for combineUnifiedData:", todayUnix);

  const defaultClassStartDate =
    enrolments.length && enrolments[0].classInfo?.startDate
      ? Number(enrolments[0].classInfo.startDate)
      : todayUnix;
  console.log("  defaultClassStartDate:", defaultClassStartDate);

  const modules = await Promise.all(
    data.modules.map(async (module) => {
      console.log("  Processing module:", module.id);
      const moduleCustomisations = module.customisations || [];
      const availability = determineAvailability(
        defaultClassStartDate,
        module.weekOpenFromStartDate,
        moduleCustomisations
      );
      console.log("    availability for module:", availability);

      const lessons = await Promise.all(
        module.lessons.map(async (lesson) => {
          console.log("    Processing lesson:", lesson.id);
          let status = "NotStarted";
          if (lesson.enrolmentLessonCompletions?.length > 0) {
            status = "Completed";
          } else if (lesson.lessonEnrolmentInProgresses?.length > 0) {
            status = "InProgress";
          }
          console.log("      Determined status:", status);

          let dueDateInfo = { dueDateUnix: null, dueDateText: "No Due Date" };
          if (lesson.type === "Assessment") {
            const lessonCustomisations = lesson.lessonCustomisations || [];
            dueDateInfo = determineAssessmentDueDateUnified(
              lesson,
              availability.openDateUnix,
              lessonCustomisations
            );
          }
          console.log("      dueDateInfo:", dueDateInfo);

          return {
            ...lesson,
            status,
            classId: data.classId,
            classUidForStudent: data.classUidForStudent,
            classNameForStudent: data.classNameForStudent,
            dripFad: data.dripFad,
            eid: data.enrolments?.[0]?.id || null,
            dueDateUnix: dueDateInfo.dueDateUnix,
            dueDateText: dueDateInfo.dueDateText,
            availability: availability.isAvailable,
            openDateText: availability.openDateText,
            dontTrackProgress: module.dontTrackProgress,
            courseAccessType: data.courseAccessType,
            dateCompletion: data.enrolments?.[0]?.dateCompletion || null,
          };
        })
      );
      console.log("    Completed mapping lessons for module:", module.id);

      const lessonCompletedIDsFlat = module.lessons.flatMap((lesson) =>
        (lesson.enrolmentLessonCompletions || []).flatMap((elc) =>
          (elc.Lesson_Completions || []).map((comp) => comp.id)
        )
      );
      const uniqueCompletedIDs = new Set(lessonCompletedIDsFlat);
      const completedCount = module.lessons.filter((lesson) =>
        uniqueCompletedIDs.has(lesson.id)
      ).length;
      console.log("    completedCount for module:", completedCount);

      return {
        ...module,
        classId: data.classId,
        classUidForStudent: data.classUidForStudent,
        classNameForStudent: data.classNameForStudent,
        dripFad: data.dripFad,
        lessons,
        lessonID: module.lessons.map((lesson) => lesson.id),
        lessonCompletedID: Array.from(uniqueCompletedIDs),
        completedCount,
        courseName: data.courseName,
        eid: data.enrolments?.[0]?.id || null,
        courseAccessType: data.courseAccessType,
        availability: availability.isAvailable,
        openDateText: availability.openDateText,
        dateCompletion: data.enrolments?.[0]?.dateCompletion || null,
      };
    })
  );
  console.log("combineUnifiedData returning modules:", modules);

  return {
    courseName: data.courseName,
    courseAccessType: data.courseAccessType,
    dateCompletion: data.enrolments?.[0]?.dateCompletion || null,
    eid: data.enrolments?.[0]?.id || null,
    classId: data.classId,
    classUidForStudent: data.classUidForStudent,
    classNameForStudent: data.classNameForStudent,
    dripFad: data.dripFad,
    modules,
    enrolments,
  };
}

async function renderUnifiedModules() {
  console.log("renderUnifiedModules start");
  const skeletonHTML = `
    <div class="skeleton-container">
      <div class="skeleton-card skeleton-shimmer"></div>
      <div class="skeleton-card skeleton-shimmer"></div>
      <div class="skeleton-card skeleton-shimmer"></div>
      <div class="skeleton-card skeleton-shimmer"></div>
      <div class="skeleton-card skeleton-shimmer"></div>
    </div>
  `;
  console.log("  Injecting skeleton HTML");
  $("#modulesContainer").html(skeletonHTML);

  const unifiedData = await combineUnifiedData();
  console.log("  unifiedData from combineUnifiedData:", unifiedData);
  if (!unifiedData || !Array.isArray(unifiedData.modules)) {
    console.log("  No modules to render, exiting");
    return;
  }

  unifiedNewModules = unifiedData.modules;
  console.log("  unifiedNewModules set:", unifiedNewModules);

  const template = $.templates("#modulesTemplate");
  const htmlOutput = template.render({
    modules: unifiedData.modules,
    courseName: unifiedData.courseName,
  });
  console.log("  Rendered modulesTemplate");

  const progressTemplate = $.templates("#progressModulesTemplate");
  const progressOutput = progressTemplate.render({
    modules: unifiedData.modules,
    courseName: unifiedData.courseName,
  });
  console.log("  Rendered progressModulesTemplate");

  $("#modulesContainer").html(htmlOutput);
  $("#progressModulesContainer").html(progressOutput);
  console.log("renderUnifiedModules done");
}

document.addEventListener("DOMContentLoaded", function () {
  document.body.addEventListener("click", function (event) {
    var anchor = event.target.closest("a.nextLessonUrl");
    if (!anchor) {
      return;
    }
    console.log("  .nextLessonUrl clicked, href:", anchor.getAttribute("href"));
    event.preventDefault();
    var href = anchor.getAttribute("href");
    var match = href.match(/content\/([^?\/]+)/);
    if (!match) return;
    var lessonUid = match[1];
    var module = unifiedNewModules.find(function (mod) {
      return (
        Array.isArray(mod.lessons) &&
        mod.lessons.some(function (lesson) {
          return (
            lesson.awcLessonContentPageUrl &&
            lesson.awcLessonContentPageUrl.indexOf(lessonUid) !== -1
          );
        })
      );
    });
    console.log("  Found module for lessonUid:", module);
    if (module && module.availability === false) {
      console.log("  Module locked, navigating to href");
      window.location.href = href;
    } else {
      
      document
        .querySelector(".unavailableLessonModal")
        .classList.remove("hidden");
    }
  });
});

function addEventListenerIfExists(id, event, handler) {
  console.log(`addEventListenerIfExists called for #${id} event "${event}"`);
  const element = document.getElementById(id);
  if (element) {
    console.log(`  Element #${id} found, attaching handler`);
    element.addEventListener(event, async () => {
      console.log(`  Event "${event}" on #${id} triggered`);
      await handler();
    });
  } else {
    console.log(`  Element #${id} not found, skipping`);
  }
}

document.addEventListener("DOMContentLoaded", function () {
  console.log("DOMContentLoaded #3: attaching fetch/progress button handlers");
  addEventListenerIfExists(
    "fetchModulesLessons",
    "click",
    renderUnifiedModules
  );
  addEventListenerIfExists(
    "fetchProgressModulesLessons",
    "click",
    renderUnifiedModules
  );
  addEventListenerIfExists("finalMessageButton", "click", renderUnifiedModules);
});

document.addEventListener("DOMContentLoaded", function () {
  console.log("DOMContentLoaded #4: checking basePath for auto-render");
  const basePath =
    "https://courses.writerscentre.com.au/course-details/content/";
  console.log("  Current URL:", window.location.href, "basePath:", basePath);
  if (window.location.href.includes(basePath)) {
    console.log("  URL includes basePath, calling renderUnifiedModules()");
    renderUnifiedModules();
  }
});
