function sendHeight(height) {
    window.parent.postMessage({
        iframeHeight: height,
        iframeSrc: window.location.href
    }, "*");
}
function calculateHeight() {
    requestAnimationFrame(() => {
        let contentElement = document.querySelector(".contentContainer");
        if (contentElement) {
            let newHeight = contentElement.getBoundingClientRect().height;
            sendHeight(newHeight);
        }
    });
}
// Observe the specific content element for height changes
const resizeObserver = new ResizeObserver(() => calculateHeight());
let contentElement = document.querySelector("#contentContainer");
if (contentElement) {
    resizeObserver.observe(contentElement);
}
document.addEventListener("click", (event) => {
    const toggleButton = event.target.closest(".actionToggleButton");

    if (toggleButton) {
        const wrapper = toggleButton.querySelector(".actionItemsWrapper");

        document.querySelectorAll(".actionItemsWrapper").forEach((item) => {
            if (item !== wrapper) {
                item.classList.add("hidden");
            }
        });

        if (wrapper) {
            wrapper.classList.toggle("hidden");
            calculateHeight();
        }
    } else {
        document.querySelectorAll(".actionItemsWrapper").forEach((item) => {
            item.classList.add("hidden");
        });
        calculateHeight();
    }
    const toggleReplyForm = event.target.closest('[data-replyformtoggle]');
    if (toggleReplyForm) {
        const id = toggleReplyForm.getAttribute('data-replyformtoggle');
        const replyForm = document.querySelector(`[data-replyform="${id}"]`);
        if (replyForm) {
            replyForm.classList.toggle("hidden");
            calculateHeight();
        }
    }
});
window.onload = calculateHeight;

function requestDueDateIfNeeded() {
    window.parent.postMessage({ requestDueDate: true }, "https://courses.writerscentre.com.au");
}
// Listen for the Due Date from the parent page
window.addEventListener("message", function (event) {
    if (event.origin !== "https://courses.writerscentre.com.au") return;
    const dueDate = event.data.dueDate;
    if (dueDate) {
        document.querySelector('.mainwrapperforDueIframe').classList.remove('hidden');
        const elements = document.querySelectorAll(".dueDateClass");
        elements.forEach(element => {
            element.innerText = dueDate;
        });
    }
});

// If the iframe loads late, request the Due Date from the parent
window.addEventListener("load", requestDueDateIfNeeded);
document.addEventListener("DOMContentLoaded", requestDueDateIfNeeded);

function gatherMentionsFromElement(el) {
    const mentionEls = el.querySelectorAll(".mention-handle[data-mention-id]");
    return [...mentionEls].map(m => m.getAttribute("data-mention-id"));
}

const API = {
    endpoint: GRAPHQL_ENDPOINT,
    apiKey: API_KEY,

    async fetchGraphQL(query, variables = {}) {
        try {
            const response = await fetch(this.endpoint, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Api-Key": this.apiKey,
                },
                body: JSON.stringify({ query, variables }),
            });

            const result = await response.json();
            if (result.errors) {
                throw new Error("GraphQL Error");
            }
            return result.data;
        } catch (error) {
            throw error;
        }
    },
};

const SubmissionService = {
    async fetchComments(submissionID) {
        const data = await API.fetchGraphQL(FETCH_SUBMISSIONS_COMMENTS_QUERY, { id: submissionID });
        return data.calcForumComments.map((comment) => {
            let file = null;
            if (comment.File && comment.File !== "{}") {
                try {
                    file = JSON.parse(comment.File);
                    if (!file.link || !file.name) {
                        file = null;
                    }
                } catch (error) { }
            }

            return {
                Comment: comment.Comment,
                Author_Display_Name: comment.Author_Display_Name,
                Author_ID: comment.Author_ID,
                Author_First_Name: comment.Author_First_Name,
                Author_Last_Name: comment.Author_Last_Name,
                Author_Profile_Image: comment.Author_Profile_Image,
                Date_Added: formatDateTimeFromUnix(comment.Date_Added),
                File: file,
                ID: comment.ID,
            };
        });
    },
    async fetchVotersForSubmission(submissionID) {
        const data = await API.fetchGraphQL(FETCH_SUBMISSION_VOTERS_QUERY, { id: submissionID });
        const submissions = data.calcSubmissions || [];
        return submissions
            .filter(submission => submission.Voters_DataID !== null && submission.Voters_Contact_ID !== null)
            .map(submission => ({
                voteID: submission.Voters_DataID,
                voterID: submission.Voters_Contact_ID,
            }));
    },
    async fetchStudents(classId) {
        const data = await API.fetchGraphQL(FETCH_STUDENTS_QUERY, { id: classId });
        return data.calcEnrolments.map(student => ({
            Student_Display_Name: student.Student_Display_Name,
            Student_First_Name: student.Student_First_Name,
            Student_Last_Name: student.Student_Last_Name,
            Student_Unique_ID: student.Student_Unique_ID,
            Student_Profile_Image: student.Student_Profile_Image,
        }));
    },
    async createVoteForSubmission(voterId, submissionID) {
        const variables = { payload: { voter_id: voterId, voted_submission_id: submissionID } };
        return API.fetchGraphQL(CREATE_VOTE_ON_SUBMISSION_MUTATION_QUERY, variables);
    },
    async deleteVoteForSubmission(voteId) {
        return API.fetchGraphQL(DELETE_VOTE_ON_SUBMISSION_MUTATION_QUERY, { id: voteId });
    },
    async createComment(authorID, submissionID, commentContentHTML, mentionArrays = [], fileData) {
        const variables = {
            payload: {
                author_id: authorID,
                submissions_id: submissionID,
                comment: commentContentHTML,
                Mentions: mentionArrays.map(id => ({ unique_id: id })),
                file: fileData,
            },
        };

        return API.fetchGraphQL(CREATE_COMMENT_MUTATION_QUERY, variables);
    },
    async deleteComment(commentId) {
        return API.fetchGraphQL(DELETE_COMMENT_MUTATION_QUERY, { id: commentId });
    },
    async deleteReply(replyId) {
        return API.fetchGraphQL(DELETE_COMMENT_MUTATION_QUERY, { id: replyId });
    },
};

const CommentsService = {
    async fetchReplies(parentCommentID) {
        const data = await API.fetchGraphQL(FETCH_REPLIES_QUERY, { id: parentCommentID });
        return data.calcForumComments.map(reply => ({
            Comment: reply.Comment,
            Author_ID: reply.Author_ID,
            Author_Display_Name: reply.Author_Display_Name,
            Author_First_Name: reply.Author_First_Name,
            Author_Last_Name: reply.Author_Last_Name,
            Author_Profile_Image: reply.Author_Profile_Image,
            Date_Added: formatDateTimeFromUnix(reply.Date_Added),
            ID: reply.ID,
        }));
    },
    async createCommentOnReply(replyToCommentId, replyContentHTML, mentions = []) {
        const variables = {
            payload: {
                author_id: authorID,
                reply_to_comment_id: replyToCommentId,
                comment: replyContentHTML,
                Mentions: mentions.map(id => ({ unique_id: id })),
            },
        };

        return API.fetchGraphQL(CREATE_REPLY_ON_COMMENT_MUTATION_QUERY, variables);
    },
};

const UI = {
    updateComments(comments) {
        const commentTemplate = $.templates("#submissionsCommentTemplate");
        if (commentsContainer) {
            commentsContainer.innerHTML = comments.map(comment => commentTemplate.render(comment)).join("");
        }
        UI.updateCommentCount(comments.length);
    },
    updateCommentCount(count) {
        if (commentCountElement) {
            commentCountElement.textContent = `${count}`;
        }
    },
    updateReplies(replyToCommentId, repliesForComment) {
        const repliesContainer = document.querySelector(`.replies-container[data-parentcommentid="${replyToCommentId}"]`);
        const repliesTemplate = $.templates("#repliesTemplate");

        if (repliesContainer) {
            repliesContainer.innerHTML = repliesForComment.map(reply => repliesTemplate.render(reply)).join("");
        }
        UI.updateReplyCount(replyToCommentId, repliesForComment.length);
    },
    updateReplyCount(replyToCommentId, count) {
        const replyCountElement = document.querySelector(`[data-replycount="replyCount-${replyToCommentId}"]`);
        if (replyCountElement) {
            replyCountElement.textContent = count;
        }
    },
    updateSubmissionVoteButton() {
        if (hasVotedForSubmission) {
            submissionVoteButton.classList.add("voted");
        } else {
            submissionVoteButton.classList.remove("voted");
        }
        submissionVoteCountElement.textContent = voteCountForSubmissions;
    },
};

const handleVotesForSubmission = {
    async createVoteForSubmission() {
        hasVotedForSubmission = true;
        voteCountForSubmissions += 1;
        UI.updateSubmissionVoteButton();

        try {
            const result = await SubmissionService.createVoteForSubmission(authorID, submissionID);
            submissionVoters.push({
                voteID: result.createOVoterVotedSubmission.voted_submission_id,
                voterID: result.createOVoterVotedSubmission.voter_id,
            });
        } catch (error) {
            hasVotedForSubmission = false;
            voteCountForSubmissions -= 1;
            UI.updateSubmissionVoteButton();
        }
    },
    async deleteVoteForSubmission() {
        const voteToDelete = submissionVoters.find(voter => voter.voterID === parseInt(authorID));
        if (!voteToDelete) {
            return;
        }
        hasVotedForSubmission = false;
        voteCountForSubmissions -= 1;
        UI.updateSubmissionVoteButton();

        try {
            await SubmissionService.deleteVoteForSubmission(voteToDelete.voteID);
            // Corrected variable name here:
            submissionVoters = submissionVoters.filter(voter => voter.voteID !== voteToDelete.voteID);
        } catch (error) {
            hasVotedForSubmission = true;
            voteCountForSubmissions += 1;
            UI.updateSubmissionVoteButton();
        }
    },
};

submissionVoteButton.addEventListener("click", () => {
    if (hasVotedForSubmission) {
        handleVotesForSubmission.deleteVoteForSubmission();
    } else {
        handleVotesForSubmission.createVoteForSubmission();
    }
});

const handleVotesForComments = {
    async fetchVotersForComments(commentID) {
        try {
            const data = await API.fetchGraphQL(FETCH_COMMENTS_VOTERS_QUERY, { id: commentID });
            const voters = data.calcForumComments || [];
            return voters
                .filter(voter => voter.Member_Comment_Upvotes_Contact_ID !== null && voter.Member_Comment_Upvotes_DataID !== null)
                .map(voter => ({
                    voterID: voter.Member_Comment_Upvotes_Contact_ID,
                    voteID: voter.Member_Comment_Upvotes_DataID,
                }));
        } catch (error) {
            return [];
        }
    },
    async createVoteForComment(commentID) {
        const voteButton = document.querySelector(`[data-commentvoteid="${commentID}"]`);
        const voteCountElement = document.querySelector(`[data-commentvotecountelement="${commentID}"]`);
        const currentVotes = parseInt(voteCountElement.textContent, 10) || 0;
        voteButton.classList.add("voted");
        voteCountElement.textContent = currentVotes + 1;

        try {
            const result = await API.fetchGraphQL(CREATE_VOTE_ON_COMMENT_MUTATION_QUERY, {
                payload: {
                    member_comment_upvote_id: authorID,
                    forum_comment_upvote_id: commentID,
                },
            });
        } catch (error) {
            voteButton.classList.remove("voted");
            voteCountElement.textContent = currentVotes;
        }
    },
    async deleteVoteForComment(commentID) {
        const voteButton = document.querySelector(`[data-commentvoteid="${commentID}"]`);
        const voteCountElement = document.querySelector(`[data-commentvotecountelement="${commentID}"]`);
        const currentVotes = parseInt(voteCountElement.textContent, 10) || 0;
        voteButton.classList.remove("voted");
        voteCountElement.textContent = Math.max(currentVotes - 1, 0);
        try {
            const voters = await this.fetchVotersForComments(commentID);
            const voteToDelete = voters.find(voter => voter.voterID === parseInt(authorID));
            if (!voteToDelete) {
                throw new Error("No vote found to delete.");
            }
            await API.fetchGraphQL(DELETE_VOTE_ON_COMMENT_MUTATION_QUERY, { id: voteToDelete.voteID });
        } catch (error) {
            voteButton.classList.add("voted");
            voteCountElement.textContent = currentVotes;
        }
    },
};

const handleComments = {
    async createComment() {
        const tempId = Date.now();
        const commentContentEl = document.querySelector(".mentionable");
        const textContent = commentContentEl.innerText.trim();

        // Validate non-empty input using innerText
        if (!textContent) {
            return;
        }

        let fileData = "";
        const fileInput = document.getElementById("attachment-file-input");
        const file = fileInput.files[0];
        commentForm.style.opacity = "50%";
        commentForm.style.pointerEvents = "none";

        // Use innerHTML as the comment payload to preserve mention markup
        const newComment = {
            tempId,
            Comment: commentContentEl.innerHTML,
            Author_First_Name: firstName,
            Author_Last_Name: lastName,
            Author_Display_Name: displayName,
            Author_Profile_Image: authorProfileImage,
            Date_Added: "Just Now",
        };
        comments = [newComment, ...comments];
        UI.updateComments(comments);
        try {
            if (file) {
                const fileFields = [{ fieldName: "attachment", file: file }];
                const toSubmitFields = {};
                try {
                    await processFileFields(toSubmitFields, fileFields, awsParam, awsParamUrl);
                    fileData = toSubmitFields.attachment || "";
                } catch (err) {
                    return;
                }
            }

            const result = await SubmissionService.createComment(
                authorID,
                submissionID,
                commentContentEl.innerHTML,
                mentionArrays,
                fileData
            );
            if (result && result.createForumComment) {
                const serverComment = {
                    ID: result.createForumComment.id,
                    Comment: result.createForumComment.comment,
                    Author_First_Name: firstName,
                    Author_Last_Name: lastName,
                    Author_Display_Name: displayName,
                    Author_Profile_Image: authorProfileImage,
                    Date_Added: "Just Now",
                };

                if (fileData) {
                    try {
                        serverComment.File = typeof fileData === "string" ? JSON.parse(fileData) : fileData;
                    } catch (e) {
                        serverComment.File = fileData;
                    }
                }

                comments = comments.map(comment => comment.tempId === newComment.tempId ? serverComment : comment);
                UI.updateComments(comments);
            }
        } catch (error) {
            comments = comments.filter(comment => comment.tempId !== newComment.tempId);
            UI.updateComments(comments);
        } finally {
            commentForm.style.opacity = "100%";
            commentForm.style.pointerEvents = "";
            filePreview.classList.add("hidden");
            // Clear the contenteditable div manually instead of form.reset()
            commentContentEl.innerHTML = "";
            mentionArrays = [];
            // Also clear the file input if needed
            fileInput.value = "";
        }
    },

    async deleteComment(commentId) {
        try {
            const commentElement = document.querySelector(`[data-commentid="${commentId}"]`);
            if (!commentElement) {
                return;
            }
            commentElement.style.opacity = "0.5";
            await SubmissionService.deleteComment(commentId);
            commentElement.remove();
            comments = comments.filter(comment => comment.commentID !== commentId);
        } catch (error) {
            const commentElement = document.querySelector(`[data-commentid="${commentId}"]`);
            if (commentElement) {
                commentElement.style.opacity = "1";
            }
        }
    },

    async createReply(replyToCommentId, replyContentHTML, replyMentions = []) {
        const tempId = Date.now();
        if (!replyContentHTML.trim()) {
            return;
        }
        const newReply = {
            tempId,
            Comment: replyContentHTML,
            Author_First_Name: firstName,
            Author_Last_Name: lastName,
            Author_Display_Name: displayName,
            Author_Profile_Image: authorProfileImage,
            Date_Added: "Just Now",
            Reply_to_Comment_ID: replyToCommentId,
        };
        if (!replies[replyToCommentId]) {
            replies[replyToCommentId] = [];
        }
        replies[replyToCommentId].push(newReply);
        UI.updateReplies(replyToCommentId, replies[replyToCommentId]);

        try {
            const result = await CommentsService.createCommentOnReply(replyToCommentId, replyContentHTML, replyMentions);
            if (result && result.createForumComment) {
                const serverReply = {
                    ID: result.createForumComment.id,
                    Comment: result.createForumComment.comment,
                    Author_First_Name: firstName,
                    Author_Last_Name: lastName,
                    Author_Display_Name: displayName,
                    Author_Profile_Image: authorProfileImage,
                    Reply_to_Comment_ID: result.createForumComment.reply_to_comment_id,
                    Date_Added: "Just Now",
                };
                replies[replyToCommentId] = replies[replyToCommentId].map(reply =>
                    reply.tempId === newReply.tempId ? serverReply : reply
                );
                UI.updateReplies(replyToCommentId, replies[replyToCommentId]);
            }
        } catch (error) {
            replies[replyToCommentId] = replies[replyToCommentId].filter(reply => reply.tempId !== newReply.tempId);
            UI.updateReplies(replyToCommentId, replies[replyToCommentId]);
        }
    },

    async deleteReply(replyId) {
        try {
            const replyElement = document.querySelector(`[data-replyid="${replyId}"]`);
            if (!replyElement) {
                return;
            }
            replyElement.style.opacity = "0.5";
            // Assuming the reply element has a data attribute for its parent comment:
            const parentCommentId = replyElement.getAttribute("data-parentcommentid");
            await SubmissionService.deleteReply(replyId);
            // Remove the reply element from the DOM
            replyElement.remove();
            // Also update the replies array for the parent comment
            if (parentCommentId && replies[parentCommentId]) {
                replies[parentCommentId] = replies[parentCommentId].filter(reply => reply.ID != replyId);
                UI.updateReplies(parentCommentId, replies[parentCommentId]);
            }
        } catch (error) {
            const replyElement = document.querySelector(`[data-replyid="${replyId}"]`);
            if (replyElement) {
                replyElement.style.opacity = "1";
            }
        }
    },
};

commentForm.addEventListener("submit", (e) => {
    e.preventDefault();
    handleComments.createComment();
});

commentsContainer.addEventListener("submit", (e) => {
    const replyForm = e.target.closest("[data-replyform]");
    if (replyForm) {
        e.preventDefault();
        const replyToCommentId = replyForm.getAttribute("data-replyform");
        const replyContentField = replyForm.querySelector(`[data-reply-textarea="${replyToCommentId}"]`);
        if (!replyContentField) return;

        // Capture the HTML content (preserves mentions/markup)
        const replyContentHTML = replyContentField.innerHTML.trim();
        // Validate by also checking the text content if needed
        const replyContentText = replyContentField.innerText.trim();

        if (replyContentText) {
            const replyMentions = mentionArrays.slice();
            mentionArrays = [];
            handleComments.createReply(replyToCommentId, replyContentHTML, replyMentions);
            // Clear the contenteditable field appropriately
            replyContentField.innerHTML = "";
        }
    }
});


commentsContainer.addEventListener("click", (e) => {
    if (e.target && e.target.classList.contains("deleteComment")) {
        const commentId = e.target.closest("[data-commentid]").getAttribute("data-commentid");
        handleComments.deleteComment(commentId);
    }
});

commentsContainer.addEventListener("click", (e) => {
    if (e.target && e.target.classList.contains("deleteReply")) {
        const replyId = e.target.closest("[data-replyid]").getAttribute("data-replyid");
        handleComments.deleteReply(replyId);
    }
});

commentsContainer.addEventListener("click", async (e) => {
    const voteButton = e.target.closest(".commentVoteButton");
    if (voteButton) {
        const commentID = voteButton.getAttribute("data-commentvoteid");
        const isVoted = voteButton.classList.contains("voted");

        if (isVoted) {
            await handleVotesForComments.deleteVoteForComment(commentID);
        } else {
            await handleVotesForComments.createVoteForComment(commentID);
        }
    }
});

document.addEventListener("DOMContentLoaded", async () => {
    try {
        const fetchedStudents = await SubmissionService.fetchStudents(classId);
        const formattedContacts = fetchedStudents
            .filter(c => c.Student_Unique_ID !== null && c.Student_Unique_ID !== undefined && c.Student_Display_Name)
            .map(c => ({
                key: c.Student_Display_Name,
                value: c.Student_Unique_ID,
                image: c.Student_Profile_Image
            }));

        globalTribute = new Tribute({
            values: formattedContacts,
            menuItemTemplate: function (item) {
                if (!item || !item.original) return "";
                return `<div class="cursor-pointer inline-flex items-center gap-x-1"><img src="${item.original.image}" style="object-fit:cover;height:20px;width:20px;border-radius:50%"><span>${item.original.key}</span></div>`;
            },
            selectTemplate: function (item) {
                if (!item || !item.original) return "";
                mentionArrays.push(item.original.value);
                return `<span class="mention-handle label bg-[#ebf6f6] text-[#007c8a] py-[1px] px-[2px] rounded" data-contact-id="${item.original.value}">@${item.original.key}</span>`;
            }
        });

        const fetchedComments = await SubmissionService.fetchComments(submissionID);
        comments = fetchedComments || [];
        UI.updateComments(comments);

        document.querySelectorAll(".mentionable").forEach(el => {
            globalTribute.attach(el);
        });
        const styledEditors = document.querySelectorAll(".mentionable");
        styledEditors.forEach((singleEditor) => {
            function setPlaceholder() {
                if (!singleEditor.textContent.trim()) {
                    singleEditor.innerHTML =
                        '<span class="placeholder text-[#586a80] text-base font-normal leading-normal "><i>Type @ to mention someone...</i></span>';
                }
            }

            singleEditor.addEventListener("focus", () => {
                if (singleEditor.querySelector(".placeholder")) {
                    singleEditor.innerHTML = "";
                }
            });

            singleEditor.addEventListener("blur", setPlaceholder);

            // Initialize placeholder.
            setPlaceholder();
        });

        for (const comment of comments) {
            const fetchedReplies = await CommentsService.fetchReplies(comment.ID);
            if (fetchedReplies) {
                replies[comment.ID] = [
                    ...(replies[comment.ID] || []),
                    ...fetchedReplies,
                ];
                UI.updateReplies(comment.ID, replies[comment.ID]);

                // NEW: Update vote counts for each reply
                for (const reply of replies[comment.ID]) {
                    const replyVoters = await handleVotesForComments.fetchVotersForComments(reply.ID) || [];
                    const isReplyVoted = replyVoters.some(voter => voter.voterID === parseInt(authorID));
                    const replyVoteCount = replyVoters.length;
                    const replyVoteButton = document.querySelector(`[data-commentvoteid="${reply.ID}"]`);
                    const replyVoteCountElement = document.querySelector(`[data-commentvotecountelement="${reply.ID}"]`);
                    if (replyVoteButton) {
                        if (isReplyVoted) {
                            replyVoteButton.classList.add("voted");
                        } else {
                            replyVoteButton.classList.remove("voted");
                        }
                    }
                    if (replyVoteCountElement) {
                        replyVoteCountElement.textContent = replyVoteCount;
                    }
                }
            }
            const voters = await handleVotesForComments.fetchVotersForComments(comment.ID) || [];
            const isVoted = voters.some(voter => voter.voterID === parseInt(authorID));
            const voteCount = voters.length;

            const commentVoteButton = document.querySelector(`[data-commentvoteid="${comment.ID}"]`);
            const commentVoteCountElement = document.querySelector(`[data-commentvotecountelement="${comment.ID}"]`);

            if (commentVoteButton) {
                if (isVoted) {
                    commentVoteButton.classList.add("voted");
                } else {
                    commentVoteButton.classList.remove("voted");
                }
            }
            if (commentVoteCountElement) {
                commentVoteCountElement.textContent = voteCount;
            }
        }
        const fetchedVotersForSubmission = await SubmissionService.fetchVotersForSubmission(submissionID);
        submissionVoters = fetchedVotersForSubmission;
        hasVotedForSubmission = submissionVoters.some(voter => voter.voterID === parseInt(authorID));
        voteCountForSubmissions = submissionVoters.length;
        UI.updateSubmissionVoteButton();

    } catch (error) {
        // Handle errors appropriately
    }
});

document.addEventListener("focusin", (e) => {
    const m = e.target.closest(".mentionable");
    if (m && !m.dataset.tributeAttached && globalTribute) {
        globalTribute.attach(m);
        m.dataset.tributeAttached = "true";
    }
});

document.addEventListener("DOMContentLoaded", () => {
    const fileInput = document.getElementById("attachment-file-input");
    const attachBtn = document.querySelector(".attachBtn");
    const refreshBtn = document.querySelector(".refreshBtn");
    const deleteBtn = document.querySelector(".deleteBtn");
    if (!filePreview) {
        filePreview = document.createElement("span");
        attachBtn.appendChild(filePreview);
    }

    fileInput.addEventListener("change", () => {
        if (fileInput.files && fileInput.files.length > 0) {
            filePreview.classList.remove("hidden");
            const file = fileInput.files[0];
            filePreview.textContent = file.name;
            attachBtn.classList.add("hidden");
            refreshBtn.classList.remove("hidden");
            deleteBtn.classList.remove("hidden");
        }
    });

    // Replace: simulate clicking the file input to repick a file.
    refreshBtn.addEventListener("click", () => {
        fileInput.click();
    });

    // Delete: clear the selected file and reset the UI.
    deleteBtn.addEventListener("click", () => {
        filePreview.classList.add("hidden");
        fileInput.value = "";
        filePreview.textContent = "";
        refreshBtn.classList.add("hidden");
        deleteBtn.classList.add("hidden");
        attachBtn.classList.remove("hidden");
    });
});
