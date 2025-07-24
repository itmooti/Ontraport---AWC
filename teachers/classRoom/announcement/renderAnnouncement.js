function buildSchedfuled(createdAnnouncementID) {
    let statusFilter = `{
        andWhereGroup: [
          { where: { status: "Published" } }
          { orWhere: { instructor_id: ${currentPageUserID} } }
        ]
      }`;
    if (createdAnnouncementID) {
        statusFilter = `{ andWhere: { id: ${createdAnnouncementID} } }`;
    } else {
        if (
            document.getElementById("scheduledTabs") &&
            document.getElementById("scheduledTabs").classList.contains("activeTab")
        ) {
            statusFilter = ` { andWhere: { status: "Draft" } }
    { andWhere: { instructor_id: ${currentPageUserID} } }
    `;
        } else {
            statusFilter = ` {
        andWhereGroup: [
          { where: { status: "Published" } }
          { orWhere: { instructor_id: ${currentPageUserID} } }
        ]
      }`;
        }
    }
    return `
    query getAnnouncements {
      getAnnouncements(
        query: [
          { where: { class_id: ${currentPageClassID} } } 
          ${statusFilter}
        ]
        orderBy: [{ path: ["created_at"], type: desc }]
      ) {
        anouncementID: id
        anouncementTitle: title
        anouncementContent: content
        anouncementDateAdded: created_at
        anouncementInstructorID: instructor_id
        anouncementDisableComments: disable_comments
        anouncementStatus: status
        anouncementFileAttachement:attachment
        anouncementPostLaterDateTime: post_later_date_time
        anouncementAttachment: attachment
        Instructor {
          instructorFirstName: first_name
          instructorLastName: last_name
          instructorDisplayName: display_name
          instructorProfileImage: profile_image
        }
        mainAnnouncementVotedContactID: Contact_Who_Up_Voted_This_Announcements {
          likesInAnnouncementContactId: id
        }
        commentOnAnnouncement: ForumComments {
          commentPostedDate: created_at
          commentsId: id
          commentsComment: comment
          commentsAuthorId: author_id
          Author {
            commentsAuthorDisplayName: display_name
            commentsAuthorFirstName: first_name
            commentsAuthorLastName: last_name
            commentsAuthorProfileImage: profile_image
          }
          Member_Comment_Upvotes {
            likesInCommentContactId: id
          }
          repliesOnComments: ForumComments {
            repliesPostedDate: created_at
            repliesComment: comment
            repliesId: id
            repliesAuthorID :author_id
            Author {
              repliesAuthorDisplayName: display_name
              repliesAuthorFirstName: first_name
              repliesAuthorLastName: last_name
              repliesAuthorProfileImage: profile_image
            }
            Member_Comment_Upvotes {
              likesInReplyContactId: id
            }
          }
        }
      }
    }
  `;
}
// For Unix timestamps in seconds, multiply by 1000.
// Helper function to return relative time or Australian date format (dd/mm/yyyy)
function parseUnix(dateInput) {
    return new Date(dateInput * 1000);
}

function relativeTime(unixTimestamp) {
    const now = new Date();
    const past = parseUnix(unixTimestamp);
    const diffMs = now - past;
    const diffSec = diffMs / 1000;
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 1) return "just now";
    if (diffMin < 60) return diffMin + " min ago";
    const diffHrs = Math.floor(diffMin / 60);
    if (diffHrs < 24) return diffHrs + " hrs ago";
    const diffDays = Math.floor(diffHrs / 24);
    if (diffDays < 5) return diffDays + " day ago";
    // If 5 days or older, return date in dd/mm/yyyy format (Australian)
    const day = past.getDate().toString().padStart(2, "0");
    const month = (past.getMonth() + 1).toString().padStart(2, "0");
    const year = past.getFullYear();
    return `${day}/${month}/${year}`;
}

// Helper function to get a display name from an author object
function getDisplayName(author, type) {
    if (type === "comment") {
        if (author.commentsAuthorDisplayName)
            return author.commentsAuthorDisplayName;
        if (author.commentsAuthorFirstName || author.commentsAuthorLastName)
            return (
                (author.commentsAuthorFirstName || "") +
                " " +
                (author.commentsAuthorLastName || "")
            );
    } else if (type === "reply") {
        if (author.repliesAuthorDisplayName) return author.repliesAuthorDisplayName;
        if (author.repliesAuthorFirstName || author.repliesAuthorLastName)
            return (
                (author.repliesAuthorFirstName || "") +
                " " +
                (author.repliesAuthorLastName || "")
            );
    }
    return "Anamolous";
}

function getProfileImage(imageUrl) {
    const unwantedUrl = "https://i.ontraport.com/abc.jpg";
    const defaultUrl =
        "https://files.ontraport.com/media/b0456fe87439430680b173369cc54cea.php03bzcx?Expires=4895186056&Signature=fw-mkSjms67rj5eIsiDF9QfHb4EAe29jfz~yn3XT0--8jLdK4OGkxWBZR9YHSh26ZAp5EHj~6g5CUUncgjztHHKU9c9ymvZYfSbPO9JGht~ZJnr2Gwmp6vsvIpYvE1pEywTeoigeyClFm1dHrS7VakQk9uYac4Sw0suU4MpRGYQPFB6w3HUw-eO5TvaOLabtuSlgdyGRie6Ve0R7kzU76uXDvlhhWGMZ7alNCTdS7txSgUOT8oL9pJP832UsasK4~M~Na0ku1oY-8a7GcvvVv6j7yE0V0COB9OP0FbC8z7eSdZ8r7avFK~f9Wl0SEfS6MkPQR2YwWjr55bbJJhZnZA__&Key-Pair-Id=APKAJVAAMVW6XQYWSTNA";
    if (!imageUrl || imageUrl.trim() === "" || imageUrl === unwantedUrl) {
        return defaultUrl;
    }
    return imageUrl;
}

// Helper function to count likes in an array
function countLikes(likesArray) {
    return likesArray && likesArray.length ? likesArray.length : 0;
}

function hasVoted(likesArray, type) {
    let contactId = currentPageUserID;
    if (!likesArray || !likesArray.length) return false;
    if (type === "announcement") {
        return likesArray.some(
            (like) => like.likesInAnnouncementContactId == contactId
        );
    } else if (type === "comment") {
        return likesArray.some((like) => like.likesInCommentContactId == contactId);
    } else if (type === "reply") {
        return likesArray.some((like) => like.likesInReplyContactId == contactId);
    }
    return false;
}

// Sanitize fetched data to avoid null values
function sanitizeAnnouncements(announcements) {
    return announcements.map((announcement) => {
        if (typeof announcement.anouncementAttachment === "string" && announcement.anouncementAttachment.trim() !== "") {
            try {
                const parsed = JSON.parse(announcement.anouncementAttachment);
                // If it's a valid JSON with expected fields
                announcement.attachmentObject = {
                    link: parsed.link || "",
                    name: parsed.name || "Attachment", // 👈 Default if not present
                };
            } catch {
                // If it's just a plain quoted string URL
                const cleaned = announcement.anouncementAttachment.replace(/^"+|"+$/g, ""); // remove outer quotes
                announcement.attachmentObject = {
                    link: cleaned,
                    name: "Attachment", // 👈 Default name
                };
            }
        } else {
            announcement.attachmentObject = null;
        }

        // Set default Instructor if missing
        announcement.Instructor = announcement.Instructor || {
            instructorDisplayName: "Unknown",
            instructorProfileImage: "",
        };
        // Ensure likes array exists for the announcement
        announcement.mainAnnouncementVotedContactID =
            announcement.mainAnnouncementVotedContactID || [];
        // Sanitize comments array
        if (
            announcement.commentOnAnnouncement &&
            Array.isArray(announcement.commentOnAnnouncement)
        ) {
            announcement.commentOnAnnouncement =
                announcement.commentOnAnnouncement.map((comment) => {
                    comment.Author = comment.Author || {
                        commentsAuthorDisplayName: "Unknown",
                        commentsAuthorProfileImage: "",
                    };
                    comment.Member_Comment_Upvotes = comment.Member_Comment_Upvotes || [];
                    if (
                        comment.repliesOnComments &&
                        Array.isArray(comment.repliesOnComments)
                    ) {
                        comment.repliesOnComments = comment.repliesOnComments.map(
                            (reply) => {
                                reply.Author = reply.Author || {
                                    repliesAuthorDisplayName: "Unknown",
                                    repliesAuthorProfileImage: "",
                                };
                                reply.Member_Comment_Upvotes =
                                    reply.Member_Comment_Upvotes || [];
                                return reply;
                            }
                        );
                    } else {
                        comment.repliesOnComments = [];
                    }
                    return comment;
                });
        } else {
            announcement.commentOnAnnouncement = [];
        }
        return announcement;
    });
}

// Register helper functions with JsRender
// $.views.helpers({ relativeTime, getDisplayName, getProfileImage, countLikes, hasVoted });
// Register helper functions with JsRender
$.views.helpers({
    elapsedAnnouncementTime: relativeTime,
    relativeTime,
    getDisplayName,
    elapseddisplayName: getDisplayName,
    getProfileImage,
    elapsedprofileImage: getProfileImage,
    countLikes,
    elapsedlikeCount: countLikes,
    hasVoted,
    elapsedvoted: hasVoted,
});

async function fetchAnnouncements() {
    $("#announcementsContainer").html(`
        <div class="skeleton-container w-full">
  <div class="skeleton-card skeleton-shimmer"></div>
  <div class="skeleton-card skeleton-shimmer"></div>
  <div class="skeleton-card skeleton-shimmer"></div>
</div>`);
    const query = buildSchedfuled();
    try {
        const response = await fetch(apiUrlForAnouncement, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Api-Key": apiKeyForAnouncement,
            },
            body: JSON.stringify({ query }),
        });
        const jsonData = await response.json();
        let announcements = jsonData.data.getAnnouncements || [];
        // Sanitize the data to avoid null errors
        announcements = sanitizeAnnouncements(announcements);
        renderAnnouncements(announcements);
    } catch (error) {
        console.error("Error fetching announcements:", error);
    }
}

function renderAnnouncements(announcements) {
    const template = $.templates("#announcementTemplate");
    const htmlOutput = template.render({ announcements });
    $("#announcementsContainer").html(htmlOutput);
}

// Function to fetch a comment by its ID using the provided GraphQL query
async function fetchCommentById(commentId) {
    const getCommentQuery = `
    query getForumComments($id: AwcForumCommentID) {
      getForumComments(query: [{ where: { id: $id } }]) {
        commentPostedDate: created_at
        commentsId: id
        commentsComment: comment
        commentsAuthorId: author_id
        Author {
          commentsAuthorDisplayName: display_name
          commentsAuthorFirstName: first_name
          commentsAuthorLastName: last_name
          commentsAuthorProfileImage: profile_image
        }
        Member_Comment_Upvotes {
          likesInCommentContactId: id
        }
      }
    }
  `;
    const response = await fetch(apiUrlForAnouncement, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Api-Key": apiKeyForAnouncement,
        },
        body: JSON.stringify({
            query: getCommentQuery,
            variables: { id: commentId },
        }),
    });
    const jsonData = await response.json();
    return jsonData.data.getForumComments[0];
}

async function createForumComment(
    parentAnnouncementId,
    parentCommentID,
    mentionedIds,
    comments
) {
    const textAreas = document.querySelectorAll(".formTextArea");
    textAreas.forEach((el) => {
        el.setAttribute(
            "data-prev-contenteditable",
            el.getAttribute("contenteditable")
        );
        el.removeAttribute("contenteditable");
        el.style.opacity = "0.5";
    });
    const payload = {
        parent_announcement_id: parentAnnouncementId,
        reply_to_comment_id: parentCommentID,
        comment: comments,
        author_id: currentPageUserID,
        Mentions: mentionedIds.map((id) => ({
            id: id,
            has__new__notification: true,
        })),
    };
    const mutation = `
    mutation createForumComment($payload: ForumCommentCreateInput) {
      createForumComment(payload: $payload) {
        author_id
        comment
        id
        parent_announcement_id
        reply_to_comment_id 
        Mentions {
          id
          has__new__notification 
        }
      }
    }
  `;
    const response = await fetch(apiUrlForAnouncement, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Api-Key": apiKeyForAnouncement,
        },
        body: JSON.stringify({ query: mutation, variables: { payload } }),
    });
    const result = await response.json();
    const newCommentId = result.data.createForumComment.id;
    await updateMentionedContacts(mentionedIds);


    const newComment = await fetchCommentById(newCommentId);
    if (parentCommentID === null) {
        // Top-level comment: Use commentTemplate and append to announcement's replies container.
        const commentTemplate = $.templates("#commentAnnouncementTemplate");
        const commentHtml = commentTemplate.render(newComment);
        const announcementEl = document.querySelector(
            `[data-announcement-template-id="${parentAnnouncementId}"]`
        );
        if (announcementEl) {
            const repliesContainer =
                announcementEl.querySelector(".repliesContainer");
            if (repliesContainer) {
                $(repliesContainer).append(commentHtml);
            }
        }
    } else {
        const replyTemplate = $.templates("#replyAnnouncementTemplate");
        const replyHtml = replyTemplate.render(newComment);
        const parentCommentEl = document.querySelector(
            `[data-reply-id="${parentCommentID}"]`
        );
        if (parentCommentEl) {
            let repliesContainer = parentCommentEl.querySelector(
                ".repliesOfReplyContainer"
            );
            if (!repliesContainer) {
                repliesContainer = document.createElement("div");
                repliesContainer.className =
                    "repliesOfReplyContainer w-full flex flex-col gap-2";
                parentCommentEl.appendChild(repliesContainer);
            }
            $(repliesContainer).append(replyHtml);
        }
    }
    textAreas.forEach((el) => {
        const prev = el.getAttribute("data-prev-contenteditable") || "true";
        el.setAttribute("contenteditable", prev);
        el.style.opacity = "1";
        el.innerText = "";
    });
    return result;
}

// Delete Announcemnt
async function deleteAnnouncement(id) {
    const query = `
    mutation deleteAnnouncement($id: AwcAnnouncementID) {
      deleteAnnouncement(query: [{ where: { id: $id } }]) {
        id
      }
    }
  `;
    const announcementEl = document.querySelector(
        `[data-announcement-template-id="${id}"]`
    );
    if (announcementEl) announcementEl.style.opacity = "0.6";
    try {
        const response = await fetch(apiUrlForAnouncement, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Api-Key": apiKeyForAnouncement,
            },
            body: JSON.stringify({ query, variables: { id } }),
        });
        const result = await response.json();
        if (result.data?.deleteAnnouncement) {
            if (announcementEl) announcementEl.remove();
        } else {
            if (announcementEl) announcementEl.style.opacity = "1";
        }
    } catch (error) {
        if (announcementEl) announcementEl.style.opacity = "1";
        console.error("Error deleting announcement:", error);
    }
}

// delete Comment and replies
async function deleteComment(replyID) {
    const query = `
    mutation deleteForumComment($id: AwcForumCommentID) {
      deleteForumComment(query: [{ where: { id: $id } }]) {
        id
      }
    }
  `;
    const replyEl = document.querySelector(`[data-reply-id="${replyID}"]`);
    if (replyEl) replyEl.style.opacity = "0.6";

    try {
        const response = await fetch(apiUrlForAnouncement, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Api-Key": apiKeyForAnouncement,
            },
            body: JSON.stringify({ query, variables: { id: replyID } }),
        });
        const result = await response.json();
        if (result.data?.deleteForumComment) {
            replyEl.remove();
        } else {
            if (replyEl) replyEl.style.opacity = "1";
        }
    } catch (error) {
        if (replyEl) replyEl.style.opacity = "1";
        console.error("Error deleting reply:", error);
    }
}

// create or delete vote from announcement
async function createContactVotedAnnouncement(announcementId) {
    const el = document.getElementById(`vote-${announcementId}`);
    const counterEl = el ? el.querySelector(".voteCounter") : null;
    const updateCounter = (delta) => {
        if (counterEl) {
            const currentCount = parseInt(counterEl.innerText, 10) || 0;
            counterEl.innerText = currentCount + delta;
        }
    };
    if (el && el.classList.contains("voted")) {
        const deleteQuery = `
      mutation deleteContactVotedAnnouncement {
        deleteContactVotedAnnouncement(
          query: [
            {where: {contact_who_up_voted_this_announcement_id: ${currentPageUserID}}},{andWhere: {announcement_that_this_contact_has_up_voted_id: ${announcementId}}}]) {id}}
    `;
        try {
            const response = await fetch(apiUrlForAnouncement, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Api-Key": apiKeyForAnouncement,
                },
                body: JSON.stringify({ query: deleteQuery }),
            });
            const result = await response.json();
            if (result.data && result.data.deleteContactVotedAnnouncement && el) {
                el.classList.remove("voted");
                updateCounter(-1);
            }
            return result;
        } catch (error) {
            console.error("Error deleting contact voted announcement:", error);
        }
        return;
    }

    // If not already voted, proceed with the create mutation
    const payload = {
        announcement_that_this_contact_has_up_voted_id: announcementId,
        contact_who_up_voted_this_announcement_id: currentPageUserID,
    };

    const createQuery = `
    mutation createContactVotedAnnouncement($payload: ContactVotedAnnouncementCreateInput = null) {
      createContactVotedAnnouncement(payload: $payload) {
        announcement_that_this_contact_has_up_voted_id
        contact_who_up_voted_this_announcement_id
      }
    }
  `;

    try {
        const response = await fetch(apiUrlForAnouncement, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Api-Key": apiKeyForAnouncement,
            },
            body: JSON.stringify({ query: createQuery, variables: { payload } }),
        });
        const result = await response.json();
        if (result.data && result.data.createContactVotedAnnouncement && el) {
            el.classList.add("voted");
            updateCounter(1);
        }
        return result;
    } catch (error) {
        console.error("Error creating contact voted announcement:", error);
    }
}

// create or delete upvote for a forum comment
async function createMemberCommentUpvotesForumCommentUpvotes(commentId) {
    const el = document.getElementById(`vote-${commentId}`);
    const counterEl = el ? el.querySelector(".voteCounter") : null;
    const updateCounter = (delta) => {
        if (counterEl) {
            const currentCount = parseInt(counterEl.innerText, 10) || 0;
            counterEl.innerText = currentCount + delta;
        }
    };

    // If already upvoted, call the delete mutation to remove the upvote
    if (el && el.classList.contains("voted")) {
        const deleteQuery = `
      mutation deleteMemberCommentUpvotesForumCommentUpvotes {
        deleteMemberCommentUpvotesForumCommentUpvotes(
          query: [
            { where: { forum_comment_upvote_id: ${commentId} } }
            { andWhere: { member_comment_upvote_id: ${currentPageUserID} } }
          ]
        ) {
          id
        }
      }
    `;
        try {
            const response = await fetch(apiUrlForAnouncement, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Api-Key": apiKeyForAnouncement,
                },
                body: JSON.stringify({ query: deleteQuery }),
            });
            const result = await response.json();
            if (
                result.data &&
                result.data.deleteMemberCommentUpvotesForumCommentUpvotes &&
                el
            ) {
                el.classList.remove("voted");
                updateCounter(-1);
            }
            return result;
        } catch (error) {
            console.error("Error deleting member comment upvote:", error);
        }
        return;
    }

    // If not already upvoted, proceed with the create mutation
    const payload = {
        forum_comment_upvote_id: commentId,
        member_comment_upvote_id: currentPageUserID,
    };

    const createQuery = `
    mutation createMemberCommentUpvotesForumCommentUpvotes($payload: MemberCommentUpvotesForumCommentUpvotesCreateInput = null) {
      createMemberCommentUpvotesForumCommentUpvotes(payload: $payload) {
        member_comment_upvote_id
        forum_comment_upvote_id
      }
    }
  `;

    try {
        const response = await fetch(apiUrlForAnouncement, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Api-Key": apiKeyForAnouncement,
            },
            body: JSON.stringify({ query: createQuery, variables: { payload } }),
        });
        const result = await response.json();
        if (
            result.data &&
            result.data.createMemberCommentUpvotesForumCommentUpvotes &&
            el
        ) {
            el.classList.add("voted");
            updateCounter(1);
        }
        return result;
    } catch (error) {
        console.error("Error creating member comment upvote:", error);
    }
}
