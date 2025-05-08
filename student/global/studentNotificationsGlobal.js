// get created at date to  get notifications only after user has enrolled
let createdAt;
var dateElements = document.querySelectorAll("[data-date-enrolled]");
var dates = [];
dateElements.forEach(function (el) {
    var timestamp = parseInt(el.getAttribute("data-date-enrolled"), 10);
    if (!isNaN(timestamp)) {
        dates.push(timestamp);
    }
});
if (dates.length > 0) {
    createdAt = Math.min.apply(null, dates);
    window.earliestEnrollmentDate = createdAt;
}


//Set user preferences
const POSTS_TYPE =
    user_Preference_Posts === "Yes" || user_Preference_Post_Mentions === "Yes"
        ? "Posts"
        : "";
const POST_COMMENTS_TYPE =
    user_Preference_Comments_On_My_Posts === "Yes" ||
        user_Preference_Post_Comments === "Yes" ||
        user_Preference_Post_Comment_Mentions === "Yes"
        ? "Post Comments"
        : "";
const ANNOUNCEMENTS_TYPE =
    user_Preference_Announcements === "Yes" ||
        user_Preference_Announcement_Mentions === "Yes"
        ? "Announcements"
        : "";
const ANNOUNCEMENT_COMMENTS_TYPE =
    user_Preference_Comments_On_My_Announcements === "Yes" ||
        user_Preference_Announcement_Comments === "Yes" ||
        user_Preference_Announcement_Comment_Mentions === "Yes"
        ? "Announcement Comments"
        : "";
const SUBMISSIONS_TYPE =
    user_Preference_Submissions === "Yes" ||
        user_Preference_Submission_Mentions === "Yes"
        ? "Submissions"
        : "";
const SUBMISSION_COMMENTS_TYPE =
    user_Preference_Comments_On_My_Submissions === "Yes" ||
        user_Preference_Submission_Comments === "Yes" ||
        user_Preference_Submission_Comment_Mentions === "Yes"
        ? "Submission Comments"
        : "";
const fetchUserDate =
    user_Preference_Turn_Off_All_Notifications === "Yes"
        ? ` { andWhere: { created_at: "${Turn_Off_All_Notifications_Time_Unix}" } }`
        : "";
//Het eid from lesson UIs
async function getEnrolmentIdsByLessonUid(lessonUid, activeOrInactive) {
    const query = `
    query getEnrolment {
      getEnrolment(
        query: [
          { where: { student_id: ${CONTACTss_ID} } }
          {
            andWhere: {
              Class: [
                {
                  where: {
                     ${activeOrInactive}: [
                      {
                        where: {
                          Lessons: [
                            { where: { unique_id: "${lessonUid}" } }
                          ]
                        }
                      }
                    ]
                  }
                }
              ]
            }
          }
        ]
      ) {
        ID: id
      }
    }
  `;

    const response = await fetch(graphQlApiEndpointUrlAwc, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Api-Key": graphQlApiKeyAwc
        },
        body: JSON.stringify({ query })
    });

    const result = await response.json();
    return result?.data?.getEnrolment?.ID ? [result.data.getEnrolment.ID] : [];
}

// Get the eid from the courseUid
async function getEnrolmentIdsByCourseUid(courseUid, activeOrInactive) {
    const query = `
    query getEnrolment {
      getEnrolment(
        query: [
          { where: { student_id: ${CONTACTss_ID} } }
          {
            andWhere: {
              Class: [
                {
                  where: {
                    ${activeOrInactive}: [
                      { where: { unique_id: "${courseUid}" } }
                    ]
                  }
                }
              ]
            }
          }
        ]
      ) {
        ID: id
      }
    }
  `;

    const response = await fetch(graphQlApiEndpointUrlAwc, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Api-Key": graphQlApiKeyAwc
        },
        body: JSON.stringify({ query })
    });

    const result = await response.json();
    return result?.data?.getEnrolment?.ID ? [result.data.getEnrolment.ID] : [];
}


// let SUBSCRIPTION_QUERY = `
// subscription subscribeToCalcAnnouncements(
//   $class_id: AwcClassID
// ) {
//    subscribeToCalcAnnouncements(
//     query: [
//       { where: { class_id: $class_id } }
// 	 ${fetchUserDate}
//       {
//         andWhereGroup: [
//           {
//             whereGroup: [
//               { where: { notification__type: "${POSTS_TYPE}" } }
//               {
//                 andWhere: {
//                   Post: [
//                     {
//                       where: {
//                         author_id: ${CONTACTss_ID}
//                         _OPERATOR_: neq
//                       }
//                     }
//                   ]
//                 }
//               }
//             ]
//           }
//           {
//             orWhereGroup: [
//               { where: { notification__type: "${POST_COMMENTS_TYPE}" } }
//               {
//                 andWhere: {
//                   Comment: [
//                     {
//                       where: {
//                         author_id: ${CONTACTss_ID}
//                         _OPERATOR_: neq
//                       }
//                     }
//                   ]
//                 }
//               }
//             ]
//           }
//           {
//             orWhereGroup: [
//               { where: { notification__type: "${ANNOUNCEMENTS_TYPE}" } }
//             ]
//           }
//           {
//             orWhereGroup: [
//               { where: { notification__type: "${ANNOUNCEMENT_COMMENTS_TYPE}" } }
//               {
//                 andWhere: {
//                   Comment: [
//                     {
//                       where: {
//                         author_id: ${CONTACTss_ID}
//                         _OPERATOR_: neq
//                       }
//                     }
//                   ]
//                 }
//               }
//             ]
//           }
//           {
//             orWhereGroup: [
//               { where: { notification__type: "${SUBMISSIONS_TYPE}" } }
//                  {
//                   andWhere: {
//                     Submissions: [
//                       {
//                         where: {
//                           Student: [
//                             {
//                               where: {
//                                 Student: [
//                                   {
//                                     where: { id:  ${CONTACTss_ID}, _OPERATOR_: neq }
//                                   }
//                                 ]
//                               }
//                             }
//                           ]
//                         }
//                       }
//                       {
//                         andWhere: {
//                           Assessment: [
//                             { where: { private_submission: false } }
//                           ]
//                         }
//                       }
//                     ]
//                   }
//                 }
//             ]
//           }
//           {
//             orWhereGroup: [
//               { where: { notification__type: "${SUBMISSION_COMMENTS_TYPE}" } }
//               {
//                 andWhere: {
//                   Submissions: [
//                     {
//                       where: {
//                         ForumComments: [
//                           {
//                             where: {
//                               author_id: ${CONTACTss_ID}
//                               _OPERATOR_: neq
//                             }
//                           }
//                         ]
//                       }
//                     }
//                   ]
//                 }
//               }
//             ]
//           }
// 		]
//       }                
//     ]
//     orderBy: [{ path: ["created_at"], type: asc }] 
//     limit: 5000
//     offset: 0
//   ) {
//     ID: field(arg: ["id"]) 
//     Class_ID: field(arg: ["class_id"]) 
//     Class_Class_Name: field(arg: ["Class", "class_name"]) 
//     EnrolmentID: field(arg: ["Class", "Enrolments", "id"]) 
//     Course_Unique_ID: field(arg: ["Class", "Active_Course", "unique_id"]) 
//     Course_Course_Name: field(arg: ["Class", "Active_Course", "course_name"]) 
//     Course_Unique_ID_NotActive: field(arg: ["Class", "Course", "unique_id"])
//      Course_Name_NotActive: field(arg: ["Class", "Course", "course_name"])
//     Course_Course_Name_NotActive: field(arg: ["Class", "Course", "course_name"]) 
//     Comment_ID: field(arg: ["comment_id"]) 
//     Content: field(arg: ["content"]) 
//     Course_ID: field(arg: ["course_id"])  
//     Notification_Type: field(arg: ["notification__type"])
//     Date_Added: field(arg: ["created_at"]) 
//     Instructor_ID: field(arg: ["instructor_id"]) 
//     Post_ID: field(arg: ["post_id"]) 
//     Contact_Display_Name: field(arg: ["Post", "Author", "display_name"]) 
//     Contact_First_Name: field(arg: ["Post", "Author", "first_name"]) 
//     Contact_Last_Name: field(arg: ["Post", "Author", "last_name"]) 
//     Contact_Display_Name1: field(arg: ["Post", "Mentions", "display_name"]) 
//     Contact_First_Name1: field(arg: ["Post", "Mentions", "first_name"]) 
//     Contact_Last_Name1: field(arg: ["Post", "Mentions", "last_name"])  
//     Contact_Contact_ID: field(arg: ["Post", "Mentions", "id"])  
//     Mentions_Contact_ID: field(arg: ["Mentions", "id"]) 
//     Status: field(arg: ["status"]) 
//     Submissions_ID: field(arg: ["submissions_id"]) 
//     Title: field(arg: ["title"]) 
//     Type: field(arg: ["type"]) 
//     Unique_ID: field(arg: ["unique_id"]) 
//     Post_Author_ID: field(arg: ["Post", "author_id"]) 
//     Enrolment_Student_ID: field(arg: ["Submissions", "Student", "student_id"]) 
//     Comment_Author_ID: field(arg: ["Comment", "author_id"]) 
//     Lesson_Unique_ID1: field(arg: ["Submissions", "Announcements", "Course", "Lessons", "unique_id"])   
//     Lesson_Unique_ID5: field(
//       arg: [
//         "Class"
//         "Active_Course"
//         "Lessons"
//         "unique_id"
//       ]
//     )  
//         Lesson_Unique_ID_For_Submission: field(
//       arg: [
//         "Submissions"
//         "Assessment"
//         "Lesson"
//         "unique_id"
//       ]
//     )
//     Instructor_Display_Name: field(arg: ["Instructor", "display_name"]) 
//     Instructor_First_Name: field(arg: ["Instructor", "first_name"]) 
//     Instructor_Last_Name: field(arg: ["Instructor", "last_name"]) 
//     Contact_Contact_ID1: field(arg: ["Comment", "Mentions", "id"]) 
//     Contact_Display_Name2: field(arg: ["ForumComments", "Author","display_name"]) 
//     Contact_First_Name2: field(arg: ["Comment", "Forum_Post", "Author", "first_name"]) 
//     Contact_Last_Name2: field(arg: ["Comment", "Forum_Post", "Author", "last_name"]) 
//     ForumPost_Author_ID: field(arg: ["Comment", "Forum_Post", "author_id"]) 
//     Contact_Contact_IDSubmission: field(arg: ["Submissions", "Submission_Mentions", "id"])   
//   	SubEnrolment_Student_ID: field(arg: ["Submissions", "Student", "student_id"]) 
//     SubContact_Display_Name: field(arg: ["Submissions""Student""Student""display_name"]) 
//     SubContact_First_Name: field(arg: ["Submissions""Student""Student""first_name"]) 
//     SubContact_Last_Name: field(arg: ["Submissions""Student""Student""last_name"])  
//     Contact_Display_Name5: field(arg: ["Submissions""ForumComments""Author""display_name"])  
//     Contact_First_Name5: field(arg: ["Submissions""ForumComments""Author""first_name"]) 
//     Contact_Last_Name5: field(arg: ["Submissions""ForumComments""Author""last_name"])  
// 	  AnnContact_Display_Name: field(arg: ["ForumComments", "Author", "display_name"]) 
//     AnnContact_First_Name1: field(arg: ["ForumComments", "Author", "first_name"]) 
//     AnnContact_Last_Name: field(arg: ["ForumComments", "Author", "last_name"]) 
//   	AnnouncementContact_Contact_ID: field(arg: ["Comment", "Mentions", "id"]) 
// 	  Announcement_Instructor_ID: field(arg: ["ForumComments""Parent_Announcement""instructor_id"]) 
//     CommentContact_Display_Name: field(arg: ["Comment", "Author", "display_name"]) 
//     CommentContact_First_Name: field(arg: ["Comment", "Author", "first_name"]) 
//     CommentContact_Last_Name: field(arg: ["Comment", "Author", "last_name"]) 
//     ForumComments_Parent_Announcement_ID: field(arg: ["Comment", "parent_announcement_id"]) 
//         Read_Contacts_Data_Read_Announcement_ID: field(
//       arg: ["Read_Contacts_Data", "read_announcement_id"]
//     )
//     Read_Contacts_Data_Read_Contact_ID: field(
//       arg: ["Read_Contacts_Data", "read_contact_id"]
//     )
//   }
// }
// `;
// ✅ 1. Updated SUBSCRIPTION_QUERY using subscribeToAnnouncements
let SUBSCRIPTION_QUERY = `
subscription subscribeToAnnouncements(
  $class_ids: [AwcClassID]
) {
   subscribeToAnnouncements(
    query: [
      { where: { class_id: { _IN_: $class_ids } } }
      {
        andWhereGroup: [
          {
            whereGroup: [
              {
                where: {
                  notification__type: "${POSTS_TYPE}"
                }
              }
              {
                andWhere: {
                  Post: [
                    {
                      where: {
                        author_id:  ${CONTACTss_ID}
                        _OPERATOR_: neq
                      }
                    }
                  ]
                }
              }
            ]
          }
          {
            orWhereGroup: [
              {
                where: {
                  notification__type: "${POST_COMMENTS_TYPE}"
                }
              }
              {
                andWhere: {
                  Comment: [
                    {
                      where: {
                        author_id:  ${CONTACTss_ID}
                        _OPERATOR_: neq
                      }
                    }
                  ]
                }
              }
            ]
          }
          {
            orWhereGroup: [
              {
                where: {
                  notification__type: "${ANNOUNCEMENTS_TYPE}"
                }
              }
            ]
          }
          {
            orWhereGroup: [
              {
                where: {
                  notification__type: "${ANNOUNCEMENT_COMMENTS_TYPE}"
                }
              }
              {
                andWhere: {
                  Comment: [
                    {
                      where: {
                        author_id:  ${CONTACTss_ID}
                        _OPERATOR_: neq
                      }
                    }
                  ]
                }
              }
            ]
          }
          {
            orWhereGroup: [
              {
                where: {
                  notification__type: "${SUBMISSIONS_TYPE}"
                }
              }
              {
                andWhere: {
                  Submissions: [
                    {
                      where: {
                        Student: [
                          {
                            where: {
                              Student: [
                                {
                                  where: {
                                    id:  ${CONTACTss_ID}
                                    _OPERATOR_: neq
                                  }
                                }
                              ]
                            }
                          }
                        ]
                      }
                    }
                    {
                      andWhere: {
                        Assessment: [
                          {
                            where: {
                              private_submission: false
                            }
                          }
                        ]
                      }
                    }
                  ]
                }
              }
            ]
          }
          {
            orWhereGroup: [
              {
                where: {
                  notification__type: "${SUBMISSION_COMMENTS_TYPE}"
                }
              }
              {
                andWhere: {
                  Submissions: [
                    {
                      where: {
                        ForumComments: [
                          {
                            where: {
                              author_id:  ${CONTACTss_ID}
                              _OPERATOR_: neq
                            }
                          }
                        ]
                      }
                    }
                  ]
                }
              }
            ]
          }
        ]
      }
    ]
    limit: $limit
    offset: $offset
    orderBy: [{ path: ["created_at"], type: asc }]
  )  {
    ID: field(arg: ["id"])
    Class_ID: field(arg: ["class_id"])
    Comment_ID: field(arg: ["comment_id"])
    Content: field(arg: ["content"])
    Course_ID: field(arg: ["course_id"])
    Notification_Type: field(arg: ["notification__type"])
    Date_Added: field(arg: ["created_at"])
    Instructor_ID: field(arg: ["instructor_id"])
    Post_ID: field(arg: ["post_id"])
    Status: field(arg: ["status"])
    Submissions_ID: field(arg: ["submissions_id"])
    Title: field(arg: ["title"])
    Type: field(arg: ["type"])
    Unique_ID: field(arg: ["unique_id"])
    Class {
      class_name
      Enrolments { id }
      Active_Course {
        unique_id
        course_name
        Lessons { unique_id }
      }
      Course {
        unique_id
        course_name
      }
    }
    Post {
      author_id
      Author { display_name first_name last_name }
      Mentions { display_name first_name last_name id }
    }
    Mentions { id }
    Submissions {
      Student {
        student_id
        Student { display_name first_name last_name }
      }
      Announcements { Course { Lessons { unique_id } } }
      Assessment { Lesson { unique_id } }
      Submission_Mentions { id }
      ForumComments { Author { display_name first_name last_name } }
    }
    Comment {
      author_id
      parent_announcement_id
      Mentions { id }
      Forum_Post {
        author_id
        Author { first_name last_name }
      }
      Author { display_name first_name last_name }
    }
    Instructor { display_name first_name last_name }
    ForumComments {
      Author { display_name first_name last_name }
      Parent_Announcement { instructor_id }
    }
    Read_Contacts_Data {
      read_announcement_id
      read_contact_id
    }
  }
}`;

const MARK_READ_MUTATION = `
mutation createOReadContactReadAnnouncement($payload: OReadContactReadAnnouncementCreateInput = null) {
createOReadContactReadAnnouncement(payload: $payload) {
Read_Announcement_ID: read_announcement_id 
Read_Contact_ID: read_contact_id 
}
}
`;

const container = document.getElementById("parentNotificationTemplatesInBody");
const displayedNotifications = new Set();
const readAnnouncements = new Set();
const pendingAnnouncements = new Set();
const cardMap = new Map();
const notificationIDs = new Set();
const notificationData = [];

function getQueryParamss(param) {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(param);
}
const enrollID = getQueryParamss("eid");

function timeAgo(unixTimestamp) {
    const now = new Date();
    const date = new Date(unixTimestamp * 1000);
    const seconds = Math.floor((now - date) / 1000);
    let interval = Math.floor(seconds / 31536000);
    if (interval >= 1)
        return interval + " year" + (interval > 1 ? "s" : "") + " ago";
    interval = Math.floor(seconds / 2592000);
    if (interval >= 1)
        return interval + " month" + (interval > 1 ? "s" : "") + " ago";
    interval = Math.floor(seconds / 86400);
    if (interval >= 1)
        return interval + " day" + (interval > 1 ? "s" : "") + " ago";
    interval = Math.floor(seconds / 3600);
    if (interval >= 1)
        return interval + " hour" + (interval > 1 ? "s" : "") + " ago";
    interval = Math.floor(seconds / 60);
    if (interval >= 1)
        return interval + " min" + (interval > 1 ? "s" : "") + " ago";
    return "Just now";
}

let cachedClassIds = null;
let socketConnections = new Map();

async function fetchClassIds() {
    if (cachedClassIds !== null) return cachedClassIds;
        const query = `
    query calcEnrolments {
      calcEnrolments(
        query: [
          { where: { student_id: ${loggedInContactIdIntAwc} } }
        ]
      ) {
        Class_ID: field(arg: ["class_id"])
      }
    }
  `;
    try {
        const response = await fetch(graphQlApiEndpointUrlAwc, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Api-Key": graphQlApiKeyAwc,
            },
            body: JSON.stringify({ query }),
        });
        const result = await response.json();
        if (result.data && result.data.calcEnrolments) {
            cachedClassIds = result.data.calcEnrolments.map(
                (enrolment) => enrolment.Class_ID
            );
            return cachedClassIds;
        }
        return [];
    } catch (error) {
        return [];
    }
}

// async function initializeSocket() {
//     if (document.hidden) return;
//     const classIds = await fetchClassIds();
//     if (!classIds || classIds.length === 0) {
//         return;
//     }
//     classIds.forEach((classId) => {
//         if (socketConnections.has(classId)) return;
//         const socket = new WebSocket(graphQlWsEndpointUrlAwc, "vitalstats");
//         let keepAliveInterval;
//         socket.onopen = () => {
//             keepAliveInterval = setInterval(() => {
//                 if (socket.readyState === WebSocket.OPEN) {
//                     socket.send(JSON.stringify({ type: "KEEP_ALIVE" }));
//                 }
//             }, 28000);
//             socket.send(JSON.stringify({ type: "connection_init" }));
//             socket.send(
//                 JSON.stringify({
//                     id: `subscription_${classId}`,
//                     type: "GQL_START",
//                     payload: {
//                         query: SUBSCRIPTION_QUERY,
//                         variables: {
//                             author_id: loggedInContactIdIntAwc,
//                             id: loggedInContactIdIntAwc,
//                             class_id: classId,
//                             created_at: createdAt,
//                         },
//                     },
//                 })
//             );
//         };
//         socket.onmessage = (event) => {
//             const data = JSON.parse(event.data);
//             if (data.type !== "GQL_DATA") return;
//             if (!data.payload || !data.payload.data) return;
//             const result = data.payload.data.subscribeToCalcAnnouncements;
//             if (!result) return;
//             const notifications = Array.isArray(result) ? result : [result];
//             notifications.forEach((notification) => {
//                 if (
//                     notification.Read_Contacts_Data_Read_Announcement_ID &&
//                     Number(notification.Read_Contacts_Data_Read_Contact_ID) ===
//                     Number(loggedInContactIdIntAwc)
//                 ) {
//                     readAnnouncements.add(Number(notification.ID));
//                 }
//             });
//             const filteredNotifications = notifications.filter((notification) => {
//                 const userId = Number(loggedInContactIdIntAwc);
//                 switch (notification.Notification_Type) {
//                     case "Posts":
//                         if (
//                             (user_Preference_Posts === "Yes" &&
//                                 notification.Post_Author_ID === userId) ||
//                             (user_Preference_Post_Mentions === "Yes" &&
//                                 notification.Contact_Contact_ID === userId)
//                         ) {
//                             return false;
//                         }
//                         break;
//                     case "Post Comments":
//                         if (
//                             (user_Preference_Post_Comments === "Yes" &&
//                                 notification.Comment_Author_ID === userId) ||
//                             (user_Preference_Post_Comment_Mentions === "Yes" &&
//                                 notification.Contact_Contact_ID === userId) ||
//                             (user_Preference_Comments_On_My_Posts === "Yes" &&
//                                 notification.Comment_Author_ID === userId)
//                         ) {
//                             return false;
//                         }
//                         break;
//                     case "Submissions":
//                         if (
//                             (user_Preference_Submissions === "Yes" &&
//                                 notification.Enrolment_Student_ID === userId) ||
//                             (user_Preference_Submission_Mentions === "Yes" &&
//                                 notification.Contact_Contact_ID1 === userId)
//                         ) {
//                             return false;
//                         }
//                         break;
//                     case "Submission Comments":
//                         if (
//                             (user_Preference_Submission_Comments === "Yes" &&
//                                 notification.Comment_Author_ID === userId) ||
//                             (user_Preference_Submission_Comment_Mentions === "Yes" &&
//                                 notification.Contact_Contact_ID1 === userId) ||
//                             (user_Preference_Comments_On_My_Submissions === "Yes" &&
//                                 notification.Comment_Author_ID === userId)
//                         ) {
//                             return false;
//                         }
//                         break;
//                     case "Announcements":
//                         if (
//                             (user_Preference_Announcements === "Yes" &&
//                                 notification.Instructor_ID === userId) ||
//                             (user_Preference_Announcement_Mentions === "Yes" &&
//                                 notification.Mentions_Contact_ID === userId)
//                         ) {
//                             return false;
//                         }
//                         break;
//                     case "Announcement Comments":
//                         if (
//                             (user_Preference_Announcement_Comments === "Yes" &&
//                                 notification.Comment_Author_ID === userId) ||
//                             (user_Preference_Announcement_Comment_Mentions === "Yes" &&
//                                 notification.Mentions_Contact_ID === userId) ||
//                             (user_Preference_Comments_On_My_Announcements === "Yes" &&
//                                 notification.Comment_Author_ID === userId)
//                         ) {
//                             return false;
//                         }
//                         break;
//                 }
//                 return true;
//             });
//             if (filteredNotifications.length === 0) return;
//             filteredNotifications.forEach((notification) => {
//                 notificationIDs.add(Number(notification.ID));
//                 notificationData.push(notification);
//             });

//             // Sort by created_at after adding new ones
//             notificationData.sort((a, b) => a.Date_Added - b.Date_Added);

//             // Clear UI and re-render in order
//             displayedNotifications.clear();
//             container.innerHTML = "";
//             notificationData.forEach((notification) => {
//                 if (!displayedNotifications.has(Number(notification.ID))) {
//                     processNotification(notification);
//                 }
//             });

//             updateMarkAllReadVisibility();
//         };
//         socket.onerror = (error) => { };
//         socket.onclose = () => {
//             clearInterval(keepAliveInterval);
//             socketConnections.delete(classId);
//             if (!document.hidden) {
//                 setTimeout(() => {
//                     initializeSocket();
//                 }, 28000);
//             }
//         };
//         socketConnections.set(classId, { socket, keepAliveInterval });
//     });
// }
// ✅ 2. Updated initializeSocket() to use one socket with class_ids array
async function initializeSocket() {
    if (document.hidden) return;
    const classIds = await fetchClassIds();
    if (!classIds || classIds.length === 0) return;

    const socket = new WebSocket(graphQlWsEndpointUrlAwc, "vitalstats");
    let keepAliveInterval;

    socket.onopen = () => {
        keepAliveInterval = setInterval(() => {
            if (socket.readyState === WebSocket.OPEN) {
                socket.send(JSON.stringify({ type: "KEEP_ALIVE" }));
            }
        }, 28000);

        socket.send(JSON.stringify({ type: "connection_init" }));
        socket.send(
            JSON.stringify({
                id: "multiClassSubscription",
                type: "GQL_START",
                payload: {
                    query: SUBSCRIPTION_QUERY,
                    variables: {
                        class_ids: classIds,
                    },
                },
            })
        );
    };

    socket.onmessage = (event) => {
        const data = JSON.parse(event.data);
        if (data.type !== "GQL_DATA") return;
        if (!data.payload || !data.payload.data) return;

        const result = data.payload.data.subscribeToAnnouncements;
        if (!result) return;

        const notifications = Array.isArray(result) ? result : [result];
        notifications.forEach((notification) => {
            if (
                notification.Read_Contacts_Data_Read_Announcement_ID &&
                Number(notification.Read_Contacts_Data_Read_Contact_ID) === Number(loggedInContactIdIntAwc)
            ) {
                readAnnouncements.add(Number(notification.ID));
            }
        });

        const filteredNotifications = notifications.filter((notification) => {
            const userId = Number(loggedInContactIdIntAwc);
            switch (notification.Notification_Type) {
                case "Posts":
                    return !(
                        (user_Preference_Posts === "Yes" && notification.Post_Author_ID === userId) ||
                        (user_Preference_Post_Mentions === "Yes" && notification.Contact_Contact_ID === userId)
                    );
                case "Post Comments":
                    return !(
                        (user_Preference_Post_Comments === "Yes" && notification.Comment_Author_ID === userId) ||
                        (user_Preference_Post_Comment_Mentions === "Yes" && notification.Contact_Contact_ID === userId) ||
                        (user_Preference_Comments_On_My_Posts === "Yes" && notification.Comment_Author_ID === userId)
                    );
                case "Submissions":
                    return !(
                        (user_Preference_Submissions === "Yes" && notification.Enrolment_Student_ID === userId) ||
                        (user_Preference_Submission_Mentions === "Yes" && notification.Contact_Contact_ID1 === userId)
                    );
                case "Submission Comments":
                    return !(
                        (user_Preference_Submission_Comments === "Yes" && notification.Comment_Author_ID === userId) ||
                        (user_Preference_Submission_Comment_Mentions === "Yes" && notification.Contact_Contact_ID1 === userId) ||
                        (user_Preference_Comments_On_My_Submissions === "Yes" && notification.Comment_Author_ID === userId)
                    );
                case "Announcements":
                    return !(
                        (user_Preference_Announcements === "Yes" && notification.Instructor_ID === userId) ||
                        (user_Preference_Announcement_Mentions === "Yes" && notification.Mentions_Contact_ID === userId)
                    );
                case "Announcement Comments":
                    return !(
                        (user_Preference_Announcement_Comments === "Yes" && notification.Comment_Author_ID === userId) ||
                        (user_Preference_Announcement_Comment_Mentions === "Yes" && notification.Mentions_Contact_ID === userId) ||
                        (user_Preference_Comments_On_My_Announcements === "Yes" && notification.Comment_Author_ID === userId)
                    );
                default:
                    return true;
            }
        });

        if (filteredNotifications.length === 0) return;
        filteredNotifications.forEach((notification) => {
            notificationIDs.add(Number(notification.ID));
            notificationData.push(notification);
        });

        notificationData.sort((a, b) => a.Date_Added - b.Date_Added);
        displayedNotifications.clear();
        container.innerHTML = "";
        notificationData.forEach((notification) => {
            if (!displayedNotifications.has(Number(notification.ID))) {
                processNotification(notification);
            }
        });

        updateMarkAllReadVisibility();
    };

    socket.onerror = () => { };
    socket.onclose = () => {
        clearInterval(keepAliveInterval);
        setTimeout(() => {
            if (!document.hidden) {
                initializeSocket();
            }
        }, 28000);
    };
}

document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
        socketConnections.forEach((conn) => {
            conn.socket.close();
            clearInterval(conn.keepAliveInterval);
        });
        socketConnections.clear();
    } else {
        initializeSocket();
    }
});

initializeSocket();

function createNotificationCard(notification, isRead) {
    const card = document.createElement("div");
    const notification_Type = notification.Notification_Type;
    const notification_course_name = notification.Course_Course_Name || notification.Course_Name_NotActive;
    const commentMentionID = String(notification.Contact_Contact_ID1);
    const postMentionID = String(notification.Contact_Contact_ID);
    const announcementMentionID = String(notification.Mentions_Contact_ID);
    const submissionMentionID = String(notification.Contact_Contact_IDSubmission);
    const forumPostAuthorID = String(notification.ForumPost_Author_ID);
    const announcementCommentMentionContactId = String(
        notification.AnnouncementContact_Contact_ID
    );
    const annuncementInstId = String(notification.Announcement_Instructor_ID);
    const postFullName =
        notification.Contact_Display_Name ||
        `${notification.Contact_First_Name || ""} ${notification.Contact_Last_Name || ""
            }`.trim() ||
        "Someone";
    const commentFullname =
        notification.CommentContact_Display_Name ||
        `${notification.CommentContact_First_Name || ""} ${notification.CommentContact_Last_Name || ""
            }`.trim() ||
        "Someone";
    const instructorDisplayName =
        notification.Instructor_Display_Name ||
        `${notification.Instructor_First_Name || ""} ${notification.Instructor_Last_Name || ""
            }`.trim() ||
        "Someone";
    const submissionDisplayName =
        notification.Contact_Display_Name5 ||
        `${notification.Contact_First_Name5 || ""} ${notification.Contact_Last_Name5 || ""
            }`.trim() ||
        "Someone";
    const submissitterDisplayName =
        notification.SubContact_Display_Name ||
        `${notification.SubContact_First_Name || ""} ${notification.SubContact_Last_Name || ""
            }`.trim() ||
        "Someone";
    const announcerrDisplayName =
        notification.AnnContact_Display_Name ||
        `${notification.AnnContact_First_Name1 || ""} ${notification.AnnContact_Last_Name || ""
            }`.trim() ||
        "Someone";
    let message = "";
    let messageContent = "";
    const usersId = String(loggedInContactIdIntAwc);
    if (notification_Type === "Posts") {
        if (postMentionID && postMentionID === usersId) {
            message = `${notification_course_name} - You have been mentioned in a post`;
            messageContent = `${postFullName} mentioned You in a post`;
        } else {
            message = `${notification_course_name} - A new post has been added`;
            messageContent = `${postFullName} added a new post`;
        }
    } else if (notification_Type === "Post Comments") {
        if (commentMentionID && commentMentionID === usersId) {
            message = `${notification_course_name} - You have been mentioned in a comment in a post`;
            messageContent = `${commentFullname} mentioned you in a comment in a post`;
        } else if (forumPostAuthorID && forumPostAuthorID === usersId) {
            message = `${notification_course_name} -  A comment has been added in your post`;
            messageContent = `${commentFullname} added a comment in your post`;
        } else {
            message = `${notification_course_name} - A new comment has been added in a post`;
            messageContent = `${postFullName} added a new comment in a post`;
        }
    } else if (notification_Type === "Announcements") {
        if (announcementMentionID && announcementMentionID === usersId) {
            message = `${notification_course_name} - You have been mentioned in an announcement`;
            messageContent = `${instructorDisplayName} mentioned You in an announcement`;
        } else {
            message = `${notification_course_name} - A new announcement has been added`;
            messageContent = `${instructorDisplayName} added a new announcement`;
        }
    } else if (notification_Type === "Announcement Comments") {
        if (commentMentionID && commentMentionID === usersId) {
            message = `${notification_course_name} - You have been mentioned in a comment in an announcement`;
            messageContent = `${commentFullname} mentioned you in a comment in an announcement`;
        } else if (annuncementInstId && annuncementInstId === usersId) {
            message = `${notification_course_name} -  A comment has been added in your announcement`;
            messageContent = `${commentFullname} added a comment in your announcement`;
        } else {
            message = `${notification_course_name} - A new comment has been added in an announcement`;
            messageContent = `${commentFullname} added a new comment in an announcement`;
        }
    } else if (notification_Type === "Submissions") {
        if (submissionMentionID && submissionMentionID === usersId) {
            message = `${notification_course_name} - You have been mentioned in a submission`;
            messageContent = `${submissionDisplayName} mentioned You in a submission`;
        } else {
            message = `${notification_course_name} - A new submission has been added`;
            messageContent = `${submissitterDisplayName} added a new submission`;
        }
    } else if (notification_Type === "Submission Comments") {
        if (commentMentionID && commentMentionID === usersId) {
            message = `${notification_course_name} - You have been mentioned in a comment in a submission`;
            messageContent = `${commentFullname} mentioned you in a comment in a submission`;
        } else if (forumPostAuthorID && forumPostAuthorID === usersId) {
            message = `${notification_course_name} -  A comment has been added in your submission`;
            messageContent = `${commentFullname} added a comment in your announcement`;
        } else {
            message = `${notification_course_name} - A new comment has been added in a submission`;
            messageContent = `${commentFullname} added a new comment in a submission`;
        }
    }
    card.className = "notification-card cursor-pointer";
    card.innerHTML = `
    <div data-my-id ="${notification.ID
        }" class="p-2 items-start gap-2 rounded justify-between notification-content w-full ${isRead ? "bg-white" : "bg-unread"
        } ${notification.Status === "Draft" ? "hidden" : "flex"}">
      <div class="flex flex-col gap-1">
        <div class="text-[#414042] text-xs font-semibold">
          ${message}
        </div>
        <div class="extra-small-text text-dark line-clamp-2">${messageContent}</div>
        <div class="text-[#586A80] extra-small-text">${notification_course_name}</div>
      </div>
      <div class="extra-small-text text-[#586A80] text-nowrap">${timeAgo(
            notification.Date_Added
        )}</div>
    </div>
  `;
    card.addEventListener("click", async function () {
        const id = Number(notification.ID);
        const type = notification.Notification_Type;
        const loader = document.getElementById("loader");
        const anouncementScrollId =
            String(notification.Notification_Type) !== "Announcements"
                ? notification.ForumComments_Parent_Announcement_ID
                : notification.ID;
        loader.classList.remove("fade-out");
        if (!readAnnouncements.has(id) && !pendingAnnouncements.has(id)) {
            await markAsRead(id);
        }
        if (type === "Posts" || type === "Post Comments") {
            const courseUid = notification.Course_Unique_ID || notification.Course_Unique_ID_NotActive;
            const activeOrInactive = notification.Course_Unique_ID ? "Active_Course" : "Course";
            const myEidFromCourse = await getEnrolmentIdsByCourseUid(courseUid, activeOrInactive);
            //  const myEidFromCourse = await getEnrolmentIdsByCourseUid( notification.Course_Unique_ID || notification.Course_Unique_ID_NotActive);
            window.location.href = `https://courses.writerscentre.com.au/students/course-details/${notification.Course_Unique_ID || notification.Course_Unique_ID_NotActive}?eid=${myEidFromCourse}&selectedTab=courseChat?current-post-id=${notification.Post_ID}`;
        } else if (type === "Submissions" || type === "Submission Comments") {
            const activeOrInactive = notification.Course_Unique_ID ? "Active_Course" : "Course";
            const myEidFromLesson = await getEnrolmentIdsByLessonUid(notification.Lesson_Unique_ID_For_Submission, activeOrInactive);
            window.location.href = `https://courses.writerscentre.com.au/course-details/content/${notification.Lesson_Unique_ID_For_Submission}?eid=${myEidFromLesson}`;
        } else {
            const courseUid = notification.Course_Unique_ID || notification.Course_Unique_ID_NotActive;
            const activeOrInactive = notification.Course_Unique_ID ? "Active_Course" : "Course";
            const myEidFromCourse = await getEnrolmentIdsByCourseUid(courseUid, activeOrInactive);
            window.location.href = `https://courses.writerscentre.com.au/students/course-details/${notification.Course_Unique_ID || notification.Course_Unique_ID_NotActive}?eid=${myEidFromCourse}&selectedTab=anouncemnt?data-announcement-template-id=${anouncementScrollId}`;
        }
    });
    return card;
}

function processNotification(notification) {
    const container1 = document.getElementById(
        "parentNotificationTemplatesInBody"
    );
    const container2 = document.getElementById("secondaryNotificationContainer");
    const id = Number(notification.ID);
    if (displayedNotifications.has(id)) return;
    displayedNotifications.add(id);
    const isRead = readAnnouncements.has(id);
    const card = createNotificationCard(notification, isRead);
    container1.prepend(card);
    let cardClone = null;
    if (container2) {
        cardClone = createNotificationCard(notification, isRead);
        container2.prepend(cardClone);
    }
    cardMap.set(id, { original: card, clone: cardClone });
    updateNoNotificationMessages();
    updateNoNotificationMessagesSec();
}

function updateNotificationReadStatus() {
    cardMap.forEach((cards, id) => {
        if (readAnnouncements.has(id)) {
            [cards.original, cards.clone].forEach((card) => {
                if (card) {
                    card
                        .querySelector(".notification-content")
                        .classList.remove("bg-unread");
                    card.querySelector(".notification-content").classList.add("bg-white");
                }
            });
        }
    });
}

function updateMarkAllReadVisibility() {
    let hasUnread = false;
    cardMap.forEach(({ original }) => {
        if (
            original &&
            original
                .querySelector(".notification-content")
                .classList.contains("bg-unread")
        ) {
            hasUnread = true;
        }
    });
    const markAllReadElements = document.querySelectorAll(
        ".hideMarkAllReadIfAllRead"
    );
    const redDot = document.getElementById("redDot");
    markAllReadElements.forEach((el) => {
        el.classList.toggle("hidden", !hasUnread);
    });
    if (redDot) {
        redDot.classList.toggle("hidden", !hasUnread);
    }
}

async function markAsRead(announcementId) {
    if (
        pendingAnnouncements.has(announcementId) ||
        readAnnouncements.has(announcementId)
    )
        return;
    pendingAnnouncements.add(announcementId);
    const variables = {
        payload: {
            read_announcement_id: announcementId,
            read_contact_id: loggedInContactIdIntAwc,
        },
    };
    try {
        const response = await fetch(graphQlApiEndpointUrlAwc, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Api-Key": graphQlApiKeyAwc,
            },
            body: JSON.stringify({
                query: MARK_READ_MUTATION,
                variables: variables,
            }),
        });
        const data = await response.json();
        pendingAnnouncements.delete(announcementId);
        if (data.data && data.data.createOReadContactReadAnnouncement) {
            readAnnouncements.add(announcementId);
            updateNotificationReadStatus();
            updateMarkAllReadVisibility();
            updateNoNotificationMessages();
            updateNoNotificationMessagesSec();
        }
    } catch (error) {
        pendingAnnouncements.delete(announcementId);
    }
}

function markAllAsRead() {
    cardMap.forEach((cards, id) => {
        if (!readAnnouncements.has(id) && !pendingAnnouncements.has(id)) {
            markAsRead(id);
        }
    });
    updateMarkAllReadVisibility();
    updateNoNotificationMessages();
    updateNoNotificationMessagesSec();
}

document.addEventListener("DOMContentLoaded", () => {
    const markAllBtn = document.getElementById("markEveryAsRead");
    if (markAllBtn) {
        markAllBtn.addEventListener("click", markAllAsRead);
    }
});

function updateNoNotificationMessages() {
    const noAllMessage = document.getElementById("noAllMessage");
    const noAnnouncementsMessage = document.getElementById(
        "noAnnouncementsMessage"
    );
    if (!noAllMessage || !noAnnouncementsMessage) return;
    const visibleCards = [...cardMap.values()].filter(
        ({ original }) => original && !original.classList.contains("hidden")
    );
    const hasNotifications = visibleCards.length > 0;
    noAllMessage.classList.toggle("hidden", hasNotifications);
    noAnnouncementsMessage.classList.add("hidden");
}

function updateNoNotificationMessagesSec() {
    const noAllMessageSec = document.getElementById("noAllMessageSec");
    const noAnnouncementsMessageSec = document.getElementById(
        "noAnnouncementsMessageSec"
    );
    if (!noAllMessageSec || !noAnnouncementsMessageSec) return;
    const hasVisible = [...cardMap.values()].some(
        ({ clone }) => clone && !clone.classList.contains("hidden")
    );
    noAllMessageSec.classList.toggle("hidden", hasVisible);
    noAnnouncementsMessageSec.classList.add("hidden");
}

document.addEventListener("DOMContentLoaded", function () {
    const onlySeeBtn = document.getElementById("OnlyseeAnnouncements");
    const noAllMessage = document.getElementById("noAllMessage");
    const showAllBtn = document.getElementById("allAnnouncements");
    const noAnnouncementsMessage = document.getElementById(
        "noAnnouncementsMessage"
    );
    const showUnreadAnnounceBtn = document.getElementById(
        "showUnreadAnnouncement"
    );
    const showUnreadAllNotification = document.getElementById(
        "showUnreadAllNotification"
    );
    let showUnreadMode = false;
    let showUnreadAllMode = false;
    function toggleVisibilityAll() {
        showUnreadAllMode = false;
        showUnreadMode = false;
        let hasData = false;
        cardMap.forEach(({ original }) => {
            if (original) {
                original.classList.remove("hidden");
                hasData = true;
            }
        });
        noAllMessage.classList.toggle("hidden", hasData);
        noAnnouncementsMessage.classList.add("hidden");
    }
    function toggleVisibilityByType(type) {
        showUnreadAllMode = false;
        showUnreadMode = false;
        let hasAnnouncements = false;
        cardMap.forEach(({ original }, id) => {
            const notification = notificationData.find((n) => Number(n.ID) === id);
            if (!notification) return;
            const shouldShow = notification.Type === type;
            if (original) {
                original.classList.toggle("hidden", !shouldShow);
            }
            if (shouldShow) hasAnnouncements = true;
        });
        noAnnouncementsMessage.classList.toggle("hidden", hasAnnouncements);
        noAllMessage.classList.add("hidden");
    }
    function toggleUnreadAnnouncements() {
        showUnreadMode = !showUnreadMode;
        let hasUnread = false;
        let hasVisible = false;
        cardMap.forEach(({ original }, id) => {
            const notification = notificationData.find((n) => Number(n.ID) === id);
            if (!notification) return;
            if (notification.Type === "Announcement") {
                const isUnread = original
                    .querySelector(".notification-content")
                    .classList.contains("bg-unread");
                if (original) {
                    original.classList.toggle("hidden", showUnreadMode && !isUnread);
                    if (!original.classList.contains("hidden")) {
                        hasVisible = true;
                    }
                }
                if (isUnread) hasUnread = true;
            }
        });
        noAnnouncementsMessage.classList.toggle("hidden", hasVisible);
        noAllMessage.classList.add("hidden");
    }
    function toggleUnreadNotifications() {
        showUnreadAllMode = !showUnreadAllMode;
        let hasUnread = false;
        let hasVisible = false;
        cardMap.forEach(({ original }) => {
            const isUnread = original
                .querySelector(".notification-content")
                .classList.contains("bg-unread");
            if (original) {
                original.classList.toggle("hidden", showUnreadAllMode && !isUnread);
                if (!original.classList.contains("hidden")) {
                    hasVisible = true;
                }
            }
            if (isUnread) hasUnread = true;
        });
        noAllMessage.classList.toggle("hidden", hasVisible);
        noAnnouncementsMessage.classList.add("hidden");
    }
    onlySeeBtn.addEventListener("click", () =>
        toggleVisibilityByType("Announcement")
    );
    showAllBtn.addEventListener("click", toggleVisibilityAll);
    showUnreadAnnounceBtn.addEventListener("click", toggleUnreadAnnouncements);
    showUnreadAllNotification.addEventListener(
        "click",
        toggleUnreadNotifications
    );
});

document.addEventListener("DOMContentLoaded", function () {
    const onlySeeBtnSec = document.getElementById("OnlyseeAnnouncementsSec");
    const noAllMessageSec = document.getElementById("noAllMessageSec");
    const showAllBtnSec = document.getElementById("allAnnouncementsSec");
    const noAnnouncementsMessageSec = document.getElementById(
        "noAnnouncementsMessageSec"
    );
    const showUnreadAnnounceBtnSec = document.getElementById(
        "showUnreadAnnouncementSec"
    );
    const showUnreadAllNotificationSec = document.getElementById(
        "showUnreadAllNotificationSec"
    );
    let showUnreadModeSec = false;
    let showUnreadAllModeSec = false;
    function toggleVisibilityByTypeSec(type) {
        showUnreadAllModeSec = false;
        showUnreadModeSec = false;
        let hasAnnouncements = false;
        cardMap.forEach(({ clone }, id) => {
            const notification = notificationData.find((n) => Number(n.ID) === id);
            if (!notification) return;
            const shouldShow = notification.Type === type;
            if (clone) {
                clone.classList.toggle("hidden", !shouldShow);
            }
            if (shouldShow) hasAnnouncements = true;
        });
        noAnnouncementsMessageSec.classList.toggle("hidden", hasAnnouncements);
        noAllMessageSec.classList.add("hidden");
    }
    function toggleVisibilityAllSec() {
        showUnreadAllModeSec = false;
        showUnreadModeSec = false;
        let hasData = false;
        cardMap.forEach(({ clone }) => {
            if (clone) {
                clone.classList.remove("hidden");
                hasData = true;
            }
        });
        noAllMessageSec.classList.toggle("hidden", hasData);
        noAnnouncementsMessageSec.classList.add("hidden");
    }
    function toggleUnreadAnnouncementsSec() {
        showUnreadModeSec = !showUnreadModeSec;
        let hasUnread = false;
        let hasVisible = false;
        cardMap.forEach(({ clone }, id) => {
            const notification = notificationData.find((n) => Number(n.ID) === id);
            if (!notification) return;
            if (notification.Type === "Announcement") {
                const isUnread = clone
                    ?.querySelector(".notification-content")
                    ?.classList.contains("bg-unread");
                if (clone) {
                    clone.classList.toggle("hidden", showUnreadModeSec && !isUnread);
                    if (!clone.classList.contains("hidden")) {
                        hasVisible = true;
                    }
                }
                if (isUnread) hasUnread = true;
            }
        });
        noAnnouncementsMessageSec.classList.toggle("hidden", hasVisible);
        noAllMessageSec.classList.add("hidden");
    }
    function toggleUnreadNotificationsSec() {
        showUnreadAllModeSec = !showUnreadAllModeSec;
        let hasUnread = false;
        let hasVisible = false;
        cardMap.forEach(({ clone }) => {
            const isUnread = clone
                ?.querySelector(".notification-content")
                ?.classList.contains("bg-unread");
            if (clone) {
                clone.classList.toggle("hidden", showUnreadAllModeSec && !isUnread);
                if (!clone.classList.contains("hidden")) {
                    hasVisible = true;
                }
            }
            if (isUnread) hasUnread = true;
        });
        noAllMessageSec.classList.toggle("hidden", hasVisible);
        noAnnouncementsMessageSec.classList.add("hidden");
    }
    if (onlySeeBtnSec) {
        onlySeeBtnSec.addEventListener("click", () =>
            toggleVisibilityByTypeSec("Announcement")
        );
    }
    if (showAllBtnSec) {
        showAllBtnSec.addEventListener("click", toggleVisibilityAllSec);
    }
    if (showUnreadAnnounceBtnSec) {
        showUnreadAnnounceBtnSec.addEventListener(
            "click",
            toggleUnreadAnnouncementsSec
        );
    }
    if (showUnreadAllNotificationSec) {
        showUnreadAllNotificationSec.addEventListener(
            "click",
            toggleUnreadNotificationsSec
        );
    }
});

document.addEventListener("DOMContentLoaded", function () {
    updateMarkAllReadVisibility();
    updateNoNotificationMessages();
    updateNoNotificationMessagesSec();
});
