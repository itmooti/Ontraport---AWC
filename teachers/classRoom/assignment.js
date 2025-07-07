// Updated GraphQL query (search parameter removed)
let FetchLessonQuery = `
        query calcLessons($orderBy: [QueryOrderByInput!]) {
        calcLessons(
            query: [
            { where: { type: "Assessment" } }
            {
                andWhere: {
                Course: [
                    {
                    where: {
                        unique_id: "${CourseUniqueIDForTeacher}"
                    }
                    }
                ]
                }
            }
            ]
            orderBy: $orderBy
        ) {
            ID: field(arg: ["id"])
            submissionTotalCount: countDistinct(
            args: [
                { field: ["Assessments", "Submissions", "id"] }
            ]
            )
            AssessmentsType: field(arg: ["Assessments", "type"])
            AssessmentsName: field(arg: ["Assessments", "name"])
            Module_Module_Name: field(
            arg: ["Module", "module_name"]
            )
            Lesson_Name: field(arg: ["lesson_name"])
            Assessments_AWC_Teacher_s_Portal_Class_Assignment_Details_Page_URL: field(
            arg: [
                "Assessments"
                "awc_teacher_s_portal_class_assignment_details_page_url"
            ]
            )
            Assessments_Total_Primary_Submissions: field(
            arg: ["Assessments", "total_primary_submissions"]
            )
            Class_Student_Enrolements: field(
            arg: [
                "Course"
                "Classes_As_Active_Course"
                "student_enrolements"
            ]
            )
            created_at: field(arg: ["created_at"])
        }
        }
`;

let FetchLessonCustomizationQuery = `
query calcClassCustomisations(
  $lesson_to_modify_id: AwcLessonID
) {
  calcClassCustomisations(
    query: [
      { where: { type: "Assessment Due Date" } }
      {
        andWhere: {
          lesson_to_modify_id: $lesson_to_modify_id
        }
      }
      {
        andWhere: {
          class_to_modify_id: "${currentPageClassIDForAssessments}"
        }
      }
    ]
  ) {
    ID: field(arg: ["id"])
    Date_Added: field(arg: ["created_at"])
    Days_to_Offset: field(arg: ["days_to_offset"])
    Specific_Date: field(arg: ["specific_date"])
    Module_Week_Open_from_Start_Date: field(
      arg: [
        "Lesson_to_Modify"
        "Module"
        "week_open_from_start_date"
      ]
    )
    Class_To_Modify_Start_Date: field(
      arg: ["Class_to_Modify", "start_date"]
    )
    Lesson_To_Modify_Due_days_after_module_open_date: field(
      arg: [
        "Lesson_to_Modify"
        "due_days_after_module_open_date"
      ]
    )
  }
}
`;

// Helper: GraphQL fetch function.
async function fetchGraphQL(query, variables) {
  const response = await fetch(useGloballyAPIEndPointURLGraphQL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Api-Key": useGloballyAPIKeyGraphQL,
    },
    body: JSON.stringify({ query, variables }),
  });
  const result = await response.json();
  if (result.errors) {
  }
  return result;
}

// Helper: Format a Date object as "Due By Sunday 23:59 Feb 9"
function formatDueString(date) {
  const days = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ];
  const months = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];
  const dayName = days[date.getDay()];
  const hours = date.getHours().toString().padStart(2, "0");
  const minutes = date.getMinutes().toString().padStart(2, "0");
  const monthAbbr = months[date.getMonth()];
  const dayOfMonth = date.getDate();
  return `Due By ${dayName} ${hours}:${minutes} ${dayOfMonth} ${monthAbbr}`;
}

// Due date calculations (unchanged)
function computeDueDateFromAssessment(startDate, dueEndOfWeekValue) {
  dueEndOfWeekValue = parseInt(dueEndOfWeekValue, 10);
  if (!dueEndOfWeekValue || dueEndOfWeekValue === 0) return null;
  const totalDays = (dueEndOfWeekValue - 1) * 7;
  const dueDate = new Date(startDate);
  dueDate.setDate(startDate.getDate() + totalDays);
  dueDate.setHours(23, 59, 0, 0);
  return dueDate;
}

function computeDueDateFromCustomization(startDate, daysOffset) {
  let dueDate = new Date(startDate);
  dueDate.setDate(startDate.getDate() + parseInt(daysOffset, 10));
  dueDate.setHours(23, 59, 0, 0);
  if (dueDate < startDate) {
    let adjusted = new Date(startDate);
    adjusted.setHours(23, 59, 0, 0);
    return adjusted;
  }
  return dueDate;
}

// Convert global classStartDate (Unix seconds) into a Date using UTC values.
function getStartDate() {
  const rawStartDate = new Date(classStartDate * 1000);
  return new Date(
    rawStartDate.getUTCFullYear(),
    rawStartDate.getUTCMonth(),
    rawStartDate.getUTCDate()
  );
}

// Debounce helper function.
function debounce(func, delay) {
  let timeout;
  return function (...args) {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(this, args), delay);
  };
}

// Helper to adjust a date to the next Sunday at 23:59
function adjustToNextSunday(date) {
  let d = new Date(date);
  let dayOfWeek = d.getDay();
  let daysUntilSunday = dayOfWeek === 0 ? 0 : 7 - dayOfWeek;
  d.setDate(d.getDate() + daysUntilSunday);
  d.setHours(23, 59, 0, 0);
  return d;
}

// New function for due date calculation based on customization fields
function computeAssessmentDueDateFromCustomization(
  customization,
  classStartDate
) {
  if (
    customization.Specific_Date !== null &&
    customization.Specific_Date !== undefined
  ) {
    return new Date(customization.Specific_Date * 1000);
  }

  let weekOpen = parseInt(customization.Module_Week_Open_from_Start_Date, 10);
  if (isNaN(weekOpen) || weekOpen < 1) weekOpen = 1;

  let moduleOpenDate = new Date(classStartDate);
  moduleOpenDate.setDate(moduleOpenDate.getDate() + (weekOpen - 1) * 7);

  if (
    customization.Days_to_Offset !== null &&
    customization.Days_to_Offset !== undefined
  ) {
    let dueDate = new Date(moduleOpenDate);
    dueDate.setDate(
      dueDate.getDate() + parseInt(customization.Days_to_Offset, 10)
    );
    dueDate.setHours(23, 59, 0, 0);
    return dueDate;
  }

  if (
    customization.Lesson_To_Modify_Due_days_after_module_open_date !== null &&
    customization.Lesson_To_Modify_Due_days_after_module_open_date !== undefined
  ) {
    let dueDate = new Date(moduleOpenDate);
    dueDate.setDate(
      dueDate.getDate() +
        parseInt(
          customization.Lesson_To_Modify_Due_days_after_module_open_date,
          10
        )
    );
    dueDate.setHours(23, 59, 0, 0);
    return dueDate;
  }

  let fallback = new Date(classStartDate);
  fallback.setHours(23, 59, 0, 0);
  return fallback;
}

// Load assignments and then filter based on the frontend search query.

async function loadAssignments() {
  const container = document.getElementById("assignmentsContainer");
  container.innerHTML = `
            <div role="status" class="flex h-[100px] w-full animate-pulse items-center justify-center rounded-lg bg-gray-300"></div>
            <div role="status" class="flex h-[100px] w-full animate-pulse items-center justify-center rounded-lg bg-gray-300"></div>
            <div role="status" class="flex h-[100px] w-full animate-pulse items-center justify-center rounded-lg bg-gray-300"></div>
            <div role="status" class="flex h-[100px] w-full animate-pulse items-center justify-center rounded-lg bg-gray-300"></div>
`;

  try {
    const startDate = getStartDate();

    const variables = {
      active_class_id: parseInt(activeClassID, 10),
      limit: limit,
      offset: offset,
      orderBy: currentOrderBy,
    };

    const lessonsResponse = await fetchGraphQL(FetchLessonQuery, variables);
    let lessons = lessonsResponse.data.calcLessons || [];

    // Frontend filtering based on searchQuery:
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      lessons = lessons.filter(
        (lesson) =>
          (lesson.AssessmentsName &&
            lesson.AssessmentsName.toLowerCase().includes(q)) ||
          (lesson.Module_Module_Name &&
            lesson.Module_Module_Name.toLowerCase().includes(q)) ||
          (lesson.Lesson_Name && lesson.Lesson_Name.toLowerCase().includes(q))
      );
    }

    container.innerHTML = "";

    // Toggle "no assignment available" message.
    const noAssignmentsDiv = document.querySelector(".showIfNoAssignments");
    if (!lessons || lessons.length === 0) {
      noAssignmentsDiv.classList.remove("hidden");
    } else {
      noAssignmentsDiv.classList.add("hidden");
    }
    dueDates = [];

    // Render each assignment.
    lessons.forEach(async (lesson) => {
      if (!lesson) return;
      let dueDate = null;
      const customizationResponse = await fetchGraphQL(
        FetchLessonCustomizationQuery,
        { lesson_to_modify_id: lesson.ID }
      );
      const customizations = customizationResponse.data.calcClassCustomisations;
      if (customizations && customizations.length > 0) {
        customizations.sort((a, b) => b.Date_Added - a.Date_Added);
        const latestCustomization = customizations[0];
        dueDate = computeAssessmentDueDateFromCustomization(
          latestCustomization,
          startDate
        );
      } else {
        dueDate = adjustToNextSunday(new Date(startDate));
      }
      dueDates.push({
        lessonID: lesson.ID,
        dueDate: dueDate || "No Due Date",
      });

      // Create the assignment element using your provided template.
      const assignmentDiv = document.createElement("a");
      assignmentDiv.className =
        "p-4 bg-[#fff] justify-between items-center flex assignmentsWrapper";
      assignmentDiv.setAttribute(
        "data-assignment-name",
        lesson.AssessmentsName
      );
      assignmentDiv.setAttribute("data-module-name", lesson.Module_Module_Name);
      assignmentDiv.setAttribute("data-date-added", lesson.created_at);
      assignmentDiv.setAttribute(
        "data-due-date",
        dueDate ? formatDueString(dueDate) : "No Due Date"
      );
      assignmentDiv.href =
        (lesson.Assessments_AWC_Teacher_s_Portal_Class_Assignment_Details_Page_URL ||
          "#") +
        "?duedate=" +
        encodeURIComponent(dueDate ? formatDueString(dueDate) : "No Due Date") +
        `&classNameAdmin=${encodeURIComponent(classNameAdmin)}` +
        `&classUIDAdmin=${encodeURIComponent(classUIDAdmin)}` +
        `&classUniqueIDAdmin=${encodeURIComponent(classUniqueIDAdmin)}`;

      // SVG icon based on AssessmentsType
      const iconDiv = document.createElement("div");
      iconDiv.className = "mr-2";

      if (lesson.AssessmentsType === "File Submission") {
        iconDiv.innerHTML = `
                        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <rect width="20" height="20" fill="#EBF6F6"/>
                            <path d="M14.349 7.80481L11.6567 5.1125C11.621 5.07679 11.5786 5.04848 11.5319 5.02918C11.4852 5.00988 11.4351 4.99996 11.3846 5H6.76923C6.56522 5 6.36956 5.08104 6.2253 5.2253C6.08104 5.36956 6 5.56522 6 5.76923V14.2308C6 14.4348 6.08104 14.6304 6.2253 14.7747C6.36956 14.919 6.56522 15 6.76923 15H13.6923C13.8963 15 14.092 14.919 14.2362 14.7747C14.3805 14.6304 14.4615 14.4348 14.4615 14.2308V8.07692C14.4616 8.0264 14.4517 7.97636 14.4324 7.92967C14.4131 7.88298 14.3847 7.84055 14.349 7.80481ZM11.7692 12.3077H8.69231C8.5903 12.3077 8.49247 12.2672 8.42034 12.195C8.34821 12.1229 8.30769 12.0251 8.30769 11.9231C8.30769 11.8211 8.34821 11.7232 8.42034 11.6511C8.49247 11.579 8.5903 11.5385 8.69231 11.5385H11.7692C11.8712 11.5385 11.9691 11.579 12.0412 11.6511C12.1133 11.7232 12.1538 11.8211 12.1538 11.9231C12.1538 12.0251 12.1133 12.1229 12.0412 12.195C11.9691 12.2672 11.8712 12.3077 11.7692 12.3077ZM11.7692 10.7692H8.69231C8.5903 10.7692 8.49247 10.7287 8.42034 10.6566C8.34821 10.5845 8.30769 10.4866 8.30769 10.3846C8.30769 10.2826 8.34821 10.1848 8.42034 10.1127C8.49247 10.0405 8.5903 10 8.69231 10H11.7692C11.8712 10 11.9691 10.0405 12.0412 10.1127C12.1133 10.1848 12.1538 10.2826 12.1538 10.3846C12.1538 10.4866 12.1133 10.5845 12.0412 10.6566C11.9691 10.7287 11.8712 10.7692 11.7692 10.7692ZM11.3846 8.07692V5.96154L13.5 8.07692H11.3846Z" fill="#007C8F"/>
                        </svg>
`;
      } else if (lesson.AssessmentsType === "Comment Submission") {
        iconDiv.innerHTML = `
                        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <rect width="20" height="20" fill="#EBF6F6"/>
                            <path d="M10 5C8.67436 5.00146 7.40344 5.52871 6.46607 6.46607C5.52871 7.40344 5.00146 8.67436 5 10V14.2C5 14.4122 5.08429 14.6157 5.23431 14.7657C5.38434 14.9157 5.58783 15 5.8 15H10C11.3261 15 12.5979 14.4732 13.5355 13.5355C14.4732 12.5979 15 11.3261 15 10C15 8.67392 14.4732 7.40215 13.5355 6.46447C12.5979 5.52678 11.3261 5 10 5ZM7.8 10.8C7.68133 10.8 7.56533 10.7648 7.46666 10.6989C7.36799 10.633 7.29108 10.5392 7.24567 10.4296C7.20026 10.32 7.18838 10.1993 7.21153 10.0829C7.23468 9.96656 7.29182 9.85965 7.37574 9.77574C7.45965 9.69182 7.56656 9.63468 7.68295 9.61153C7.79933 9.58838 7.91997 9.60026 8.02961 9.64567C8.13925 9.69108 8.23295 9.76799 8.29888 9.86666C8.36481 9.96533 8.4 10.0813 8.4 10.2C8.4 10.3591 8.33679 10.5117 8.22426 10.6243C8.11174 10.7368 7.95913 10.8 7.8 10.8ZM10 10.8C9.88133 10.8 9.76533 10.7648 9.66666 10.6989C9.56799 10.633 9.49109 10.5392 9.44567 10.4296C9.40026 10.32 9.38838 10.1993 9.41153 10.0829C9.43468 9.96656 9.49182 9.85965 9.57574 9.77574C9.65965 9.69182 9.76656 9.63468 9.88295 9.61153C9.99933 9.58838 10.12 9.60026 10.2296 9.64567C10.3392 9.69108 10.433 9.76799 10.4989 9.86666C10.5648 9.96533 10.6 10.0813 10.6 10.2C10.6 10.3591 10.5368 10.5117 10.4243 10.6243C10.3117 10.7368 10.1591 10.8 10 10.8ZM12.2 10.8C12.0813 10.8 11.9653 10.7648 11.8667 10.6989C11.768 10.633 11.6911 10.5392 11.6457 10.4296C11.6003 10.32 11.5884 10.1993 11.6115 10.0829C11.6347 9.96656 11.6918 9.85965 11.7757 9.77574C11.8596 9.69182 11.9666 9.63468 12.0829 9.61153C12.1993 9.58838 12.32 9.60026 12.4296 9.64567C12.5392 9.69108 12.633 9.76799 12.6989 9.86666C12.7648 9.96533 12.8 10.0813 12.8 10.2C12.8 10.3591 12.7368 10.5117 12.6243 10.6243C12.5117 10.7368 12.3591 10.8 12.2 10.8Z" fill="#007C8F"/>
                        </svg>
                    `;
      } else {
        iconDiv.innerHTML = `
                        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <rect width="20" height="20" fill="#EBF6F6"/>
                            <path d="M14.349 7.80481L11.6567 5.1125C11.621 5.07679 11.5786 5.04848 11.5319 5.02918C11.4852 5.00988 11.4351 4.99996 11.3846 5H6.76923C6.56522 5 6.36956 5.08104 6.2253 5.2253C6.08104 5.36956 6 5.56522 6 5.76923V14.2308C6 14.4348 6.08104 14.6304 6.2253 14.7747C6.36956 14.919 6.56522 15 6.76923 15H13.6923C13.8963 15 14.092 14.919 14.2362 14.7747C14.3805 14.6304 14.4615 14.4348 14.4615 14.2308V8.07692C14.4616 8.0264 14.4517 7.97636 14.4324 7.92967C14.4131 7.88298 14.3847 7.84055 14.349 7.80481ZM11.7692 12.3077H8.69231C8.5903 12.3077 8.49247 12.2672 8.42034 12.195C8.34821 12.1229 8.30769 12.0251 8.30769 11.9231C8.30769 11.8211 8.34821 11.7232 8.42034 11.6511C8.49247 11.579 8.5903 11.5385 8.69231 11.5385H11.7692C11.8712 11.5385 11.9691 11.579 12.0412 11.6511C12.1133 11.7232 12.1538 11.8211 12.1538 11.9231C12.1538 12.0251 12.1133 12.1229 12.0412 12.195C11.9691 12.2672 11.8712 12.3077 11.7692 12.3077ZM11.7692 10.7692H8.69231C8.5903 10.7692 8.49247 10.7287 8.42034 10.6566C8.34821 10.5845 8.30769 10.4866 8.30769 10.3846C8.30769 10.2826 8.34821 10.1848 8.42034 10.1127C8.49247 10.0405 8.5903 10 8.69231 10H11.7692C11.8712 10 11.9691 10.0405 12.0412 10.1127C12.1133 10.1848 12.1538 10.2826 12.1538 10.3846C12.1538 10.4866 12.1133 10.5845 12.0412 10.6566C11.9691 10.7287 11.8712 10.7692 11.7692 10.7692ZM11.3846 8.07692V5.96154L13.5 8.07692H11.3846Z" fill="#007C8F"/>
                        </svg>
`;
      }

      const leftDiv = document.createElement("div");
      leftDiv.className =
        "flex-col justify-start items-start gap-2 flex flex-1";
      const nameDiv = document.createElement("div");
      nameDiv.className = "text-dark  sub";
      nameDiv.textContent = `${lesson.Module_Module_Name}, ${
        lesson.AssessmentsName || ""
      }`;
      leftDiv.appendChild(nameDiv);
      const rowDiv = document.createElement("div");
      rowDiv.className = "justify-start items-center gap-2 flex";
      const assignmentsInfoDiv = document.createElement("div");
      assignmentsInfoDiv.className = "justify-start items-center gap-1.5 flex";
      assignmentsInfoDiv.innerHTML = `<svg width="10" height="10" viewBox="0 0 10 10" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M9.16667 0H0.833333C0.61232 0 0.400358 0.0877973 0.244078 0.244078C0.0877973 0.400358 0 0.61232 0 0.833333V9.16667C0 9.38768 0.0877973 9.59964 0.244078 9.75592C0.400358 9.9122 0.61232 10 0.833333 10H9.16667C9.38768 10 9.59964 9.9122 9.75592 9.75592C9.9122 9.59964 10 9.38768 10 9.16667V0.833333C10 0.61232 9.9122 0.400358 9.75592 0.244078C9.59964 0.0877973 9.38768 0 9.16667 0ZM4.46146 6.12813L2.79479 7.79479C2.75609 7.83353 2.71014 7.86426 2.65956 7.88523C2.60898 7.9062 2.55476 7.91699 2.5 7.91699C2.44524 7.91699 2.39102 7.9062 2.34044 7.88523C2.28986 7.86426 2.24391 7.83353 2.20521 7.79479L1.37187 6.96146C1.29369 6.88327 1.24977 6.77724 1.24977 6.66667C1.24977 6.5561 1.29369 6.45006 1.37187 6.37187C1.45006 6.29369 1.5561 6.24977 1.66667 6.24977C1.77723 6.24977 1.88327 6.29369 1.96146 6.37187L2.5 6.91094L3.87187 5.53854C3.95006 5.46036 4.0561 5.41643 4.16667 5.41643C4.27724 5.41643 4.38328 5.46036 4.46146 5.53854C4.53964 5.61672 4.58356 5.72276 4.58356 5.83333C4.58356 5.9439 4.53964 6.04994 4.46146 6.12813ZM4.46146 2.79479L2.79479 4.46146C2.75609 4.5002 2.71014 4.53093 2.65956 4.5519C2.60898 4.57287 2.55476 4.58366 2.5 4.58366C2.44524 4.58366 2.39102 4.57287 2.34044 4.5519C2.28986 4.53093 2.24391 4.5002 2.20521 4.46146L1.37187 3.62813C1.33316 3.58941 1.30245 3.54345 1.2815 3.49287C1.26055 3.44229 1.24977 3.38808 1.24977 3.33333C1.24977 3.22276 1.29369 3.11672 1.37187 3.03854C1.45006 2.96036 1.5561 2.91644 1.66667 2.91644C1.77723 2.91644 1.88327 2.96036 1.96146 3.03854L2.5 3.5776L3.87187 2.20521C3.95006 2.12702 4.0561 2.0831 4.16667 2.0831C4.27724 2.0831 4.38328 2.12702 4.46146 2.20521C4.53964 2.28339 4.58356 2.38943 4.58356 2.5C4.58356 2.61057 4.53964 2.71661 4.46146 2.79479ZM8.33333 7.08333H5.83333C5.72283 7.08333 5.61685 7.03943 5.5387 6.96129C5.46057 6.88315 5.41667 6.77717 5.41667 6.66667C5.41667 6.55616 5.46057 6.45018 5.5387 6.37204C5.61685 6.2939 5.72283 6.25 5.83333 6.25H8.33333C8.44384 6.25 8.54982 6.2939 8.62796 6.37204C8.7061 6.45018 8.75 6.55616 8.75 6.66667C8.75 6.77717 8.7061 6.88315 8.62796 6.96129C8.54982 7.03943 8.44384 7.08333 8.33333 7.08333ZM8.33333 3.75H5.83333C5.72283 3.75 5.61685 3.7061 5.5387 3.62796C5.46057 3.54982 5.41667 3.44384 5.41667 3.33333C5.41667 3.22283 5.46057 3.11685 5.5387 3.03871C5.61685 2.96057 5.72283 2.91667 5.83333 2.91667H8.33333C8.44384 2.91667 8.54982 2.96057 8.62796 3.03871C8.7061 3.11685 8.75 3.22283 8.75 3.33333C8.75 3.44384 8.7061 3.54982 8.62796 3.62796C8.54982 3.7061 8.44384 3.75 8.33333 3.75Z" fill="#007C8F"/></svg><div class="text-dark extra-small-text serif line-clamp-1">${
        lesson.submissionTotalCount || 0
      } Submissions</div>`;
      rowDiv.appendChild(assignmentsInfoDiv);
      const dotDiv = document.createElement("div");
      dotDiv.className = "w-1 h-1 bg-[#007b8e] rounded-full";
      rowDiv.appendChild(dotDiv);
      const dueDateDiv = document.createElement("div");
      dueDateDiv.className = "justify-start items-center gap-1.5 flex";
      dueDateDiv.innerHTML = `<svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M9.96154 1.76923H8.80769V1.38462C8.80769 1.28261 8.76717 1.18478 8.69504 1.11265C8.62291 1.04052 8.52508 1 8.42308 1C8.32107 1 8.22324 1.04052 8.15111 1.11265C8.07898 1.18478 8.03846 1.28261 8.03846 1.38462V1.76923H4.19231V1.38462C4.19231 1.28261 4.15179 1.18478 4.07966 1.11265C4.00753 1.04052 3.9097 1 3.80769 1C3.70569 1 3.60786 1.04052 3.53573 1.11265C3.4636 1.18478 3.42308 1.28261 3.42308 1.38462V1.76923H2.26923C2.06522 1.76923 1.86956 1.85027 1.7253 1.99453C1.58104 2.13879 1.5 2.33445 1.5 2.53846V10.2308C1.5 10.4348 1.58104 10.6304 1.7253 10.7747C1.86956 10.919 2.06522 11 2.26923 11H9.96154C10.1656 11 10.3612 10.919 10.5055 10.7747C10.6497 10.6304 10.7308 10.4348 10.7308 10.2308V2.53846C10.7308 2.33445 10.6497 2.13879 10.5055 1.99453C10.3612 1.85027 10.1656 1.76923 9.96154 1.76923ZM6.11538 8.30769C5.96325 8.30769 5.81452 8.26258 5.68802 8.17805C5.56152 8.09353 5.46293 7.97339 5.40471 7.83283C5.34649 7.69228 5.33125 7.53761 5.36093 7.38839C5.39062 7.23918 5.46388 7.10211 5.57146 6.99453C5.67904 6.88695 5.8161 6.81369 5.96532 6.78401C6.11453 6.75433 6.2692 6.76956 6.40976 6.82779C6.55032 6.88601 6.67045 6.9846 6.75498 7.1111C6.8395 7.2376 6.88462 7.38632 6.88462 7.53846C6.88462 7.74247 6.80357 7.93813 6.65931 8.08239C6.51505 8.22665 6.3194 8.30769 6.11538 8.30769ZM9.96154 4.07692H2.26923V2.53846H3.42308V2.92308C3.42308 3.02508 3.4636 3.12291 3.53573 3.19504C3.60786 3.26717 3.70569 3.30769 3.80769 3.30769C3.9097 3.30769 4.00753 3.26717 4.07966 3.19504C4.15179 3.12291 4.19231 3.02508 4.19231 2.92308V2.53846H8.03846V2.92308C8.03846 3.02508 8.07898 3.12291 8.15111 3.19504C8.22324 3.26717 8.32107 3.30769 8.42308 3.30769C8.52508 3.30769 8.62291 3.26717 8.69504 3.19504C8.76717 3.12291 8.80769 3.02508 8.80769 2.92308V2.53846H9.96154V4.07692Z" fill="#FF394E"/></svg><div class="text-dark extra-small-text serif line-clamp-1">${
        dueDate ? formatDueString(dueDate) : "No Due Date"
      }</div>`;
      leftDiv.prepend(iconDiv);
      rowDiv.appendChild(dueDateDiv);
      leftDiv.appendChild(rowDiv);
      assignmentDiv.appendChild(leftDiv);
      const link = document.createElement("div");
      assignmentDiv.appendChild(link);
      link.className = "chevronRight";

      container.appendChild(assignmentDiv);
    });
  } catch (error) {}
}

const debouncedLoadAssignments = debounce(() => {
  loadAssignments();
}, 300);

document
  .getElementById("searchAssignments")
  .addEventListener("input", function (e) {
    searchQuery = e.target.value.trim();
    debouncedLoadAssignments();
  });

document.getElementById("sortLatest").addEventListener("click", function () {
  currentOrderBy = [{ path: ["created_at"], type: "desc" }];
  this.classList.add("primaryButton", "text-white");
  this.classList.remove("faintButton", "text-dark");
  document
    .getElementById("sortOldest")
    .classList.add("faintButton", "text-dark");
  document
    .getElementById("sortOldest")
    .classList.remove("primaryButton", "text-white");
  loadAssignments();
});

document.getElementById("sortOldest").addEventListener("click", function () {
  currentOrderBy = [{ path: ["created_at"], type: "asc" }];
  this.classList.add("primaryButton", "text-white");
  this.classList.remove("faintButton", "text-dark");
  document
    .getElementById("sortLatest")
    .classList.add("faintButton", "text-dark");
  document
    .getElementById("sortLatest")
    .classList.remove("primaryButton", "text-white");
  loadAssignments();
});
