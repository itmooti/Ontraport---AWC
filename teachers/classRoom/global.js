document.querySelector(".closeModalBtn").addEventListener("click", function () {
    document.querySelector("#customSchedule").classList.add("hidden");
});

document.querySelector("#simulatePost").addEventListener("click", function () {
    document.querySelector("#confirmSchedule").click();
    document.querySelector("#customSchedule").classList.add("hidden");
});
// change the tab on url on tab click
function selectedTabChange(tabname) {
    let url = window.location.href;
    let newUrl;
    let match = url.match(/(\?|\&)selectedTab=[^&]+/);
    if (match) {
        newUrl = url.replace(match[0], `?selectedTab=${tabname}`);
    } else {
        newUrl = url + (url.indexOf('?') === -1 ? '?' : '&') + `selectedTab=${tabname}`;
    }
    window.history.replaceState(null, "", newUrl);
}

document.addEventListener("DOMContentLoaded", function () {
    let studentDisplayNameDiv = document.querySelectorAll(".studentDisplayName");

    studentDisplayNameDiv.forEach((div) => {
        // Check if the text content of the div is empty or just whitespace
        if (!div.textContent.trim()) {
            div.textContent = "Anonymous";
        }
    });


    let currentUrl = window.location.href;
    let tabMatch = currentUrl.match(/[?&]selectedTab=([^?&#]*)/);
    let selectedTab = tabMatch ? decodeURIComponent(tabMatch[1]) : null;
    let announcementMatch = currentUrl.match(/[?&]data-announcement-template-id=(\d+)/);
    let announcementId = announcementMatch ? announcementMatch[1] : null;
    let postMatch = currentUrl.match(/[?&]current-post-id=(\d+)/);
    let postId = postMatch ? postMatch[1] : null;
    function highlightElement() {
        let targetElement = null;
        if (selectedTab === "announcements" && announcementId) {
            targetElement = document.querySelector(`[data-announcement-template-id="${announcementId}"]`);
        } else if (selectedTab === "chats" && postId) {
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
// load dedicated content of tab on page load
let selectedTab = "overview";
let currentUrl = window.location.href;
let match = currentUrl.match(/[?&]selectedTab=([^&#?]*)/);

if (match && match[1]) {
    selectedTab = decodeURIComponent(match[1].split('?')[0]);
}
if (selectedTab == 'studentsubmissions') {
    loadAssignments(); renderSubmissions();
}
if (selectedTab == 'assignments') {
    loadAssignments();
}
if (selectedTab == 'announcements') {
    fetchAnnouncements();
}
if (selectedTab == 'chats') {
    loadPosts("all");
}
// tab switch logic

const overviewElements = document.querySelectorAll('.overview');
overviewElements.forEach((overviewElement) => {
    overviewElement.setAttribute('x-show', "selectedTab === 'overview'");
    overviewElement.setAttribute('id', 'tabpanelOverview');
    overviewElement.setAttribute('role', 'tabpanel');
    overviewElement.setAttribute('aria-label', 'overview');
});
const assignmentsElements = document.querySelectorAll('.assignments');
assignmentsElements.forEach((assignmentElement) => {
    assignmentElement.setAttribute('x-show', "selectedTab === 'assignments'");
    assignmentElement.setAttribute('id', 'tabpanelAssignment');
    assignmentElement.setAttribute('role', 'tabpanel');
    assignmentElement.setAttribute('aria-label', 'assignments');
});

const studentsElements = document.querySelectorAll('.students');
studentsElements.forEach((studentElement) => {
    studentElement.setAttribute('x-show', "selectedTab === 'students'");
    studentElement.setAttribute('id', 'tabpanelStudents');
    studentElement.setAttribute('role', 'tabpanel');
    studentElement.setAttribute('aria-label', 'students');
});
const announcementsElements = document.querySelectorAll('.announcements');
announcementsElements.forEach((announcementElement) => {
    announcementElement.setAttribute('x-show', "selectedTab === 'announcements'");
    announcementElement.setAttribute('id', 'tabpanelAnnouncements');
    announcementElement.setAttribute('role', 'tabpanel');
    announcementElement.setAttribute('aria-label', 'announcements');
});
const chatElements = document.querySelectorAll('.chats');
chatElements.forEach((chatElement) => {
    chatElement.setAttribute('x-show', "selectedTab === 'chats'");
    chatElement.setAttribute('id', 'tabpanelChats');
    chatElement.setAttribute('role', 'tabpanel');
    chatElement.setAttribute('aria-label', 'chats');
});
const studentSubmissionElements = document.querySelectorAll('.studentsubmissions');
studentSubmissionElements.forEach((submissionElement) => {
    submissionElement.setAttribute('x-show', "selectedTab === 'studentsubmissions'");
    submissionElement.setAttribute('id', 'tabpanelStudentSubmissions');
    submissionElement.setAttribute('role', 'tabpanel');
    submissionElement.setAttribute('aria-label', 'studentsubmissions');
});

// Notificaton Query
const POSTS_TYPE = (user_Preference_Posts === 'Yes' || user_Preference_Post_Mentions === 'Yes') ? 'Posts' : '';
const POST_COMMENTS_TYPE = (user_Preference_Comments_On_My_Posts === 'Yes' || user_Preference_Post_Comments === 'Yes' || user_Preference_Post_Comment_Mentions === 'Yes') ? 'Post Comments' : '';
const ANNOUNCEMENTS_TYPE = (user_Preference_Announcements === 'Yes' || user_Preference_Announcement_Mentions === 'Yes') ? 'Announcements' : '';
const ANNOUNCEMENT_COMMENTS_TYPE = (user_Preference_Comments_On_My_Announcements === 'Yes' || user_Preference_Announcement_Comments === 'Yes' || user_Preference_Announcement_Comment_Mentions === 'Yes') ? 'Announcement Comments' : '';
const SUBMISSIONS_TYPE = (user_Preference_Submissions === 'Yes' || user_Preference_Submission_Mentions === 'Yes') ? 'Submissions' : '';
const SUBMISSION_COMMENTS_TYPE = (user_Preference_Comments_On_My_Submissions === 'Yes' || user_Preference_Submission_Comments === 'Yes' || user_Preference_Submission_Comment_Mentions === 'Yes') ? 'Submission Comments' : '';

const fetchUserDate = user_Preference_Turn_Off_All_Notifications === 'Yes' ? `
{ andWhere: { created_at: "${Turn_Off_All_Notifications_Time_Unix}" } }` : '';

let SUBSCRIPTION_QUERY = `
subscription subscribeToCalcAnnouncements(
  $class_id: AwcClassID
) {
   subscribeToCalcAnnouncements(
    query: [
      { where: { class_id: $class_id } }
	 ${fetchUserDate}
      {
        andWhereGroup: [
          {
            whereGroup: [
              { where: { notification__type: "${POSTS_TYPE}" } }
              {
                andWhere: {
                  Post: [
                    {
                      where: {
                        author_id: ${CONTACTss_ID}
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
              { where: { notification__type: "${POST_COMMENTS_TYPE}" } }
              {
                andWhere: {
                  Comment: [
                    {
                      where: {
                        author_id: ${CONTACTss_ID}
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
              { where: { notification__type: "${ANNOUNCEMENTS_TYPE}" } }
            ]
          }
          {
            orWhereGroup: [
              { where: { notification__type: "${ANNOUNCEMENT_COMMENTS_TYPE}" } }
              {
                andWhere: {
                  Comment: [
                    {
                      where: {
                        author_id: ${CONTACTss_ID}
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
              { where: { notification__type: "${SUBMISSIONS_TYPE}" } }
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
                                    where: { id:  ${CONTACTss_ID}, _OPERATOR_: neq }
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
                            { where: { private_submission: false } }
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
              { where: { notification__type: "${SUBMISSION_COMMENTS_TYPE}" } }
              {
                andWhere: {
                  Submissions: [
                    {
                      where: {
                        ForumComments: [
                          {
                            where: {
                              author_id: ${CONTACTss_ID}
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
    orderBy: [{ path: ["created_at"], type: asc }] 
    limit: 5000
    offset: 0
  ) {
    ID: field(arg: ["id"]) 
    Class_ID: field(arg: ["class_id"]) 
    Class_Class_Name: field(arg: ["Class", "class_name"]) 
    EnrolmentID: field(arg: ["Class", "Enrolments", "id"]) 
    Course_Unique_ID: field(arg: ["Class", "Course", "unique_id"]) 
    Course_Course_Name: field(arg: ["Class", "Course", "course_name"]) 
    Comment_ID: field(arg: ["comment_id"]) 
    Content: field(arg: ["content"]) 
    Course_ID: field(arg: ["course_id"])  
	Notification_Type: field(arg: ["notification__type"])
    Date_Added: field(arg: ["created_at"]) 
    Instructor_ID: field(arg: ["instructor_id"]) 
    Post_ID: field(arg: ["post_id"]) 
	Contact_Display_Name: field(arg: ["Post", "Author", "display_name"]) 
    Contact_First_Name: field(arg: ["Post", "Author", "first_name"]) 
    Contact_Last_Name: field(arg: ["Post", "Author", "last_name"]) 
    Contact_Display_Name1: field(arg: ["Post", "Mentions", "display_name"]) 
    Contact_First_Name1: field(arg: ["Post", "Mentions", "first_name"]) 
    Contact_Last_Name1: field(arg: ["Post", "Mentions", "last_name"])  
    Contact_Contact_ID: field(arg: ["Post", "Mentions", "id"])  
 	Mentions_Contact_ID: field(arg: ["Mentions", "id"]) 
    Status: field(arg: ["status"]) 
    Submissions_ID: field(arg: ["submissions_id"]) 
    Title: field(arg: ["title"]) 
    Type: field(arg: ["type"]) 
    Unique_ID: field(arg: ["unique_id"]) 
    Post_Author_ID: field(arg: ["Post", "author_id"]) 
    Enrolment_Student_ID: field(arg: ["Submissions", "Student", "student_id"]) 
    Comment_Author_ID: field(arg: ["Comment", "author_id"]) 
    Lesson_Unique_ID1: field(arg: ["Submissions", "Announcements", "Course", "Lessons", "unique_id"])   
    Instructor_Display_Name: field(arg: ["Instructor", "display_name"]) 
    Instructor_First_Name: field(arg: ["Instructor", "first_name"]) 
    Instructor_Last_Name: field(arg: ["Instructor", "last_name"]) 
    Contact_Contact_ID1: field(arg: ["Comment", "Mentions", "id"]) 
    Contact_Display_Name2: field(arg: ["ForumComments", "Author","display_name"]) 
    Contact_First_Name2: field(arg: ["Comment", "Forum_Post", "Author", "first_name"]) 
    Contact_Last_Name2: field(arg: ["Comment", "Forum_Post", "Author", "last_name"]) 
    ForumPost_Author_ID: field(arg: ["Comment", "Forum_Post", "author_id"]) 
    Contact_Contact_IDSubmission: field(arg: ["Submissions", "Submission_Mentions", "id"])   
  	SubEnrolment_Student_ID: field(arg: ["Submissions", "Student", "student_id"]) 
    SubContact_Display_Name: field(arg: ["Submissions""Student""Student""display_name"]) 
    SubContact_First_Name: field(arg: ["Submissions""Student""Student""first_name"]) 
    SubContact_Last_Name: field(arg: ["Submissions""Student""Student""last_name"])  
    Contact_Display_Name5: field(arg: ["Submissions""ForumComments""Author""display_name"])  
    Contact_First_Name5: field(arg: ["Submissions""ForumComments""Author""first_name"]) 
    Contact_Last_Name5: field(arg: ["Submissions""ForumComments""Author""last_name"])  
	AnnContact_Display_Name: field(arg: ["ForumComments", "Author", "display_name"]) 
    AnnContact_First_Name1: field(arg: ["ForumComments", "Author", "first_name"]) 
    AnnContact_Last_Name: field(arg: ["ForumComments", "Author", "last_name"]) 
  	AnnouncementContact_Contact_ID: field(arg: ["Comment", "Mentions", "id"]) 
	Announcement_Instructor_ID: field(arg: ["ForumComments""Parent_Announcement""instructor_id"]) 
    CommentContact_Display_Name: field(arg: ["Comment", "Author", "display_name"]) 
    CommentContact_First_Name: field(arg: ["Comment", "Author", "first_name"]) 
    CommentContact_Last_Name: field(arg: ["Comment", "Author", "last_name"]) 
    ForumComments_Parent_Announcement_ID: field(arg: ["Comment", "parent_announcement_id"]) 
        Read_Contacts_Data_Read_Announcement_ID: field(
      arg: ["Read_Contacts_Data", "read_announcement_id"]
    )
    Read_Contacts_Data_Read_Contact_ID: field(
      arg: ["Read_Contacts_Data", "read_contact_id"]
    )
  }
}
`;

const MARK_READ_MUTATION = `
mutation createOReadContactReadAnnouncement($payload: OReadContactReadAnnouncementCreateInput = null) {
createOReadContactReadAnnouncement(payload: $payload) {
Read_Announcement_ID: read_announcement_id 
Read_Contact_ID: read_contact_id 
}
}
`;