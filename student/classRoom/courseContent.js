
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

  async function fetchClassIdFromUrl() {
    const regex = /[?&]eid=([^&#]*)/;
    const match = window.location.href.match(regex);
    if (!match || !match[1]) return null;

    const eidforEnroll = match[1];
    const query = {
      query: `
        query calcEnrolments {
          calcEnrolments(
            query: [
              { where: { id: "${eidforEnroll}" } }
              { andWhere: { course_id: "[Page//ID]" } }
            ]
          ) {
            Class_ID: field(arg: ["class_id"])
          }
        }
      `
    };

    const response = await fetch("https://awc.vitalstats.app/api/v1/graphql", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Api-Key": "mMzQezxyIwbtSc85rFPs3"
      },
      body: JSON.stringify(query)
    });
    const data = await response.json();
    const enrolments = data?.data?.calcEnrolments;

    if (Array.isArray(enrolments) && enrolments.length > 0) {
      return enrolments[0].Class_ID;
    }
    return null;
  }

  function getSydneyUnixFromLocalNow() {
    const userTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (userTimeZone === "Australia/Sydney") {
      return Date.now();
    }

    const now = new Date();
    const options = {
      timeZone: "Australia/Sydney",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false
    };
    const parts = new Intl.DateTimeFormat("en-CA", options).formatToParts(now);

    const sydney = {
      year: parts.find(p => p.type === "year").value,
      month: parts.find(p => p.type === "month").value,
      day: parts.find(p => p.type === "day").value,
      hour: parts.find(p => p.type === "hour").value,
      minute: parts.find(p => p.type === "minute").value,
      second: parts.find(p => p.type === "second").value
    };

    const utcDate = new Date(now.toISOString());
    const offsetMinutes = -utcDate.getTimezoneOffset();
    const sydneyOffsetMinutes = new Date().toLocaleTimeString('en-US', {
      timeZone: 'Australia/Sydney',
      timeZoneName: 'short'
    }).includes('AEDT') ? 660 : 600;
    const timezoneOffset = sydneyOffsetMinutes - offsetMinutes;

    return new Date(now.getTime() + timezoneOffset * 60000).getTime();
  }

  function getRemainingTime(openDateUnixMs, todayUnixMs) {
    if (todayUnixMs > openDateUnixMs) {
      return;
    }

    let diffMs = openDateUnixMs - todayUnixMs;
    const seconds = Math.floor((diffMs / 1000) % 60);
    const minutes = Math.floor((diffMs / (1000 * 60)) % 60);
    const hours = Math.floor((diffMs / (1000 * 60 * 60)) % 24);
    const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    return `${days}d ${hours}h ${minutes}m ${seconds}s`;
  }

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
    enrollmentCourseProgressQuery = `
      query calcEnrolments {
        calcEnrolments(query: [{ where: { id: ${eid} } }]) {
          Course_Course_Name: field(arg: ["Course", "course_name"])
          Lesson_CompletionsTotal_Count: countDistinct(
            args: [{ field: ["Lesson_Completions", "id"] }]
          )
        }
      }
    `;
    lessonDateProgress = `
      query calcEnrolments {
        calcEnrolments(query: [{ where: { id: ${eid} } }]) {
          Class_Start_Date: field(arg: ["Class", "start_date"])
          Class_End_Date: field(arg: ["Class", "end_date"])
        }
      }
    `;
  }

  function getEnrolmentLessonCompletionID() {
    const match = window.location.href.match(/[\?&]eid=(\d+)/);
    return match ? parseInt(match[1]) : null;
  }

  let eid = null;

  document.addEventListener("DOMContentLoaded", function () {
    const match = window.location.href.match(/[\?&]eid=(\d+)/);
    eid = match ? parseInt(match[1]) : null;
    if (!eid) return;
    defineQuery();
  });

  $.views.helpers({
    formatNewLines(text) {
      return text ? text.replace(/\n/g, "<br>") : "";
    },
    countMatchingLessons(lessons) {
      return lessons.filter(lesson => lesson.Status === "Completed").length;
    }
  });

  function checkLearningOutcomes() {
    const outcomes = [
      { textId: "learningOutcome1", svgId: "svgOutcome1" },
      { textId: "learningOutcome2", svgId: "svgOutcome2" },
      { textId: "learningOutcome3", svgId: "svgOutcome3" },
      { textId: "learningOutcome4", svgId: "svgOutcome4" },
      { textId: "learningOutcome5", svgId: "svgOutcome5" },
      { textId: "learningOutcome6", svgId: "svgOutcome6" },
      { textId: "learningOutcome7", svgId: "svgOutcome7" },
      { textId: "learningOutcome8", svgId: "svgOutcome8" }
    ];
    outcomes.forEach(({ textId, svgId }) => {
      const textEl = document.getElementById(textId);
      const svgEl = document.getElementById(svgId);
      if (!textEl || !textEl.textContent.trim()) {
        if (svgEl) svgEl.style.display = "none";
      }
    });
  }
  window.onload = checkLearningOutcomes;

  const urlParams = new URLSearchParams(window.location.search);
  const studentseid = urlParams.get("eid");

  async function fetchGraphQL(query) {
    try {
      const response = await fetch("https://awc.vitalstats.app/api/v1/graphql", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Api-Key": "mMzQezxyIwbtSc85rFPs3"
        },
        body: JSON.stringify({ query })
      });
      const result = await response.json();
      return result.data || {};
    } catch {
      return {};
    }
  }

  function formatDate(unixTimestamp) {
    if (!unixTimestamp) return "Invalid Date";
    const date = new Date(unixTimestamp * 1000);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric"
    });
  }

  function formatDateNew(unixTimestamp) {
    if (!unixTimestamp) return "Invalid Date";
    const date = new Date(unixTimestamp);
    return date.toLocaleDateString("en-US", {
      timeZone: "Australia/Sydney",
      year: "numeric",
      month: "long",
      day: "numeric"
    });
  }

  function determineAvailability(startDateUnix, weekOpen, customisations = []) {
    const todayUnix = getSydneyUnixFromLocalNow();
    if (!startDateUnix) {
      return { isAvailable: false, openDateText: "No Start Date" };
    }
    const SECONDS_IN_DAY = 86400;
    const SECONDS_IN_WEEK = 7 * SECONDS_IN_DAY;
    let openDateUnix;
    const sorted = [...customisations].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    const latestWithDate = sorted.find(c => c.specific_date);
    const latestWithOffset = sorted.find(c => c.days_to_offset != null);

    if (latestWithDate) {
      openDateUnix = latestWithDate.specific_date > 9999999999
        ? latestWithDate.specific_date
        : latestWithDate.specific_date * 1000;
    } else if (weekOpen === 0) {
      return { isAvailable: true, openDateText: "Available anytime" };
    } else {
      openDateUnix = (startDateUnix + (weekOpen - 1) * SECONDS_IN_WEEK) * 1000;
      if (latestWithOffset) {
        openDateUnix += latestWithOffset.days_to_offset * SECONDS_IN_DAY * 1000;
        const midnight = new Date(openDateUnix);
        midnight.setUTCHours(0, 0, 0, 0);
        openDateUnix = midnight.getTime();
      }
    }

    const isAvailable = todayUnix <= openDateUnix;
    const openDateText = `Unlocks on ${formatDateNew(openDateUnix)}`;
    return { isAvailable, openDateText, openDateUnix };
  }

  function determineAssessmentDueDateUnified(lesson, moduleStartDateUnix, customisations = []) {
    const dueWeek = lesson.assessmentDueEndOfWeek;
    if (dueWeek === 0 || dueWeek == null) {
      return { dueDateUnix: null, dueDateText: null };
    }

    const baseDate = new Date(moduleStartDateUnix);
    baseDate.setUTCHours(0, 0, 0, 0);
    const normalizedStart = baseDate.getTime();
    const sorted = [...customisations].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    const latestWithDate = sorted.find(c => c.specific_date);
    const latestWithOffset = sorted.find(c => c.days_to_offset != null);

    if (latestWithDate) {
      const dueMs = latestWithDate.specific_date > 9999999999
        ? latestWithDate.specific_date
        : latestWithDate.specific_date * 1000;
      return { dueDateUnix: dueMs, dueDateText: `Due on ${formatDateNew(dueMs)}` };
    }
    if (latestWithOffset) {
      const dueMs = normalizedStart + latestWithOffset.days_to_offset * 86400 * 1000;
      return { dueDateUnix: dueMs, dueDateText: `Due on ${formatDateNew(dueMs)}` };
    }

    const msInDay = 86400 * 1000;
    const endOfDayOffset = (23 * 3600 + 59 * 60) * 1000;
    const dueMs = normalizedStart + (dueWeek - 1) * msInDay + endOfDayOffset;
    return { dueDateUnix: dueMs, dueDateText: `Due on ${formatDateNew(dueMs)}` };
  }

  function generateLmsQuery(classID, studentseid, courseID) {
    return `
      query LMSQuery {
        LMSQuery: getCourses(query: [{ where: { id: ${courseID} } }]) {
          Enrolments_As_Course(query: [{ where: { id: ${studentseid} } }]) {
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
            ClassCustomisations(
              query: [{ where: { class_to_modify_id: ${classID} } }]
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
                query: [{ where: { id: ${studentseid} } }]
              ) {
                id
                Lesson_In_Progresses {
                  id
                }
              }
              Enrolment_Lesson_Completions(
                query: [{ where: { id: ${studentseid} } }]
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
      }`;
  }

  async function fetchLmsUnifiedData() {
    try {
      const classID = await fetchClassIdFromUrl();
      if (!classID) return null;

      const lmsQuery = generateLmsQuery(classID, studentseid, COURSE_ID);
      const response = await fetchGraphQL(lmsQuery);
      if (!response || !response.LMSQuery || !response.LMSQuery.length) {
        return null;
      }

      const course = response.LMSQuery[0];
      const classInfo = course.Enrolments_As_Course?.[0]?.Class || {};
      globalClassId = classInfo.id ?? null;
      showDripFed = classInfo.show_modules_drop_fed ?? false;

      return {
        courseName: course.course_name,
        courseAccessType: course.course_access_type,
        classId: classInfo.id ?? null,
        classUidForStudent: classInfo.unique_id ?? null,
        classNameForStudent: classInfo.class_name ?? null,
        dripFad: showDripFed,
        enrolments: (course.Enrolments_As_Course ?? []).map(enr => ({
          id: enr.id,
          resumeLessonUniqueId: enr.resume_lesson_unique_id,
          dateCompletion: enr.date_completion,
          certificateLink: enr.certificate__link,
          completedLessons: enr.completed__lessons,
          classInfo: enr.Class
            ? { startDate: enr.Class.start_date, endDate: enr.Class.end_date }
            : null
        })),
        modules: (course.Modules ?? []).map(mod => ({
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
          lessons: (mod.Lessons ?? []).map(les => ({
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
            lessonCustomisations: les.ClassCustomisations
          }))
        }))
      };
    } catch {
      return null;
    }
  }

  async function combineUnifiedData() {
    const data = await fetchLmsUnifiedData();
    if (!data) return null;

    const { classId, classUidForStudent, classNameForStudent, dripFad } = data;
    const enrolments = (data.enrolments || []).map(enr => ({
      id: enr.id,
      resumeLessonUniqueId: enr.resumeLessonUniqueId,
      dateCompletion: enr.dateCompletion,
      certificateLink: enr.certificateLink,
      completedLessons: enr.completedLessons,
      classInfo: enr.classInfo
    }));

    const todayUnix = getSydneyUnixFromLocalNow();
    const defaultClassStartDate =
      enrolments.length && enrolments[0].classInfo?.startDate
        ? Number(enrolments[0].classInfo.startDate)
        : todayUnix;

    const modules = await Promise.all(
      data.modules.map(async module => {
        const availability = determineAvailability(
          defaultClassStartDate,
          module.weekOpenFromStartDate,
          module.customisations
        );

        const lessons = await Promise.all(
          module.lessons.map(async lesson => {
            let status = "NotStarted";
            if (lesson.enrolmentLessonCompletions?.length > 0) {
              status = "Completed";
            } else if (lesson.lessonEnrolmentInProgresses?.length > 0) {
              status = "InProgress";
            }

            let dueDateInfo = { dueDateUnix: null, dueDateText: "No Due Date" };
            if (lesson.type === "Assessment") {
              dueDateInfo = determineAssessmentDueDateUnified(
                lesson,
                availability.openDateUnix,
                lesson.lessonCustomisations
              );
            }

            return {
              ...lesson,
              status,
              classId,
              classUidForStudent,
              classNameForStudent,
              dripFad,
              eid: data.enrolments?.[0]?.id ?? null,
              dueDateUnix: dueDateInfo.dueDateUnix,
              dueDateText: dueDateInfo.dueDateText,
              availability: availability.isAvailable,
              openDateText: availability.openDateText,
              dontTrackProgress: module.dontTrackProgress,
              courseAccessType: data.courseAccessType,
              dateCompletion: data.enrolments?.[0]?.dateCompletion ?? null
            };
          })
        );

        const flatCompletedIDs = module.lessons.flatMap(lesson =>
          (lesson.enrolmentLessonCompletions || []).flatMap(elc =>
            (elc.Lesson_Completions || []).map(comp => comp.id)
          )
        );
        const uniqueCompleted = new Set(flatCompletedIDs);

        return {
          ...module,
          classId,
          classUidForStudent,
          classNameForStudent,
          dripFad,
          lessons,
          lessonID: module.lessons.map(lesson => lesson.id),
          lessonCompletedID: Array.from(uniqueCompleted),
          completedCount: module.lessons.filter(lesson =>
            uniqueCompleted.has(lesson.id)
          ).length,
          courseName: data.courseName,
          eid: data.enrolments?.[0]?.id ?? null,
          courseAccessType: data.courseAccessType,
          availability: availability.isAvailable,
          openDateText: availability.openDateText,
          dateCompletion: data.enrolments?.[0]?.dateCompletion ?? null
        };
      })
    );

    return {
      courseName: data.courseName,
      courseAccessType: data.courseAccessType,
      dateCompletion: data.enrolments?.[0]?.dateCompletion ?? null,
      eid: data.enrolments?.[0]?.id ?? null,
      classId,
      classUidForStudent,
      classNameForStudent,
      dripFad,
      modules,
      enrolments
    };
  }

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

    const unifiedData = await combineUnifiedData();
    if (!unifiedData || !Array.isArray(unifiedData.modules)) return;

    unifiedNewModules = unifiedData.modules;

    const template = $.templates("#modulesTemplate");
    const htmlOutput = template.render({
      modules: unifiedData.modules,
      courseName: unifiedData.courseName
    });

    const progressTemplate = $.templates("#progressModulesTemplate");
    const progressOutput = progressTemplate.render({
      modules: unifiedData.modules,
      courseName: unifiedData.courseName
    });

    $("#modulesContainer").html(htmlOutput);
    $("#progressModulesContainer").html(progressOutput);
  }

  document.addEventListener("DOMContentLoaded", function () {
    document.body.addEventListener("click", function (event) {
      const anchor = event.target.closest("a.nextLessonUrl");
      if (!anchor) return;
      event.preventDefault();

      const href = anchor.getAttribute("href");
      const match = href.match(/content\/([^?\/]+)/);
      if (!match) return;

      const lessonUid = match[1];
      const module = unifiedNewModules.find(mod =>
        Array.isArray(mod.lessons) &&
        mod.lessons.some(lesson =>
          lesson.awcLessonContentPageUrl &&
          lesson.awcLessonContentPageUrl.includes(lessonUid)
        )
      );

      if (module && module.availability === false) {
        window.location.href = href;
      } else {
        document.querySelector(".unavailableLessonModal").classList.remove("hidden");
      }
    });
  });

  function addEventListenerIfExists(id, event, handler) {
    const el = document.getElementById(id);
    if (el) {
      el.addEventListener(event, async () => {
        await handler();
      });
    }
  }

  document.addEventListener("DOMContentLoaded", function () {
    addEventListenerIfExists("fetchModulesLessons", "click", renderUnifiedModules);
    addEventListenerIfExists("fetchProgressModulesLessons", "click", renderUnifiedModules);
    addEventListenerIfExists("finalMessageButton", "click", renderUnifiedModules);
  });

  document.addEventListener("DOMContentLoaded", function () {
    const basePath = "https://courses.writerscentre.com.au/course-details/content/";
    if (window.location.href.includes(basePath)) {
      renderUnifiedModules();
    }
  });
