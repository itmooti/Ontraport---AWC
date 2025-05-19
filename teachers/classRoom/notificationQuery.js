// Notificaton Query
const POSTS_TYPE = (user_Preference_Posts === 'Yes' || user_Preference_Post_Mentions === 'Yes') ? 'Posts' : '';
const POST_COMMENTS_TYPE = (user_Preference_Comments_On_My_Posts === 'Yes' || user_Preference_Post_Comments === 'Yes' || user_Preference_Post_Comment_Mentions === 'Yes') ? 'Post Comments' : '';
const ANNOUNCEMENTS_TYPE = (user_Preference_Announcements === 'Yes' || user_Preference_Announcement_Mentions === 'Yes') ? 'Announcements' : '';
const ANNOUNCEMENT_COMMENTS_TYPE = (user_Preference_Comments_On_My_Announcements === 'Yes' || user_Preference_Announcement_Comments === 'Yes' || user_Preference_Announcement_Comment_Mentions === 'Yes') ? 'Announcement Comments' : '';
const SUBMISSIONS_TYPE = (user_Preference_Submissions === 'Yes' || user_Preference_Submission_Mentions === 'Yes') ? 'Submissions' : '';
const SUBMISSION_COMMENTS_TYPE = (user_Preference_Comments_On_My_Submissions === 'Yes' || user_Preference_Submission_Comments === 'Yes' || user_Preference_Submission_Comment_Mentions === 'Yes') ? 'Submission Comments' : '';

const fetchUserDate = user_Preference_Turn_Off_All_Notifications === 'Yes' ? `
{ andWhere: { created_at: "${Turn_Off_All_Notifications_Time_Unix}" } }` : '';

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
        unique_id 
          Student {
            student_id
            Student { display_name first_name last_name }
          }
          Announcements { Course { Lessons { unique_id } } }
          Assessment {type  Lesson { unique_id } }
          Submission_Mentions { id }
          ForumComments { Author { display_name first_name last_name } }
        }
        Comment { 
          id  
          author_id 
          reply_to_comment_id 
          Reply_to_Comment{
            author_id
          } 
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
