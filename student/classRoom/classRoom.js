let selectedTab = "overview";
let currentUrl = window.location.href;
let match = currentUrl.match(/[?&]selectedTab=([^?&#]*)/);

function selectedTabChange(tabname) {
  let url = window.location.href;
  let match = url.match(/(\?|\&)eid=\d+/);
  if (!match) {
    return;
  }
  let eidIndex = url.indexOf(match[0]) + match[0].length;
  let newUrl = url.substring(0, eidIndex) + `&selectedTab=${tabname}`;
  window.history.replaceState(null, "", newUrl);
}

document.addEventListener("DOMContentLoaded", function () {
  let currentUrl = window.location.href;
  let tabMatch = currentUrl.match(/[?&]selectedTab=([^?&#]*)/);
  let selectedTab = tabMatch ? decodeURIComponent(tabMatch[1]) : null;
  let announcementMatch = currentUrl.match(
    /[?&]data-announcement-template-id=(\d+)/
  );
  let announcementId = announcementMatch ? announcementMatch[1] : null;
  let postMatch = currentUrl.match(/[?&]current-post-id=(\d+)/);
  let postId = postMatch ? postMatch[1] : null;
  function highlightElement() {
    let targetElement = null;
    if (selectedTab === "anouncemnt" && announcementId) {
      targetElement = document.querySelector(
        `[data-announcement-template-id="${announcementId}"]`
      );
    } else if (selectedTab === "courseChat" && postId) {
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

if (match) {
  selectedTab = decodeURIComponent(match[1]);
}

document.body.setAttribute("x-data", "{ selectedTab: `${selectedTab}`}");

const overviewElements = document.querySelectorAll('.overview');
if (overviewElements.length) {
    overviewElements.forEach((el) => {
        el.setAttribute('x-show', "selectedTab === 'overview'");
        el.setAttribute('id', 'tabpanelOverview');
        el.setAttribute('role', 'tabpanel');
        el.setAttribute('aria-label', 'overview');
    });
}

const announcementElements = document.querySelectorAll('.anouncemnt');
if (announcementElements.length) {
    announcementElements.forEach((el) => {
        el.setAttribute('x-show', "selectedTab === 'anouncemnt'");
        el.setAttribute('id', 'tabpanelanouncemnt');
        el.setAttribute('role', 'tabpanel');
        el.setAttribute('aria-label', 'anouncemnt');
    });
}

const courseChatElements = document.querySelectorAll('.courseChat');
if (courseChatElements.length) {
    courseChatElements.forEach((el) => {
        el.setAttribute('x-show', "selectedTab === 'courseChat'");
        el.setAttribute('id', 'tabpanelCourseChat');
        el.setAttribute('role', 'tabpanel');
        el.setAttribute('aria-label', 'courseChat');
    });
}

const contentElements = document.querySelectorAll('.content');
if (contentElements.length) {
    contentElements.forEach((el) => {
        el.setAttribute('x-show', "selectedTab === 'content'");
        el.setAttribute('id', 'tabpanelContent');
        el.setAttribute('role', 'tabpanel');
        el.setAttribute('aria-label', 'content');
    });
}

const progressElements = document.querySelectorAll('.courseProgress');
if (progressElements.length) {
    progressElements.forEach((el) => {
        el.setAttribute('x-show', "selectedTab === 'progress'");
        el.setAttribute('id', 'tabpanelProgress');
        el.setAttribute('role', 'tabpanel');
        el.setAttribute('aria-label', 'progress');
    });
}

const allPostsElements = document.querySelectorAll('.allPosts');
if (allPostsElements.length) {
    allPostsElements.forEach((el) => {
        el.setAttribute('x-show', "selectedTab === 'courseChat' && postTabs === 'allPosts'");
        el.setAttribute('id', 'tabpanelAllPosts');
        el.setAttribute('role', 'tabpanel');
        el.setAttribute('aria-label', 'all posts');
    });
}

const myPostsElements = document.querySelectorAll('.myPosts');
if (myPostsElements.length) {
    myPostsElements.forEach((el) => {
        el.setAttribute('x-show', "selectedTab === 'courseChat' && postTabs === 'myPosts'");
        el.setAttribute('id', 'tabpanelMyPosts');
        el.setAttribute('role', 'tabpanel');
        el.setAttribute('aria-label', 'my posts');
    });
}

const announcementsElements = document.querySelectorAll('.announcements');
if (announcementsElements.length) {
    announcementsElements.forEach((el) => {
        el.setAttribute('x-show', "selectedTab === 'courseChat' && postTabs === 'announcements'");
        el.setAttribute('id', 'tabpanelAnnouncements');
        el.setAttribute('role', 'tabpanel');
        el.setAttribute('aria-label', 'announcements');
    });
}

document.addEventListener("DOMContentLoaded", function () {
  var learningOutcomes = document
    .getElementById("allLearningOutcomes")
    .dataset.learningoutcomes.trim();
  var isEmpty = !learningOutcomes;

  if (isEmpty) {
    document.querySelectorAll(".hideIfNoLearningOutcome").forEach((el) => {
      el.style.display = "none";
    });
  }
});


if (selectedTab === "content" || selectedTab === "progress") {
  document.addEventListener("DOMContentLoaded", async () => {
    await fetchEnrollmentProgress();
    renderUnifiedModules();
  });
}

if (selectedTab === "anouncemnt") {
  fetchAnnouncements();
}

if (selectedTab === "courseChat") {
  loadPosts("all");
}

let assessmentoverviewBodyContainer = document.querySelectorAll(".assessmentoverviewBodyContainer");

assessmentoverviewBodyContainer.forEach((container) => {
  if (!overviewBody) {
    container.classList.add("hidden");
  } else {
    container.classList.remove("hidden");
  }
});

let textContent = document.querySelectorAll(".textContentContainer");

textContent.forEach((container) => {
  if (!contentBody.trim()) {
    container.classList.add("hidden");
  } else {
    container.classList.remove("hidden");
  }
});

document.addEventListener(
  "keydown",
  function (e) {
    if (e.key === "ArrowUp" || e.key === "ArrowDown") {
      e.stopPropagation();
    }
  },
  true
);



