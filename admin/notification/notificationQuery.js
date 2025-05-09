// Notificaton Query
const POSTS_TYPE = (user_Preference_Posts === 'Yes' || user_Preference_Post_Mentions === 'Yes') ? 'Posts' : '';
const POST_COMMENTS_TYPE = (user_Preference_Comments_On_My_Posts === 'Yes' || user_Preference_Post_Comments === 'Yes' || user_Preference_Post_Comment_Mentions === 'Yes') ? 'Post Comments' : '';
const ANNOUNCEMENTS_TYPE = (user_Preference_Announcements === 'Yes' || user_Preference_Announcement_Mentions === 'Yes') ? 'Announcements' : '';
const ANNOUNCEMENT_COMMENTS_TYPE = (user_Preference_Comments_On_My_Announcements === 'Yes' || user_Preference_Announcement_Comments === 'Yes' || user_Preference_Announcement_Comment_Mentions === 'Yes') ? 'Announcement Comments' : '';
const SUBMISSIONS_TYPE = (user_Preference_Submissions === 'Yes' || user_Preference_Submission_Mentions === 'Yes') ? 'Submissions' : '';
const SUBMISSION_COMMENTS_TYPE = (user_Preference_Comments_On_My_Submissions === 'Yes' || user_Preference_Submission_Comments === 'Yes' || user_Preference_Submission_Comment_Mentions === 'Yes') ? 'Submission Comments' : '';

const fetchUserDate = user_Preference_Turn_Off_All_Notifications === 'Yes' ? `
{ andWhere: { created_at: "${Turn_Off_All_Notifications_Time_Unix}" } }` : '';

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
//     Class_Unique_ID: field(arg: ["Class", "unique_id"]) 
//     Class_Class_Name: field(arg: ["Class", "class_name"]) 
//     EnrolmentID: field(arg: ["Class", "Enrolments", "id"]) 
//     Course_Unique_ID: field(arg: ["Class", "Course", "unique_id"]) 
//     Course_Course_Name: field(arg: ["Class", "Course", "course_name"]) 
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
//     Instructor_Display_Name: field(arg: ["Instructor", "display_name"]) 
//     Instructor_First_Name: field(arg: ["Instructor", "first_name"]) 
//     Instructor_Last_Name: field(arg: ["Instructor", "last_name"]) 
//     Contact_Contact_ID1: field(arg: ["Comment", "Mentions", "id"]) 
//     Contact_Display_Name2: field(arg: ["ForumComments", "Author","display_name"]) 
//     Contact_First_Name2: field(arg: ["Comment", "Forum_Post", "Author", "first_name"]) 
//     Contact_Last_Name2: field(arg: ["Comment", "Forum_Post", "Author", "last_name"]) 
//     ForumPost_Author_ID: field(arg: ["Comment", "Forum_Post", "author_id"]) 
//     Contact_Contact_IDSubmission: field(arg: ["Submissions", "Submission_Mentions", "id"])   
//     SubEnrolment_Student_ID: field(arg: ["Submissions", "Student", "student_id"]) 
//     SubContact_Display_Name: field(arg: ["Submissions""Student""Student""display_name"]) 
//     SubContact_First_Name: field(arg: ["Submissions""Student""Student""first_name"]) 
//     SubContact_Last_Name: field(arg: ["Submissions""Student""Student""last_name"])  
//     Contact_Display_Name5: field(arg: ["Submissions""ForumComments""Author""display_name"])  
//     Contact_First_Name5: field(arg: ["Submissions""ForumComments""Author""first_name"]) 
//     Contact_Last_Name5: field(arg: ["Submissions""ForumComments""Author""last_name"])  
//     AnnContact_Display_Name: field(arg: ["ForumComments", "Author", "display_name"]) 
//     AnnContact_First_Name1: field(arg: ["ForumComments", "Author", "first_name"]) 
//     AnnContact_Last_Name: field(arg: ["ForumComments", "Author", "last_name"]) 
//     AnnouncementContact_Contact_ID: field(arg: ["Comment", "Mentions", "id"]) 
//     Announcement_Instructor_ID: field(arg: ["ForumComments""Parent_Announcement""instructor_id"]) 
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
// ✅ 1. Updated SUBSCRIPTION_QUERY using subscribeToAnnouncements (one socket per class, no alias)
function getSubscriptionQueryForClass(classId) {
  return `
    subscription subscribeToAnnouncements(
      $class_id: AwcClassID
      $limit: IntScalar
      $offset: IntScalar
    ) {
      subscribeToAnnouncements(
        query: [
          { where: { class_id: $class_id } }
          {
            andWhereGroup: [
              {
                whereGroup: [
                  {
                    where: { notification__type: "${POSTS_TYPE}" }
                  }
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
              },
              {
                orWhereGroup: [
                  {
                    where: { notification__type: "${POST_COMMENTS_TYPE}" }
                  },
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
              },
              {
                orWhereGroup: [
                  { where: { notification__type: "${ANNOUNCEMENTS_TYPE}" } }
                ]
              },
              {
                orWhereGroup: [
                  { where: { notification__type: "${ANNOUNCEMENT_COMMENTS_TYPE}" } },
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
              },
              {
                orWhereGroup: [
                  { where: { notification__type: "${SUBMISSIONS_TYPE}" } },
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
                                        id: ${CONTACTss_ID}
                                        _OPERATOR_: neq
                                      }
                                    }
                                  ]
                                }
                              }
                            ]
                          }
                        },
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
              },
              {
                orWhereGroup: [
                  { where: { notification__type: "${SUBMISSION_COMMENTS_TYPE}" } },
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
        limit: $limit
        offset: $offset
        orderBy: [{ path: ["created_at"], type: asc }]
      ) {
        ID: id
        Class_ID: class_id
        Comment_ID: comment_id
        Content: content
        Course_ID: course_id
        Notification_Type: notification__type
        Date_Added: created_at
        Instructor_ID: instructor_id
        Post_ID: post_id
        Status: status
        Submissions_ID: submissions_id
        Title: title
        Type: type
        Unique_ID: unique_id
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
    }
  `;
}
const MARK_READ_MUTATION = `
mutation createOReadContactReadAnnouncement($payload: OReadContactReadAnnouncementCreateInput = null) {
createOReadContactReadAnnouncement(payload: $payload) {
Read_Announcement_ID: read_announcement_id 
Read_Contact_ID: read_contact_id 
}
}
`;
