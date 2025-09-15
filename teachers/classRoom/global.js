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
            }, 4000);
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
    loadAssignments();
    renderSubmissions();
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



