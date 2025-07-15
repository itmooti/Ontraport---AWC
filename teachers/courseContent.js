async function getClassId() {
    const params = new URL(window.location.href).searchParams;
    return params.get("classId")?.replace(/'/g, "") || null;
}

function getClassUid() {
  const params = new URL(window.location.href).searchParams;
  return params.get('classUID')?.replace(/'/g, '') ?? null;
}

const classUid = getClassUid();

    let completedQueryForTeacher;
    let inProgressQueryForTeacher;
    let enrollmentCourseProgressQueryForTeacher;
    let lessonDateProgressTeacher;
    let getEnrollmentFormatTeacher;
    let globalClassIdTeacher = null;
    let showDripFedTeacher = false;
    let prevLessonTeacher = "";
    let nextLessonTeacher = "";
    let unifiedNewModulesTeacher = [];

    function getSydneyUnixFromLocalNow() {
        const userTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
        if (userTimeZone === "Australia/Sydney") {
            const sydneyNow = Date.now(); // Already Sydney time
            console.log("User is already in Sydney timezone.");
            console.log("Sydney Unix Timestamp (ms):", sydneyNow);
            return sydneyNow;
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

        // Format to ISO-style string
        const sydneyDateStr = `${sydney.year}-${sydney.month}-${sydney.day}T${sydney.hour}:${sydney.minute}:${sydney.second}`;

        // Create date using correct timezone offset (Sydney)
        // Use UTC base and manually apply timezone offset (ugly workaround, but native JS lacks tz awareness)
        const utcDate = new Date(now.toISOString()); // use current UTC time
        const offsetMinutes = -utcDate.getTimezoneOffset(); // current local offset in minutes

        // Offset in Sydney (hardcoded for now, better with Intl if needed dynamically)
        const sydneyOffsetMinutes = new Date().toLocaleTimeString('en-US', { timeZone: 'Australia/Sydney', timeZoneName: 'short' }).includes('AEDT') ? 660 : 600;
        const timezoneOffset = sydneyOffsetMinutes - offsetMinutes;

        const adjustedDate = new Date(new Date().getTime() + timezoneOffset * 60000);

        const sydneyUnixMs = adjustedDate.getTime();
        console.log("Sydney Unix Timestamp (ms):", sydneyUnixMs);
        return sydneyUnixMs;
    }

    function getRemainingTime(openDateUnixMs, todayUnixMs) {
        if (todayUnixMs > openDateUnixMs) {
            console.log("Already unlocked");
            return;
        }

        let diffMs = openDateUnixMs - todayUnixMs;

        let seconds = Math.floor((diffMs / 1000) % 60);
        let minutes = Math.floor((diffMs / (1000 * 60)) % 60);
        let hours = Math.floor((diffMs / (1000 * 60 * 60)) % 24);
        let days = Math.floor(diffMs / (1000 * 60 * 60 * 24));

        let formatted = `${days}d ${hours}h ${minutes}m ${seconds}s`;
        console.log("Remaining to unlock:", formatted);

        return formatted;
    }




    function defineQuery() {
        getEnrollmentFormatTeacher = `
        query calcEnrolments {
          calcEnrolments(query: [{ where: { id: ${eidTeacher} } }]) {
            Format: field(arg: ["format"])
          }
        }
        `;

        completedQueryForTeacher = `
        query {
            calcOEnrolmentLessonCompletionLessonCompletions(
                query: [{ where: { enrolment_lesson_completion_id: ${eidTeacher} } }]
            ) {
                Lesson_Completion_ID: field(arg: ["lesson_completion_id"])
            }
        }
    	`;

        inProgressQueryForTeacher = `
        query {
            calcOLessonInProgressLessonEnrolmentinProgresses(
                query: [{ where: { lesson_enrolment_in_progress_id: ${eidTeacher} } }]
            ) {
                Lesson_In_Progress_ID: field(arg: ["lesson_in_progress_id"])
            }
        }
    `;

        enrollmentCourseProgressQueryForTeacher = `query calcEnrolments {
  calcEnrolments(query: [{ where: { id: ${eidTeacher} } }]) {
    Course_Course_Name: field(
      arg: ["Course", "course_name"]
    ) 
 Lesson_CompletionsTotal_Count: countDistinct(
      args: [{ field: ["Lesson_Completions", "id"] }]
    ) 
  
  }
}`;

        lessonDateProgressTeacher = `query calcEnrolments {
  calcEnrolments(query: [{ where: { id: ${eidTeacher} } }]) {
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

    let eidTeacher = null;

    document.addEventListener("DOMContentLoaded", function () {
        let currentUrl = window.location.href;
        let match = currentUrl.match(/[\?&]eid=(\d+)/);
        eidTeacher = match ? parseInt(match[1]) : null;

        if (!eidTeacher) {
            return;
        }
        defineQuery();
    });

    $.views.helpers({
        formatNewLines: function (text) {
            return text ? text.replace(/\n/g, "<br>") : "";
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
                if (svgElement) {
                    svgElement.style.display = "none";
                }
            }
        });
    }

    window.onload = checkLearningOutcomes;

    const courseContenturlTeacher = window.location.href;
    const urlParamsTeacher = new URLSearchParams(window.location.search);
    const studentseidTeacher = urlParamsTeacher.get("eid");
    async function fetchGraphQL(query) {
        try {
            const response = await fetch("https://awc.vitalstats.app/api/v1/graphql", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Api-Key": "mMzQezxyIwbtSc85rFPs3",
                },
                body: JSON.stringify({ query }),
            });
            const result = await response.json();
            return result?.data || {};
        } catch (error) {
            return {};
        }
    }

    function formatDate(unixTimestamp) {
        if (!unixTimestamp) return "Invalid Date";
        const date = new Date(unixTimestamp * 1000);
        return date.toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
        });
    }

    // Format a unix timestamp to a human-readable date
    function formatDateNew(unixTimestamp) {
        if (!unixTimestamp) return "Invalid Date";
        const date = new Date(unixTimestamp); // Treat it as milliseconds
        return date.toLocaleDateString("en-US", {
            timeZone: "Australia/Sydney",
            year: "numeric",
            month: "long",
            day: "numeric",
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

        const sortedCustomisations = [...customisations].sort(
            (a, b) => new Date(b.created_at) - new Date(a.created_at)
        );

        const latestWithDate = sortedCustomisations.find((c) => c.specific_date);
        const latestWithOffset = sortedCustomisations.find(
            (c) => c.days_to_offset !== null && c.days_to_offset !== undefined
        );
        if (latestWithDate) {
            openDateUnix =
                latestWithDate.specific_date > 9999999999
                    ? latestWithDate.specific_date
                    : latestWithDate.specific_date * 1000;
        } else if (weekOpen === 0) {
            return { isAvailable: true, openDateText: "Available anytime" };
        } else {
            openDateUnix = (startDateUnix + (weekOpen - 1) * SECONDS_IN_WEEK) * 1000;
            if (latestWithOffset) {
                openDateUnix += latestWithOffset.days_to_offset * SECONDS_IN_DAY * 1000;
                const openDateMidnight = new Date(openDateUnix);
                openDateMidnight.setUTCHours(0, 0, 0, 0);
                openDateUnix = openDateMidnight.getTime();
            }
        }

        const isAvailable = todayUnix <= openDateUnix;
        const openDateText = `Unlocks on ${formatDateNew(openDateUnix)}`;
        return { isAvailable, openDateText, openDateUnix };
    }

     function determineAssessmentDueDateUnified(lesson, moduleStartDateUnix, customisations = []) {
    const dueWeek = lesson.assessmentDueEndOfWeek;
    let dueDateUnix = null, dueDateText = null;

    if (dueWeek === 0 || dueWeek === null) {
        return { dueDateUnix: null, dueDateText: null };
    }

    const baseDate = new Date(moduleStartDateUnix);
    baseDate.setUTCHours(0, 0, 0, 0);
    const normalizedStartUnix = baseDate.getTime();

    const sorted = [...customisations].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    const latestWithDate = sorted.find(c => c.specific_date);
    const latestWithOffset = sorted.find(c => c.days_to_offset !== null && c.days_to_offset !== undefined);

    if (latestWithDate) {
        dueDateUnix = latestWithDate.specific_date > 9999999999
            ? latestWithDate.specific_date
            : latestWithDate.specific_date * 1000;
        dueDateText = `Due on ${formatDateNew(dueDateUnix)}`;
        return { dueDateUnix, dueDateText };
    }

    if (latestWithOffset) {
        dueDateUnix = normalizedStartUnix + latestWithOffset.days_to_offset * 86400 * 1000;
        dueDateText = `Due on ${formatDateNew(dueDateUnix)}`;
        return { dueDateUnix, dueDateText };
    }

    const msInADay = 86400 * 1000;
    const endOfDayOffsetMs = (23 * 3600 + 59 * 60) * 1000;

    dueDateUnix = normalizedStartUnix + (dueWeek - 1) * msInADay + endOfDayOffsetMs;
    dueDateText = `Due on ${formatDateNew(dueDateUnix)}`;
    
    return { dueDateUnix, dueDateText };
}

    async function fetchLmsUnifiedData() {
        try {
		 const classIdOfTeacher = await getClassId();
        if (!classIdOfTeacher) return null;

        const queryWithClass = `
        query LMSQuery {
LMSQuery: getCourses(query: [{ where: { id: ${COURSE_ID} } }]) {
      Enrolments_As_Course:Classes_As_Course(query: [{ where: { id: ${classIdOfTeacher} } }]) {
      start_date
      end_date
      id
      show_modules_drop_fed
    }
    
  course_name
  course_access_type
  Modules (
		limit: 1000 
    orderBy: [{ path: ["order"], type: asc }]
  ){
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
    query: [{ where: {class_to_modify_id: ${classIdOfTeacher}} }]
      limit: 1
      offset: 0
      orderBy: [{ path: ["created_at"], type: desc }]
    ) {
      id
      created_at
      days_to_offset
      specific_date
    }
    Lessons (
    limit: 1000 
    orderBy: [{ path: ["order_in_module"], type: asc }]
    query: [
      {
        where: {
          type: "Download Certificate"
          _OPERATOR_: neq
        }
      }
    ]
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
      Lesson_Enrolment_in_Progresses{
        id
      Lesson_In_Progresses{
          id
        }
      }
      Enrolment_Lesson_Completions {
        id
              Lesson_Completions{
          id
        }
      }
      ClassCustomisations(
         query: [
        { where: { class_to_modify_id: ${classIdOfTeacher} } }
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
            const response = await fetchGraphQL(queryWithClass);

            if (!response || !response.LMSQuery || !response.LMSQuery.length) {
                return null;
            }

            const course = response.LMSQuery[0];
            const classId = course.Enrolments_As_Course?.[0]?.Class?.id ?? null;
            globalClassIdTeacher = classId;

            const dripFad =
                course.Enrolments_As_Course?.[0]?.Class?.show_modules_drop_fed ?? null;
            showDripFedTeacher = dripFad;
            const mappedData = {
                courseName: course.course_name,
                courseAccessType: course.course_access_type,
                classId,
                dripFad,
		enrolments: (course.Enrolments_As_Course ?? []).map((cls) => ({
		    id: cls.id,
		    classInfo: {
		        startDate: cls.start_date,
		        endDate: cls.end_date,
		        showModulesDropFed: cls.show_modules_drop_fed
		    }
		})),
                // enrolments: (course.Enrolments_As_Course ?? []).map((enr) => ({
                //     id: enr.id,
                //     resumeLessonUniqueId: enr.resume_lesson_unique_id,
                //     dateCompletion: enr.date_completion,
                //     certificateLink: enr.certificate__link,
                //     completedLessons: enr.completed__lessons,
                //     classInfo: enr.Class
                //         ? {
                //             startDate: enr.Class.start_date,
                //             endDate: enr.Class.end_date,
                //         }
                //         : null,
                // })),
                modules: (course.Modules ?? []).map((mod) => ({
                    id: mod.id,
                    classId,
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
            return mappedData;
        } catch (error) {
            return null;
        }
    }

    async function combineUnifiedData() {
        const data = await fetchLmsUnifiedData();
        if (!data) return null;

        const { classId, dripFad } = data;

        const enrolments = (data.enrolments || []).map((enr) => ({
            id: enr.id,
            resumeLessonUniqueId: enr.resumeLessonUniqueId,
            dateCompletion: enr.dateCompletion,
            certificateLink: enr.certificateLink,
            completedLessons: enr.completedLessons,
            classInfo: enr.classInfo,
        }));


        const todayUnix = getSydneyUnixFromLocalNow();

        const defaultClassStartDate =
            enrolments.length && enrolments[0].classInfo?.startDate
                ? Number(enrolments[0].classInfo.startDate)
                : todayUnix;

        const modules = await Promise.all(
            data.modules.map(async (module) => {
                const moduleCustomisations = module.customisations || [];
                const availability = determineAvailability(
                    defaultClassStartDate,
                    module.weekOpenFromStartDate,
                    moduleCustomisations
                );

                const lessons = await Promise.all(
                    module.lessons.map(async (lesson) => {
                        let status = "NotStarted";
                        if (lesson.enrolmentLessonCompletions?.length > 0) {
                            status = "Completed";
                        } else if (lesson.lessonEnrolmentInProgresses?.length > 0) {
                            status = "InProgress";
                        }

                        let dueDateInfo = { dueDateUnix: null, dueDateText: "No Due Date" };
                        if (lesson.type === "Assessment") {
                            const lessonCustomisations = lesson.lessonCustomisations || [];
                            dueDateInfo = determineAssessmentDueDateUnified(
                                lesson,
                                availability.openDateUnix,
                                lessonCustomisations
                            );
                        }

                        return {
                            ...lesson,
                            status,
                            classId,
                            dripFad,
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

                const lessonCompletedIDsFlat = module.lessons.flatMap((lesson) =>
                    (lesson.enrolmentLessonCompletions || []).flatMap((elc) =>
                        (elc.Lesson_Completions || []).map((comp) => comp.id)
                    )
                );

                const uniqueCompletedIDs = new Set(lessonCompletedIDsFlat);
                const completedCount = module.lessons.filter((lesson) =>
                    uniqueCompletedIDs.has(lesson.id)
                ).length;

                return {
                    ...module,
                    classId,
                    dripFad,
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

        return {
            courseName: data.courseName,
            courseAccessType: data.courseAccessType,
            dateCompletion: data.enrolments?.[0]?.dateCompletion || null,
            eid: data.enrolments?.[0]?.id || null,
            classId,
            dripFad,
            modules,
            enrolments,
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

        unifiedNewModulesTeacher = unifiedData.modules;
        const template = $.templates("#modulesTemplate");
        const htmlOutput = template.render({
            modules: unifiedData.modules,
            courseName: unifiedData.courseName,
        });

        const progressTemplate = $.templates("#progressModulesTemplate");
        const progressOutput = progressTemplate.render({
            modules: unifiedData.modules,
            courseName: unifiedData.courseName,
        });

        $("#modulesContainer").html(htmlOutput);
        $("#progressModulesContainer").html(progressOutput);
    }

    document.addEventListener("DOMContentLoaded", function () {
        document.body.addEventListener("click", function (event) {
            var anchor = event.target.closest("a.nextLessonTeacherUrl");
            if (!anchor) return;
            event.preventDefault();
            var href = anchor.getAttribute("href");
            var match = href.match(/content\/([^?\/]+)/);
            if (!match) return;
            var lessonUid = match[1];
            var module = unifiedNewModulesTeacher.find(function (mod) {
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
            if (module && module.availability === false) {
                window.location.href = href;
            } else {
                document
                    .querySelector(".unavailableLessonModal")
                    .classList.remove("hidden");
            }
        });
    });

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
        const basePath =
            "https://courses.writerscentre.com.au/course-details/content/";
        if (window.location.href.includes(basePath)) {
            renderUnifiedModules();
        }
    });

 document.addEventListener("DOMContentLoaded", function () {
  renderUnifiedModules();
});
