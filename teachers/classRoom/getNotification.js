const container = document.getElementById("parentNotificationTemplatesInBody");
const displayedNotifications = new Set();
const readAnnouncements = new Set();
const pendingAnnouncements = new Set();
const cardMap = new Map();
const notificationIDs = new Set();
const notificationData = [];


function timeAgo(unixTimestamp) {
    const now = new Date();
    const date = new Date(unixTimestamp * 1000);
    const seconds = Math.floor((now - date) / 1000);
    let interval = Math.floor(seconds / 31536000);
    if (interval >= 1) return interval + " year" + (interval > 1 ? "s" : "") + " ago";
    interval = Math.floor(seconds / 2592000);
    if (interval >= 1) return interval + " month" + (interval > 1 ? "s" : "") + " ago";
    interval = Math.floor(seconds / 86400);
    if (interval >= 1) return interval + " day" + (interval > 1 ? "s" : "") + " ago";
    interval = Math.floor(seconds / 3600);
    if (interval >= 1) return interval + " hour" + (interval > 1 ? "s" : "") + " ago";
    interval = Math.floor(seconds / 60);
    if (interval >= 1) return interval + " min" + (interval > 1 ? "s" : "") + " ago";
    return "Just now";
}

let cachedClassIds = null;
let socketConnections = new Map();

async function fetchClassIds() {
    if (cachedClassIds !== null) return cachedClassIds;
    const query = `
query calcClasses {
  calcClasses(query: [{ where: { teacher_id: ${CONTACTss_ID} } }]
      limit: 5000  
        offset: 0 
  ) {
    ID: field(arg: ["id"])
  }
}
`;
    try {
        const response = await fetch(HTTP_ENDPOINT, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Api-Key": APIii_KEY,
            },
            body: JSON.stringify({ query }),
        });
        const result = await response.json();
        if (result.data && result.data.calcClasses) {
            return result.data.calcClasses.map((cls) => cls.ID);
        }
        return [];
    } catch (error) {
        return [];
    }
}


async function initializeSocket() {
    document.getElementById("socketLoader")?.classList.remove("hidden");
    document.getElementById("parentNotificationTemplatesInBody")?.classList.add("hidden");
    document.getElementById("noAllMessage")?.classList.add("hidden");
    document.getElementById("noAnnouncementsMessage")?.classList.add("hidden");
  if (document.hidden) return;

  const classIds = await fetchClassIds(); // fetches all student’s class IDs
  if (!classIds || classIds.length === 0) return;

  const socket = new WebSocket(WS_ENDPOINT, "vitalstats");
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
        id: "subscription_all_classes",
        type: "GQL_START",
        payload: {
          query: getSubscriptionQueryForAllClasses(), // this function should return your new query
          variables: { 
              class_id: classIds,
              limit: 50,
              offset: 0
          }
        }
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

    // Existing logic for read status
    notifications.forEach((notification) => {
      if (
        notification.Read_Contacts_Data &&
        notification.Read_Contacts_Data.some(
          (read) => Number(read.read_contact_id) === Number(LOGGED_IN_CONTACT_ID)
        )
      ) {
        readAnnouncements.add(Number(notification.ID));
      }
    });

    // Filter notifications based on type and user preferences
    const filteredNotifications = notifications.filter((notification) => {
      const userId = Number(LOGGED_IN_CONTACT_ID);
      switch (notification.Notification_Type) {
        case "Posts": {
          const authored = notification.Post?.author_id === userId;
          const mentioned = notification.Post?.Mentions?.some(m => m.id === userId);
          if (user_Preference_Posts === "Yes" && !authored) return true;
          if (user_Preference_Post_Mentions === "Yes" && mentioned) return true;
          return false;
        }
        case "Post Comments": {
          const authored = notification.Comment?.author_id === userId;
          const mentioned = notification.Comment?.Mentions?.some(m => m.id === userId);
          const parentIsUser = notification.Comment?.Forum_Post?.author_id === userId;
          if (user_Preference_Post_Comments === "Yes" && !authored) return true;
          if (user_Preference_Post_Comment_Mentions === "Yes" && mentioned) return true;
          if (user_Preference_Comments_On_My_Posts === "Yes" && parentIsUser) return true;
          return false;
        }
        case "Submissions": {
          const submitted = notification.Submissions?.Student?.student_id === userId;
          const mentioned = notification.Submissions?.Submission_Mentions?.some(m => m.id === userId);
          if (user_Preference_Submissions === "Yes" && !submitted) return true;
          if (user_Preference_Submission_Mentions === "Yes" && mentioned) return true;
          return false;
        }
        case "Submission Comments": {
          const authored = notification.Comment?.author_id === userId;
          const mentioned = notification.Comment?.Mentions?.some(m => m.id === userId);
          const isCommentOnMySubmission = notification.Submissions?.Student?.student_id === userId;
          const commentOwnerId = notification.Comment?.Reply_to_Comment?.author_id; 
          const isReplyOnMyComment = commentOwnerId === userId;
          if (user_Preference_Submission_Comments === "Yes" && !authored) return true;
          if (user_Preference_Submission_Comment_Mentions === "Yes" && mentioned) return true;
          if (user_Preference_Comments_On_My_Submissions === "Yes" && isReplyOnMyComment) return true;  
          if (user_Preference_Comments_On_My_Submissions === "Yes" && isCommentOnMySubmission) return true;
          return false;
        }
        case "Announcements": {
          const authored = notification.Instructor_ID === userId;
          const mentioned = notification.Mentions?.some(m => m.id === userId);
          if (user_Preference_Announcements === "Yes" && !authored) return true;
          if (user_Preference_Announcement_Mentions === "Yes" && mentioned) return true;
          return false;
        }
        case "Announcement Comments": {
          const authored = notification.Comment?.author_id === userId;
          const mentioned = notification.Comment?.Mentions?.some(m => m.id === userId);
          const parentIsUser = notification.ForumComments?.Parent_Announcement?.instructor_id === userId;
          const commentOwnerId = notification.Comment?.Reply_to_Comment?.author_id; 
          const isReplyOnMyComment = commentOwnerId === userId;
          if (user_Preference_Announcement_Comments === "Yes" && !authored) return true;
          if (user_Preference_Announcement_Comment_Mentions === "Yes" && mentioned) return true;
          if (user_Preference_Comments_On_My_Announcements === "Yes" && isReplyOnMyComment) return true;  
          if (user_Preference_Comments_On_My_Announcements === "Yes" && parentIsUser) return true;
          return false;
        }
        default:
          return false;
      }
    });

    if (filteredNotifications.length === 0) return;

    filteredNotifications.forEach((notification) => {
      notificationIDs.add(Number(notification.ID));
      notificationData.push(notification);
    });

    notificationData.sort((a, b) => a.Date_Added - b.Date_Added);
    displayedNotifications.clear();
    const container = document.getElementById("parentNotificationTemplatesInBody");
    container.innerHTML = "";

    notificationData.forEach((notification) => {
      if (!displayedNotifications.has(Number(notification.ID))) {
        processNotification(notification);
      }
    });
document.getElementById("socketLoader")?.classList.add("hidden");
if (notificationData.length === 0) {
    document.getElementById("noAllMessage")?.classList.remove("hidden");
    document.getElementById("noAnnouncementsMessage")?.classList.remove("hidden");
} else {
  document.getElementById("noAllMessage")?.classList.add("hidden");
  document.getElementById("noAnnouncementsMessage")?.classList.add("hidden");
  document.getElementById("parentNotificationTemplatesInBody")?.classList.remove("hidden");
}
    updateMarkAllReadVisibility();
  };

  socket.onerror = () => {
    // Optional: log errors
  };

  socket.onclose = () => {
    clearInterval(keepAliveInterval);
    setTimeout(() => {
      if (!document.hidden) initializeSocket(); // retry on disconnect
    }, 28000);
  };
}

initializeSocket();


function createNotificationCard(notification, isRead) {
    const assessmentType = notification.Submissions?.Assessment?.type;
  const card = document.createElement("div");
  const notification_Type = notification.Notification_Type;
  const usersId = String(LOGGED_IN_CONTACT_ID);
  const notification_class_name = notification.Class?.class_name || notification.Class?.class_namee || "(No Class)";
  const notification_course_name = notification.Class?.Active_Course?.course_name || notification.Class?.Course?.course_name || "(No Course)";

  const postMentionID = notification.Post?.Mentions?.some(m => String(m.id) === usersId);
  const commentMentionID = notification.Comment?.Mentions?.some(m => String(m.id) === usersId);
  const announcementMentionID = notification.Mentions?.some(m => String(m.id) === usersId);
  const submissionMentionID = notification.Submissions?.Submission_Mentions?.some(m => String(m.id) === usersId);

  const forumPostAuthorID = notification.Comment?.Forum_Post?.author_id;
  const annInstId = notification.ForumComments?.Parent_Announcement?.instructor_id;
  const isreply = notification.Comment?.reply_to_comment_id !== null && notification.Comment?.reply_to_comment_id !== undefined;

  const postFullName = notification.Post?.Author?.display_name || `${notification.Post?.Author?.first_name || ""} ${notification.Post?.Author?.last_name || ""}`.trim() || "Someone";
  const commentFullname = notification.Comment?.Author?.display_name || `${notification.Comment?.Author?.first_name || ""} ${notification.Comment?.Author?.last_name || ""}`.trim() || "Someone";
  const instructorDisplayName = notification.Instructor?.display_name || `${notification.Instructor?.first_name || ""} ${notification.Instructor?.last_name || ""}`.trim() || "Someone";
  const submitterFullName = notification.Submissions?.Student?.Student?.display_name || `${notification.Submissions?.Student?.Student?.first_name || ""} ${notification.Submissions?.Student?.Student?.last_name || ""}`.trim() || "Someone";
  const commentAuthorFullName = notification.Comment?.Author?.display_name || `${notification.Comment?.Author?.first_name || ""} ${notification.Comment?.Author?.last_name || ""}`.trim() || "Someone";
  const commentReplyAuthorId = notification.Comment?.Reply_to_Comment?.author_id;
  const commentAuthorId = notification.Comment?.author_id;
  let isSubmissionAReply = false;
  let SubmissionAComment = false;
  let message = "";
  let messageContent = "";

  if (notification_Type === "Posts") {
    if (postMentionID) {
      message = `${notification_course_name} - You have been mentioned in a post`;
      messageContent = `${postFullName} mentioned you in a post`;
    } else {
      message = `${notification_course_name} - A new post has been added`;
      messageContent = `${postFullName} added a new post`;
    }
  } else if (notification_Type === "Post Comments") {
    if (!isreply) {
      if (commentMentionID) {
        message = `${notification_course_name} - You have been mentioned in a comment on a post`;
        messageContent = `${commentFullname} mentioned you in a comment on a post`;
      } else if (forumPostAuthorID && String(forumPostAuthorID) === usersId) {
        message = `${notification_course_name} - A comment has been added on your post`;
        messageContent = `${commentFullname} added a comment on your post`;
      } else {
        message = `${notification_course_name} - A new comment has been added in a post`;
        messageContent = `${commentFullname} added a new comment in a post`;
      }
    } else {
      if (commentMentionID) {
        message = `${notification_course_name} - You have been mentioned in a reply on a post comment`;
        messageContent = `${commentFullname} mentioned you in a reply on a post comment`;
      } else if (commentReplyAuthorId && String(commentReplyAuthorId) === usersId) {
        message = `${notification_course_name} - A reply has been added on your post comment`;
        messageContent = `${commentFullname} added a reply on your post comment`;
      } else {
        message = `${notification_course_name} - A new reply has been added in a post comment`;
        messageContent = `${commentFullname} added a new reply in a post comment`;
      }
    }
  } else if (notification_Type === "Announcements") {
    if (announcementMentionID) {
      message = `${notification_course_name} - You have been mentioned in an announcement`;
      messageContent = `${instructorDisplayName} mentioned you in an announcement`;
    } else {
      message = `${notification_course_name} - A new announcement has been added`;
      messageContent = `${instructorDisplayName} added a new announcement`;
    }
  } else if (notification_Type === "Announcement Comments") {
    if (!isreply) {
        SubmissionAComment = true;
        isSubmissionAReply = false;
      if (commentMentionID) {
        message = `${notification_course_name} - You have been mentioned in a comment on an announcement`;
        messageContent = `${commentFullname} mentioned you in a comment on an announcement`;
      } else if (annInstId && String(annInstId) === usersId) {
        message = `${notification_course_name} - A comment has been added in your announcement`;
        messageContent = `${commentFullname} added a comment in your announcement`;
      } else {
        message = `${notification_course_name} - A new comment has been added in an announcement`;
        messageContent = `${commentFullname} added a new comment in an announcement`;
      }
    } else {
        SubmissionAComment = false;
        isSubmissionAReply = true;
      if (commentMentionID) {
        message = `${notification_course_name} - You have been mentioned in a reply on an announcement comment`;
        messageContent = `${commentFullname} mentioned you in a reply on an announcement comment`;
      } else if (commentReplyAuthorId && String(commentReplyAuthorId) === usersId) {
        message = `${notification_course_name} - A reply has been added in your announcement comment`;
        messageContent = `${commentFullname} added a reply in your announcement comment`;
      } else {
        message = `${notification_course_name} - A new reply has been added in an announcement comment`;
        messageContent = `${commentFullname} added a new reply in an announcement comment`;
      }
    }
  } else if (notification_Type === "Submissions") {
    if (submissionMentionID) {
      message = `${notification_course_name} - You have been mentioned in a submission`;
      messageContent = `${submitterFullName} mentioned you in a submission`;
    } else {
      message = `${notification_course_name} - A submission has been made`;
      messageContent = `${submitterFullName} added a submission`;
    }
  } else if (notification_Type === "Submission Comments") {
    if (!isreply) {
      if (commentMentionID) {
        message = `${notification_course_name} - You have been mentioned in a comment on a submission`;
        messageContent = `${commentAuthorFullName} mentioned you in a submission comment`;
      } else {
        const isCommentOnMySubmission = notification.Submissions?.Student?.student_id === Number(usersId);
        message = isCommentOnMySubmission
          ? `${notification_course_name} - A new comment has been added on your submission`
          : `${notification_course_name} - A new comment has been added on a submission`;
        messageContent = isCommentOnMySubmission
          ? `${commentAuthorFullName} added a comment on your submission`
          : `${commentAuthorFullName} added a comment on a submission`;
      }
    } else {
        if (commentMentionID) {
          message = `${notification_course_name} - You have been mentioned in a reply on a submission comment`;
          messageContent = `${commentFullname} mentioned you in a reply on a submission comment`;
        } else if (commentReplyAuthorId && String(commentReplyAuthorId) === usersId) {
          message = `${notification_course_name} - A reply has been added on your submission comment`;
          messageContent = `${commentFullname} added a reply on your submission comment`;
        } else {
          message = `${notification_course_name} - A new reply has been added in a submission comment`;
          messageContent = `${commentFullname} added a new reply in a submission comment`;
        }
      }
  } else {
    message = `${notification_course_name} - A new notification has arrived`;
    messageContent = `${notification_Type || "Someone"} added something`;
  }

let lowerContent = '';
    if(notification_Type==="Posts"){
        lowerContent=`${notification.Post?.post_copy}`
    }else if(notification_Type==="Submissions"){
        lowerContent=`${notification.Submissions?.submission_note}`;
    }else if(notification_Type==="Announcements"){
        lowerContent=`${notification.Content}`;
    }else{
    lowerContent=`${notification.Comment?.comment}`;
    }
    
  card.className = "notification-card cursor-pointer";
  card.innerHTML = `
    <div data-my-id="${notification.ID}" class="p-2 items-start gap-2 rounded justify-between notification-content w-full ${isRead ? "bg-white" : "bg-unread"} ${notification.Status === "Draft" ? "hidden" : "flex"}">
      <div class="flex flex-col gap-1">
        <div class="text-[#414042] text-xs font-semibold">
          ${message}
        </div>
        <div class="extra-small-text text-dark line-clamp-2">${messageContent}</div>
        <div class="text-[#586A80] extra-small-text">${notification_class_name}</div>
         <div class="text-[#586A80] extra-small-text line-clamp-2">${lowerContent}</div>
      </div>
      <div class="extra-small-text text-[#586A80] text-nowrap">${timeAgo(notification.Date_Added)}</div>
    </div>
  `;
  card.addEventListener("click", async function () {
    const id = Number(notification.ID);
    const type = notification.Notification_Type;
    const loader = document.getElementById("loader");
    loader.classList.remove("fade-out");

    if (!readAnnouncements.has(id) && !pendingAnnouncements.has(id)) {
      await markAsRead(id);
    }

    const anouncementScrollId =
      String(notification_Type) !== "Announcements"
        ? notification.ForumComments?.Parent_Announcement?.id || notification.ForumComments_Parent_Announcement_ID
        : notification.ID;

    const courseUid = notification.Class?.Active_Course?.unique_id || notification.Class?.Course?.unique_id;
      const classIDForADmin=  notification?.Class?.unique_id;
      const classIdUrl = notification?.Class?.id;
        const classNameUrl =   notification?.Class?.class_name;
    const activeOrInactive = notification.Class?.Active_Course?.unique_id ? "Active_Course" : "Course";
 const commentIdForNoti = notification.Comment?.id;
    if ((type === "Posts" || type === "Post Comments") && notification.Post_ID) {
      window.location.href = `https://courses.writerscentre.com.au/teacher/class/${classIDForADmin}?selectedTab=chats?current-post-id=${notification.Notification_Type === 'Posts' ? notification.Post_ID : commentIdForNoti}`;
    } else if ((type === "Submissions" || type === "Submission Comments") && notification.Submissions?.Assessment?.Lesson?.unique_id) {
      const lessonUid = notification.Submissions.Assessment.Lesson.unique_id;
          window.location.href = `https://courses.writerscentre.com.au/course-details/content/${lessonUid}?submissionPostIs=${notification.Notification_Type === 'Submissions' ? notification.Submissions_ID : commentIdForNoti}&classIdFromUrl=${classIdUrl}&className=${classNameUrl}&classUid=${classIDForADmin}&currentClassID=${classIdUrl}&currentClassName=${classNameUrl}&currentClassUniqueID=${classIDForADmin}${assessmentType === "File Submission" ? `&subUID=${subUID}&commentScrollId=${commentScrollID}` : ""}`
    } else {
      window.location.href = `https://courses.writerscentre.com.au/teacher/class/${classIDForADmin}?selectedTab=announcements?data-announcement-template-id=${notification.Notification_Type === 'Announcements' ? anouncementScrollId : commentIdForNoti}`;
    }
  });

  return card;
}


function processNotification(notification) {
    const container1 = document.getElementById("parentNotificationTemplatesInBody");
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
                    card.querySelector(".notification-content").classList.remove("bg-unread");
                    card.querySelector(".notification-content").classList.add("bg-white");
                }
            });
        }
    });
}

function updateMarkAllReadVisibility() {
    let hasUnread = false;
    cardMap.forEach(({ original }) => {
        if (original && original.querySelector(".notification-content").classList.contains("bg-unread")) {
            hasUnread = true;
        }
    });
    const markAllReadElements = document.querySelectorAll(".hideMarkAllReadIfAllRead");
    const redDot = document.getElementById("redDot");
    markAllReadElements.forEach(el => {
        el.classList.toggle("hidden", !hasUnread);
    });
    if (redDot) {
        redDot.classList.toggle("hidden", !hasUnread);
    }
}

async function markAsRead(announcementId) {
    if (pendingAnnouncements.has(announcementId) || readAnnouncements.has(announcementId)) return;
    pendingAnnouncements.add(announcementId);
    const variables = {
        payload: {
            read_announcement_id: announcementId,
            read_contact_id: LOGGED_IN_CONTACT_ID,
        },
    };
    try {
        const response = await fetch(HTTP_ENDPOINT, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Api-Key": APIii_KEY,
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
     document.getElementById("socketLoader")?.classList.add("hidden");
    const noAllMessage = document.getElementById("noAllMessage");
    const noAnnouncementsMessage = document.getElementById("noAnnouncementsMessage");
    if (!noAllMessage || !noAnnouncementsMessage) return;
    const visibleCards = [...cardMap.values()].filter(({ original }) => original && !original.classList.contains("hidden"));
    const hasNotifications = visibleCards.length > 0;
    noAllMessage.classList.toggle("hidden", hasNotifications);
    noAnnouncementsMessage.classList.add("hidden");
}

function updateNoNotificationMessagesSec() {
     document.getElementById("socketLoadersec")?.classList.add("hidden");
    const noAllMessageSec = document.getElementById("noAllMessageSec");
    const noAnnouncementsMessageSec = document.getElementById("noAnnouncementsMessageSec");
    if (!noAllMessageSec || !noAnnouncementsMessageSec) return;
    const hasVisible = [...cardMap.values()].some(({ clone }) => clone && !clone.classList.contains("hidden"));
    noAllMessageSec.classList.toggle("hidden", hasVisible);
    noAnnouncementsMessageSec.classList.add("hidden");
}

document.addEventListener("DOMContentLoaded", function () {
    const onlySeeBtn = document.getElementById("OnlyseeAnnouncements");
    const noAllMessage = document.getElementById("noAllMessage");
    const showAllBtn = document.getElementById("allAnnouncements");
    const noAnnouncementsMessage = document.getElementById("noAnnouncementsMessage");
    const showUnreadAnnounceBtn = document.getElementById("showUnreadAnnouncement");
    const showUnreadAllNotification = document.getElementById("showUnreadAllNotification");
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
            const notification = notificationData.find(n => Number(n.ID) === id);
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
            const notification = notificationData.find(n => Number(n.ID) === id);
            if (!notification) return;
            if (notification.Type === "Announcement") {
                const isUnread = original.querySelector(".notification-content").classList.contains("bg-unread");
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
            const isUnread = original.querySelector(".notification-content").classList.contains("bg-unread");
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
    onlySeeBtn.addEventListener("click", () => toggleVisibilityByType("Announcement"));
    showAllBtn.addEventListener("click", toggleVisibilityAll);
    showUnreadAnnounceBtn.addEventListener("click", toggleUnreadAnnouncements);
    showUnreadAllNotification.addEventListener("click", toggleUnreadNotifications);
});

document.addEventListener("DOMContentLoaded", function () {
    const onlySeeBtnSec = document.getElementById("OnlyseeAnnouncementsSec");
    const noAllMessageSec = document.getElementById("noAllMessageSec");
    const showAllBtnSec = document.getElementById("allAnnouncementsSec");
    const noAnnouncementsMessageSec = document.getElementById("noAnnouncementsMessageSec");
    const showUnreadAnnounceBtnSec = document.getElementById("showUnreadAnnouncementSec");
    const showUnreadAllNotificationSec = document.getElementById("showUnreadAllNotificationSec");
    let showUnreadModeSec = false;
    let showUnreadAllModeSec = false;
    function toggleVisibilityByTypeSec(type) {
        showUnreadAllModeSec = false;
        showUnreadModeSec = false;
        let hasAnnouncements = false;
        cardMap.forEach(({ clone }, id) => {
            const notification = notificationData.find(n => Number(n.ID) === id);
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
            const notification = notificationData.find(n => Number(n.ID) === id);
            if (!notification) return;
            if (notification.Type === "Announcement") {
                const isUnread = clone?.querySelector(".notification-content")?.classList.contains("bg-unread");
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
            const isUnread = clone?.querySelector(".notification-content")?.classList.contains("bg-unread");
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
        onlySeeBtnSec.addEventListener("click", () => toggleVisibilityByTypeSec("Announcement"));
    }
    if (showAllBtnSec) {
        showAllBtnSec.addEventListener("click", toggleVisibilityAllSec);
    }
    if (showUnreadAnnounceBtnSec) {
        showUnreadAnnounceBtnSec.addEventListener("click", toggleUnreadAnnouncementsSec);
    }
    if (showUnreadAllNotificationSec) {
        showUnreadAllNotificationSec.addEventListener("click", toggleUnreadNotificationsSec);
    }
});

document.addEventListener("DOMContentLoaded", function () {
    updateMarkAllReadVisibility();
    setTimeout(() => {
    if (notificationData.length === 0) {
    updateNoNotificationMessages();
    updateNoNotificationMessagesSec();
         }
  }, 5000);

});
