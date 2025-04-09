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
          { where: { student_id: ${CONTACTss_ID} } }
          {
            andWhereGroup: [
              { where: { format: "Online Live" } }
              { orWhere: { format: "Online Tutor-led" } }
            ]
          }
          {
            andWhereGroup: [
              { where: { status: "New" } }
              { orWhere: { status: "Active" } }
            ]
          }
        ]
      ) {
        Class_ID: field(arg: ["class_id"])
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

async function initializeSocket() {
  if (document.hidden) return;
  const classIds = await fetchClassIds();
  if (!classIds || classIds.length === 0) {
    return;
  }
  classIds.forEach((classId) => {
    if (socketConnections.has(classId)) return;
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
          id: `subscription_${classId}`,
          type: "GQL_START",
          payload: {
            query: SUBSCRIPTION_QUERY,
            variables: {
              author_id: LOGGED_IN_CONTACT_ID,
              id: LOGGED_IN_CONTACT_ID,
              class_id: classId,
              created_at: createdAt,
            },
          },
        })
      );
    };
    socket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type !== "GQL_DATA") return;
      if (!data.payload || !data.payload.data) return;
      const result = data.payload.data.subscribeToCalcAnnouncements;
      if (!result) return;
      const notifications = Array.isArray(result) ? result : [result];
      notifications.forEach((notification) => {
        if (
          notification.Read_Contacts_Data_Read_Announcement_ID &&
          Number(notification.Read_Contacts_Data_Read_Contact_ID) ===
            Number(LOGGED_IN_CONTACT_ID)
        ) {
          readAnnouncements.add(Number(notification.ID));
        }
      });
      const filteredNotifications = notifications.filter((notification) => {
        const userId = Number(CONTACTss_ID);
        switch (notification.Notification_Type) {
          case "Posts":
            if (
              (user_Preference_Posts === "Yes" &&
                notification.Post_Author_ID === userId) ||
              (user_Preference_Post_Mentions === "Yes" &&
                notification.Contact_Contact_ID === userId)
            ) {
              return false;
            }
            break;
          case "Post Comments":
            if (
              (user_Preference_Post_Comments === "Yes" &&
                notification.Comment_Author_ID === userId) ||
              (user_Preference_Post_Comment_Mentions === "Yes" &&
                notification.Contact_Contact_ID === userId) ||
              (user_Preference_Comments_On_My_Posts === "Yes" &&
                notification.Comment_Author_ID === userId)
            ) {
              return false;
            }
            break;
          case "Submissions":
            if (
              (user_Preference_Submissions === "Yes" &&
                notification.Enrolment_Student_ID === userId) ||
              (user_Preference_Submission_Mentions === "Yes" &&
                notification.Contact_Contact_ID1 === userId)
            ) {
              return false;
            }
            break;
          case "Submission Comments":
            if (
              (user_Preference_Submission_Comments === "Yes" &&
                notification.Comment_Author_ID === userId) ||
              (user_Preference_Submission_Comment_Mentions === "Yes" &&
                notification.Contact_Contact_ID1 === userId) ||
              (user_Preference_Comments_On_My_Submissions === "Yes" &&
                notification.Comment_Author_ID === userId)
            ) {
              return false;
            }
            break;
          case "Announcements":
            if (
              (user_Preference_Announcements === "Yes" &&
                notification.Instructor_ID === userId) ||
              (user_Preference_Announcement_Mentions === "Yes" &&
                notification.Mentions_Contact_ID === userId)
            ) {
              return false;
            }
            break;
          case "Announcement Comments":
            if (
              (user_Preference_Announcement_Comments === "Yes" &&
                notification.Comment_Author_ID === userId) ||
              (user_Preference_Announcement_Comment_Mentions === "Yes" &&
                notification.Mentions_Contact_ID === userId) ||
              (user_Preference_Comments_On_My_Announcements === "Yes" &&
                notification.Comment_Author_ID === userId)
            ) {
              return false;
            }
            break;
        }
        return true;
      });
      if (filteredNotifications.length === 0) return;
      filteredNotifications.forEach((notification) => {
        processNotification(notification);
        notificationIDs.add(Number(notification.ID));
        notificationData.push(notification);
      });
      updateMarkAllReadVisibility();
    };
    socket.onerror = (error) => {};
    socket.onclose = () => {
      clearInterval(keepAliveInterval);
      socketConnections.delete(classId);
      if (!document.hidden) {
        setTimeout(() => {
          initializeSocket();
        }, 28000);
      }
    };
    socketConnections.set(classId, { socket, keepAliveInterval });
  });
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
  const notification_course_name = notification.Course_Course_Name || "Course";
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
    `${notification.Contact_First_Name || ""} ${
      notification.Contact_Last_Name || ""
    }`.trim() ||
    "Someone";
  const commentFullname =
    notification.CommentContact_Display_Name ||
    `${notification.CommentContact_First_Name || ""} ${
      notification.CommentContact_Last_Name || ""
    }`.trim() ||
    "Someone";
  const instructorDisplayName =
    notification.Instructor_Display_Name ||
    `${notification.Instructor_First_Name || ""} ${
      notification.Instructor_Last_Name || ""
    }`.trim() ||
    "Someone";
  const submissionDisplayName =
    notification.Contact_Display_Name5 ||
    `${notification.Contact_First_Name5 || ""} ${
      notification.Contact_Last_Name5 || ""
    }`.trim() ||
    "Someone";
  const submissitterDisplayName =
    notification.SubContact_Display_Name ||
    `${notification.SubContact_First_Name || ""} ${
      notification.SubContact_Last_Name || ""
    }`.trim() ||
    "Someone";
  const announcerrDisplayName =
    notification.AnnContact_Display_Name ||
    `${notification.AnnContact_First_Name1 || ""} ${
      notification.AnnContact_Last_Name || ""
    }`.trim() ||
    "Someone";
  let message = "";
  let messageContent = "";
  const usersId = String(CONTACTss_ID);
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
    <div data-my-id ="${
      notification.ID
    }" class="p-2 items-start gap-2 rounded justify-between notification-content w-full ${
    isRead ? "bg-white" : "bg-unread"
  } ${notification.Status === "Draft" ? "hidden" : "flex"}">
      <div class="flex flex-col gap-1">
        <div class="text-[#414042] text-xs font-semibold">
          ${message}
        </div>
        <div class="extra-small-text text-dark line-clamp-2">${messageContent}</div>
        <div class="text-[#586A80] extra-small-text">${
          notification.Course_Course_Name
        }</div>
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
      window.location.href = `https://courses.writerscentre.com.au/students/course-details/${notification.Course_Unique_ID}?eid=${notification.EnrolmentID}&selectedTab=courseChat?current-post-id=${notification.Post_ID}`;
    } else if (type === "Submissions" || type === "Submission Comments") {
      window.location.href = `https://courses.writerscentre.com.au/course-details/content/${notification.Lesson_Unique_ID1}?eid=${notification.EnrolmentID}`;
    } else {
      window.location.href = `https://courses.writerscentre.com.au/students/course-details/${notification.Course_Unique_ID}?eid=${notification.EnrolmentID}&selectedTab=anouncemnt?data-announcement-template-id=${anouncementScrollId}`;
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
