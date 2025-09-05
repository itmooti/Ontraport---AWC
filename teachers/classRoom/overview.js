document.addEventListener("DOMContentLoaded", (event) => {
    const noAnnouncementCard = document.querySelector(".showIfNoAnnouncements");
    const announcementCard = document.querySelector(".showIfAnnouncements");

    const announcementWrapper = announcementCard.querySelectorAll(".announcementWrapper");
    if (announcementWrapper.length === 0) {
        announcementCard.classList.add("hidden");
        noAnnouncementCard.classList.remove("hidden");
    } else {
        announcementCard.classList.remove("hidden");
        noAnnouncementCard.classList.add("hidden");
    }
});

document.addEventListener("DOMContentLoaded", (event) => {
    const noSubmissionsCard = document.querySelector(".showIfNoSubmissions");
    const submissionsCard = document.querySelector(".showIfSubmissions");

    const submissionWrapper = submissionsCard.querySelectorAll(".submissionWrapper");
    if (submissionWrapper.length === 0) {
        submissionsCard.classList.add("hidden");
        noSubmissionsCard.classList.remove("hidden");
    } else {
        submissionsCard.classList.remove("hidden");
        noSubmissionsCard.classList.add("hidden");
    }
});

document.addEventListener("DOMContentLoaded", () => {
    const mentionsWrappers = document.querySelectorAll('.mentionsWrapper');
    const noMentionsCard = document.querySelector('.showIfNoMentions');
    const mentionsCountDiv = document.querySelector('.mentionsCount');

    const mentionsCountLength = mentionsWrappers.length;
    mentionsCountDiv.textContent = mentionsCountLength;

    if (mentionsCountLength === 0) {
        noMentionsCard.classList.remove('hidden');
    }

    function decodeAndStrip(html) {
        const txt = document.createElement("textarea");
        txt.innerHTML = html;
        const decoded = txt.value;

        const tempDiv = document.createElement("div");
        tempDiv.innerHTML = decoded;

        return tempDiv.textContent || tempDiv.innerText || "";
    }

    const contentElements = document.querySelectorAll('.text-bodyText');
    contentElements.forEach(el => {
        const txt = document.createElement("textarea");
        txt.innerHTML = el.innerHTML;
        const decoded = txt.value;
        el.innerHTML = decoded;
    });

    const items = Array.from(document.querySelectorAll('.mentionsWrapper'));
    items.sort((a, b) => {
        return new Date(b.getAttribute('data-date-added')) - new Date(a.getAttribute('data-date-added'));
    });
    const container = items[0]?.parentElement;
    if (container) {
        container.innerHTML = "";
        items.forEach(item => container.appendChild(item));
    }
});
// scroll to dedicated announcement
async function scrollToAnnouncementDiv(event) {
    await fetchAnnouncements();
    setTimeout(() => {
        let announcementID = event;
        let targetDiv = document.querySelector(`[data-announcement-template-id="${announcementID}"]`);
        if (targetDiv) {
            setTimeout(() => {
                targetDiv.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }, 100);
            targetDiv.classList.add('highlightTheSelected');
        }
    }, 2000);
}
document.addEventListener("DOMContentLoaded", function () {
    document.querySelectorAll(".mentionsWrapper").forEach(function (wrapper) {
        let postId = wrapper.getAttribute("data-postid") || wrapper.getAttribute("data-postidfromcomment");
        // Add Click Event
        wrapper.addEventListener("click", function (event) {
            scrollToPostDiv(postId);
        });
    });
});

async function scrollToPostDiv(postId) {
    await loadPosts('all');
    setTimeout(() => {
        let targetPostDiv = document.querySelector(`[current-post-id="${postId}"]`);
        if (targetPostDiv) {
            setTimeout(() => {
                targetPostDiv.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }, 100);
            targetPostDiv.classList.add('highlightTheSelected');
        }
    }, 3000);
}
document.addEventListener("DOMContentLoaded", function () {
    document.querySelectorAll(".submissionsWrapper").forEach(function (wrapper) {
        let defaultImg = "https://files.ontraport.com/media/eb5d901d928f4785a1e822bf73b36dd5.phputv7sh?Expires=4894601831&Signature=GQ7WjKautIfQxGpAhXJSPQ0X7tkOoiSlZagd7jmsyczuwPuQbsaUpGM3Pr~X7bBy-XSgaSvMmtvD-aK2jt636xuzOe7rqhoNp8zBhdbCoL1vq1cjiPp6u9y-32aCcbvAy0q9Z8y~l~NUVhzQebwxkxR3cteDIpSEIsw2N6HkwsRx3D-fi6eKhLoYQcWwRUeJsruNfd92~WcQ30grIPC~fyQABaEiQ787AhshCNZt2J0W3V8gRi40fwD8WI1LotYlUWuGNPE9FF6zzMdu-v5~kqmxN8oAIFV-kKLQ4oY-D8keftNN8ZyaJPgh0qYAfBQS6X4PE8gMo349tKjNG84yvw__&Key-Pair-Id=APKAJVAAMVW6XQYWSTNA";
        let studentImg = wrapper.querySelector(".student-profile-img");
        if (studentImg && (!studentImg.getAttribute("src") || studentImg.getAttribute("src").trim() === "")) {
            studentImg.setAttribute("src", defaultImg);
        }
    });
});
