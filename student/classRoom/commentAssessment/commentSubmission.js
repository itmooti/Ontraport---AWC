    // create commenrts
    async function createForumCommentRequest(
      file,
      comment,
      reply_to_comment_id,
      submissions_id,
      Mentions,
      fileCategory,
      fileName
    ) {
      const CREATE_COMMENT_MUTATION_QUERY = `
    mutation createForumComment($payload: ForumCommentCreateInput) {
      createForumComment(payload: $payload) {
        id
        comment 
        author_id 
        reply_to_comment_id 
        submissions_id  
        file  
        comment_file_type
        comment_file_name
        Mentions {
          unique_id 
        }
        Author {
          display_name
          first_name
          last_name
          profile_image
        }
      }
    }
  `;

      const payload = {
        payload: {
          comment,
          author_id: currentUserId,
          reply_to_comment_id,
          submissions_id,
          file,
          comment_file_type: fileCategory,
          comment_file_name: fileName,
          Mentions: Mentions.map((id) => ({ unique_id: id })),
          Author: {
            display_name: currentUserDisplayName,
            first_name: currentUserFirstName,
            last_name: currentUserLastName,
            profile_image: currentUserProfileImage,
          },
        },
      };

      try {
        const response = await fetch(endpointForComment, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Api-Key": apiKeyForComment,
          },
          body: JSON.stringify({
            query: CREATE_COMMENT_MUTATION_QUERY,
            variables: payload,
          }),
        });
        const counterElement = document.getElementById(`commentCounter_${submissions_id}`);
        if (counterElement) {
          const count = parseInt(counterElement.textContent, 10) || 0;
          counterElement.textContent = count + 1;
        }

        const result = await response.json();

        return result;
      } catch (error) {
        return null;
      }
    }
    // test to listen the ,entioned user
    document.addEventListener("submit", async function (e) {
      if (e.target.closest("form")) {
        e.preventDefault();

        const form = e.target;
        const mentionableDiv = form.querySelector(".mentionable");
        const mentionIds = mentionableDiv?._mentionIds || [];
        const mentionablePlaceholder = form.querySelector(
          ".mention-placeholder"
        );
        if (mentionablePlaceholder) {
          mentionablePlaceholder.remove();
        }
        const submissionNote = form.querySelector(".mentionable").innerHTML;
        const submissionId = form.getAttribute("data-submissionId") ?? null;
        const replyToCommentId =
          form.getAttribute("data-replyToCommentId") ?? null;
        // 2. Clear mention array
        const isReply =
          form.hasAttribute("data-replyToCommentId") &&
          form.getAttribute("data-replyToCommentId") !== "";
        mentionableDiv._mentionIds = [];

        let fileData = "";
        let fileCategory = "File";
        let fileName = "file.txt";
        const fileInputForComment = form.querySelector(".formFileInput");
        const awsParam = "ee037b98f52d6f86c4d3a4cc4522de1e";
        const awsParamUrl = "https://courses.writerscentre.com.au/s/aws";

        form.classList.add("opacity-50", "cursor-not-allowed");
        if (fileInputForComment) {
          const file = fileInputForComment.files[0];

          if (file) {
            const fileFields = [{ fieldName: "attachment", file: file }];
            const toSubmitFields = {};
            try {
              await processFileFields(
                toSubmitFields,
                fileFields,
                awsParam,
                awsParamUrl
              );
              fileData = toSubmitFields.attachment || "";
            } catch (err) {
              return;
            }
          }
          if (typeof fileData === "string") {
            try {
              fileData = JSON.parse(fileData);
              fileName = fileData.name;
              if (fileData.type.startsWith("image/")) {
                fileCategory = "Image";
              } else if (fileData.type.startsWith("video/")) {
                fileCategory = "Video";
              } else if (fileData.type.startsWith("audio/")) {
                fileCategory = "Audio";
              }
            } catch (err) {
            }
          }
        }
        const result = await createForumCommentRequest(
          fileData,
          submissionNote,
          replyToCommentId,
          submissionId,
          mentionIds,
          fileCategory,
          fileName
        );

        const comment = result.data.createForumComment;

        const commentData = {
          ...comment,
          id: result.extensions?.pkMap
            ? Object.values(result.extensions.pkMap)[0]
            : "new",
        };
        if (isReply) {
          const replyToId = comment.reply_to_comment_id;
          const container = document.querySelector(
            `.repliesContainer_${replyToId}`
          );
          const tmpl = $.templates("#createdReplyTemplate");
          const htmlOutput = tmpl.render(commentData, {
            formatTimeAgo,
            isValidComment: (c) => c && c.Author && c.comment,
            hasVoted,
            getUserVoteId,
          });
          if (container) {
            container.insertAdjacentHTML("beforeend", htmlOutput);
          }
        } else {
          let container = document.querySelector(
            `.commentContainer_${comment.submissions_id}`
          );
          const tmpl = $.templates("#createdCommentTemplate");
          const htmlOutput = tmpl.render(commentData, {
            formatTimeAgo,
            isValidComment: (c) => c && c.Author && c.comment,
            hasVoted,
            getUserVoteId,
          });
          if (container) {
            container.insertAdjacentHTML("beforeend", htmlOutput);
          }
        }

        // 3. Reset content and placeholder
        mentionableDiv.innerHTML = "";
        const span = document.createElement("span");
        span.className =
          "mention-placeholder text-[#586a80] text-base font-normal leading-normal pointer-events-none select-none";
        span.innerHTML = "Type @ to mention members";
        mentionableDiv.appendChild(span);

        // 4. Clear file input
        const fileInput = form.querySelector(".formFileInput");
        if (fileInput) fileInput.value = "";

        // 5. Clear file preview
        const wrapper = form.querySelector(".filePreviewWrapper");
        if (wrapper) {
          wrapper.textContent = "";
          wrapper.classList.add("hidden");
        }

        // 6. Reset button states
        const attachBtn = form.querySelector(".attachBtn");
        const replaceBtn = form.querySelector(".refreshBtn");
        const deleteBtn = form.querySelector(".deleteBtn");

        if (attachBtn) attachBtn.classList.remove("hidden");
        if (replaceBtn) replaceBtn.classList.add("hidden");
        if (deleteBtn) deleteBtn.classList.add("hidden");
        form.classList.remove("opacity-50", "cursor-not-allowed");
      }
    });
    // Placeholder for div
    document.addEventListener("focusin", function (e) {
      if (e.target.classList.contains("mentionable")) {
        const placeholder = e.target.querySelector(".mention-placeholder");
        if (placeholder) {
          placeholder.remove();
        }
      }
    });
    document.addEventListener("focusout", function (e) {
      if (e.target.classList.contains("mentionable")) {
        setTimeout(() => {
          const el = e.target;
          const hasText = el.textContent.trim().length > 0;
          const alreadyHas = el.querySelector(".mention-placeholder");

          if (!hasText && !alreadyHas) {
            const span = document.createElement("span");
            span.className =
              "mention-placeholder text-[#586a80] text-base font-normal leading-normal pointer-events-none select-none";
            span.innerHTML = "Type @Name to mention members";
            el.appendChild(span);
          }
        }, 10);
      }
    });
    // handle file input
    document.addEventListener("change", function (e) {
      if (e.target.matches(".formFileInput")) {
        const input = e.target;
        const file = input.files[0];
        const form = input.closest("form");
        const wrapper = form.querySelector(".filePreviewWrapper");
        const attachBtn = form.querySelector(".attachBtn");
        const replaceBtn = form.querySelector(".refreshBtn");
        const deleteBtn = form.querySelector(".deleteBtn");

        if (file) {
          wrapper.textContent = file.name;
          wrapper.classList.remove("hidden");
          attachBtn.classList.add("hidden");
          replaceBtn.classList.remove("hidden");
          deleteBtn.classList.remove("hidden");
        }
      }
    });
    document.addEventListener("click", function (e) {
      const target = e.target.closest("button");

      // Handle delete file
      if (target && target.classList.contains("deleteBtn")) {
        const form = target.closest("form");
        const input = form.querySelector(".formFileInput");
        const wrapper = form.querySelector(".filePreviewWrapper");
        const attachBtn = form.querySelector(".attachBtn");
        const replaceBtn = form.querySelector(".refreshBtn");

        input.value = "";
        wrapper.textContent = "";
        wrapper.classList.add("hidden");
        replaceBtn.classList.add("hidden");
        target.classList.add("hidden");
        attachBtn.classList.remove("hidden");
      }
      // Handle replace file
      if (target && target.classList.contains("refreshBtn")) {
        const form = target.closest("form");
        const input = form.querySelector(".formFileInput");
        input.click();
      }
    });
    function formatTimeAgo(unix) {
      const now = Date.now();
      const secondsAgo = Math.floor((now - unix * 1000) / 1000);

      if (secondsAgo < 5) return "Just now";
      if (secondsAgo < 60) return `${secondsAgo}s ago`;

      const minutesAgo = Math.floor(secondsAgo / 60);
      if (minutesAgo < 60) return `${minutesAgo}m ago`;

      const hoursAgo = Math.floor(minutesAgo / 60);
      if (hoursAgo < 24) return `${hoursAgo}h ago`;

      const daysAgo = Math.floor(hoursAgo / 24);
      return `${daysAgo}d ago`;
    }
    function hasVoted(voters) {
      if (!voters || !Array.isArray(voters)) return false;
      return voters.some((v) => v.voter_id === currentUserId);
    }
    function getUserVoteId(voters) {
      if (!voters || !Array.isArray(voters)) return "";
      const vote = voters.find((v) => v.voter_id === currentUserId);
      return vote ? vote.id : "";
    }
    $.views.helpers({
      countWithAuthor: function (commentsArray) {
        if (!Array.isArray(commentsArray)) return 0;
        return commentsArray.filter(c => c.Author).length;
      },
      resolveProfileImage: function (src) {
        if (
          !src ||
          src.includes("https://i.ontraport.com/abc.jpg") ||
          src === ""
        ) {
          return "https://files.ontraport.com/media/b0456fe87439430680b173369cc54cea.php03bzcx?Expires=4895186056&Signature=fw-mkSjms67rj5eIsiDF9QfHb4EAe29jfz~yn3XT0--8jLdK4OGkxWBZR9YHSh26ZAp5EHj~6g5CUUncgjztHHKU9c9ymvZYfSbPO9JGht~ZJnr2Gwmp6vsvIpYvE1pEywTeoigeyClFm1dHrS7VakQk9uYac4Sw0suU4MpRGYQPFB6w3HUw-eO5TvaOLabtuSlgdyGRie6Ve0R7kzU76uXDvlhhWGMZ7alNCTdS7txSgUOT8oL9pJP832UsasK4~M~Na0ku1oY-8a7GcvvVv6j7yE0V0COB9OP0FbC8z7eSdZ8r7avFK~f9Wl0SEfS6MkPQR2YwWjr55bbJJhZnZA__&Key-Pair-Id=APKAJVAAMVW6XQYWSTNA";
        }
        return src || defaultImgComment;
      },
      extractFileLink: function (file) {
        if (!file) return "";

        if (typeof file === "string") {
          try {
            const parsed = JSON.parse(file);
            return parsed.link || parsed.replace(/^"+|"+$/g, "");
          } catch {
            return file.replace(/^"+|"+$/g, "");
          }
        }

        if (typeof file === "object" && file.link) {
          return file.link;
        }

        return "";
      },
    });
    async function fetchClassMembers(classIdForComment) {
      const query = `
    query getClasses {
      getClasses(query: [{ where: { id: ${classIdForComment} } }]) {
        Teacher {
          display_name
          first_name
          last_name
          profile_image
          id 
          unique_id
        }
        Enrolments {
          Student {
            unique_id
            display_name
            first_name
            last_name
            profile_image
          }
        }
      }
    }
  `;

      const res = await fetch(endpointForComment, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Api-Key": apiKeyForComment,
        },
        body: JSON.stringify({ query }),
      });

      const json = await res.json();
      return json.data.getClasses?.[0];
    }
    //  initializs tribute
    function initializeTribute() {
      document.querySelectorAll(".mentionable").forEach((el) => {
        if (!el.hasAttribute("data-tribute-attached")) {
          globalTribute.attach(el);
          el.setAttribute("data-tribute-attached", "true");
        }
      });
    }
    document.addEventListener("DOMContentLoaded", async () => {
      try {
        const classData = await fetchClassMembers(classIdForComment);
        const people = [];

        if (classData?.Teacher) {
          const t = classData.Teacher;
          people.push({
            key: t.display_name || `${t.first_name} ${t.last_name}`,
            value: t.unique_id,
            image: t.profile_image || defaultImgComment,
          });
        }

        (classData?.Enrolments || []).forEach((e) => {
          const s = e.Student;
          if (
            s?.unique_id &&
            (s.display_name || s.first_name || s.last_name)
          ) {
            people.push({
              key: s.display_name || `${s.first_name} ${s.last_name}`,
              value: s.unique_id,
              image: s.profile_image || defaultImgComment,
            });
          }
        });

        globalTribute = new Tribute({
          values: people,
          menuItemTemplate: function (item) {
            if (!item || !item.original) return "";
            return `<div class="cursor-pointer inline-flex items-center gap-x-1">
                  <img src="${item.original.image}" style="object-fit:cover;height:20px;width:20px;border-radius:50%">
                  <span>${item.original.key}</span>
                </div>`;
          },
          selectTemplate: function (item) {
            if (!item || !item.original) return "";

            const activeEditor = globalTribute.current.element;
            if (!activeEditor._mentionIds) activeEditor._mentionIds = [];

            activeEditor._mentionIds.push(item.original.value);

            return `<span class="mention-handle label bg-[#ebf6f6] text-[#007c8a] py-[1px] px-[2px] rounded" data-contact-id="${item.original.value}">@${item.original.key}</span>`;
          },
        });

        document.querySelectorAll(".mentionable").forEach((el) => {
          globalTribute.attach(el);
        });

        document.querySelectorAll(".mentionable").forEach((singleEditor) => {
          function setPlaceholder() {
            if (!singleEditor.textContent.trim()) {
              const span = document.createElement("span");
              span.className =
                "mention-placeholder text-[#586a80] text-base font-normal leading-normal pointer-events-none select-none";
              span.innerHTML = "Type @ to mention members";
              singleEditor.appendChild(span);
            }
          }

          singleEditor.addEventListener("focus", () => {
            const placeholder = singleEditor.querySelector(
              ".mention-placeholder"
            );
            if (placeholder) placeholder.remove();
          });

          singleEditor.addEventListener("blur", () => {
            setTimeout(() => {
              if (
                !singleEditor.textContent.trim() &&
                !singleEditor.querySelector(".mention-placeholder")
              ) {
                const span = document.createElement("span");
                span.className =
                  "mention-placeholder text-[#586a80] text-base font-normal leading-normal pointer-events-none select-none";
                span.innerHTML = "Type @ to mention members";
                singleEditor.appendChild(span);
              }
            }, 10);
          });

          setPlaceholder();
        });
      } catch (err) {
      }
    });
    const query = ` query getSubmissions {
  getSubmissions(
   query: [
      { where: { submission_hidden: false } }
      {
        andWhere: {
          Assessment: [
            { where: { type: "Comment Submission" } }
            {
              andWhere: {
                Lesson: [
                  { where: { unique_id: "${currentUsersLessonId}" } }
                ]
              }
            }
          ]
        }
      }
    ]
    limit: 50000
    offset: 0
    orderBy: [{ path: ["created_at"], type: desc }]
  ) {
    Submission_Date_Time: submission_date_time
    submission_Id: id 
    File_Upload: file_upload
    submission_note
    Student {
      Student {
        profile_image 
        display_name
        first_name
        last_name
        is_admin
        is_instructor
        id
      }
    }
    ForumComments(
    orderBy: [{ path: ["created_at"], type: asc }]
    ) {
      id
      comment
      created_at
      file
      comment_file_name
      comment_file_type
      Author {
        id
        display_name
        first_name
        last_name
        profile_image
      }
      Member_Comment_Upvotes_Data {
        id
        voter_id:member_comment_upvote_id
      }
      ForumComments(
        orderBy: [{ path: ["created_at"], type: asc }]
      ) {
        id
        comment
        created_at
        file
      comment_file_name
      comment_file_type
        Author {
          id
          display_name
          first_name
          last_name
          profile_image
        }
        Member_Comment_Upvotes_Data {
          id
          voter_id:member_comment_upvote_id
        }
      }
    }
    Voters_Data {
      id
      voter_id
    }
  }
}
`;
    async function fetchSubmissions() {
      const res = await fetch(endpointForComment, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Api-Key": apiKeyForComment,
        },
        body: JSON.stringify({ query }),
      });
      const { data } = await res.json();
      return data.getSubmissions;
    }
    $(async function () {
      const template = $.templates("#submissionTemplate");
      const submissions = await fetchSubmissions();
      const html = template.render(
        { submissions },
        {
          formatTimeAgo: formatTimeAgo,
          currentUserId,
          isValidComment: (c) => c && c.Author && c.comment,
          hasVoted: hasVoted,
          getUserVoteId: getUserVoteId,
        }
      );

      $("#submissionList").html(html);
      initializeTribute();
    });
    // Create submission vote
    async function voteOnSubmission(voted_submission_id, element) {
      if (element) element.classList.add("voted");
      const voteCountEl =
        element.querySelector(".submissionVoteCount") ||
        element
          .closest("[data-commentvoteid]")
          ?.querySelector(".submissionVoteCount");

      if (voteCountEl) {
        const currentCount =
          parseInt(voteCountEl.textContent.trim(), 10) || 0;
        voteCountEl.textContent = currentCount + 1;
      }
      const mutation = `
    mutation createOVoterVotedSubmission($payload: OVoterVotedSubmissionCreateInput) {
      createOVoterVotedSubmission(payload: $payload) {
        id
        voter_id 
        voted_submission_id 
      }
    }
  `;

      const variables = {
        payload: {
          voted_submission_id,
          voter_id: currentUserId,
        },
      };

      const response = await fetch(endpointForComment, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Api-Key": apiKeyForComment,
        },
        body: JSON.stringify({
          query: mutation,
          variables,
        }),
      });

      const result = await response.json();
      element.removeAttribute("onclick");
      element.setAttribute(
        "onclick",
        `unvoteOnSubmission('${result?.data?.createOVoterVotedSubmission?.id}', this,'${result?.data?.createOVoterVotedSubmission?.voted_submission_id}')`
      );

      return result?.data?.createOVoterVotedSubmission;
    }
    // create vote on comment
    async function voteOnComment(forum_comment_upvote_id, element) {
      if (element) element.classList.add("voted");
      const voteCountEl =
        element.querySelector(".commentVoteCount") ||
        element
          .closest("[data-commentvotecountelement]")
          ?.querySelector(".commentVoteCount");

      if (voteCountEl) {
        const currentCount =
          parseInt(voteCountEl.textContent.trim(), 10) || 0;
        voteCountEl.textContent = currentCount + 1;
      }
      const mutation = `
    mutation createMemberCommentUpvotesForumCommentUpvotes(
      $payload: MemberCommentUpvotesForumCommentUpvotesCreateInput = null
    ) {
      createMemberCommentUpvotesForumCommentUpvotes(payload: $payload) {
        id
        member_comment_upvote_id  
        forum_comment_upvote_id  
      }
    }
  `;

      const variables = {
        payload: {
          forum_comment_upvote_id,
          member_comment_upvote_id: currentUserId,
        },
      };

      const response = await fetch(endpointForComment, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Api-Key": apiKeyForComment,
        },
        body: JSON.stringify({
          query: mutation,
          variables,
        }),
      });

      const result = await response.json();
      element.removeAttribute("onclick");
      element.setAttribute(
        "onclick",
        `unvoteOnComment('${result?.data?.createMemberCommentUpvotesForumCommentUpvotes?.id}', this,'${result?.data?.createMemberCommentUpvotesForumCommentUpvotes?.forum_comment_upvote_id}')`
      );

      return result?.data?.createMemberCommentUpvotesForumCommentUpvotes;
    }
    // Delete submission vote
    async function unvoteOnSubmission(votersVoteId, element, submissionId) {
      if (element) element.classList.remove("voted");
      const voteCountEl =
        element.querySelector(".submissionVoteCount") ||
        element
          .closest("[data-commentvoteid]")
          ?.querySelector(".submissionVoteCount");

      if (voteCountEl) {
        const currentCount =
          parseInt(voteCountEl.textContent.trim(), 10) || 0;
        voteCountEl.textContent = currentCount - 1;
      }
      const mutation = `
    mutation deleteOVoterVotedSubmission($id: AwcOVoterVotedSubmissionID) {
      deleteOVoterVotedSubmission(
        query: [{ where: { id: $id } }]
      ) {
        id
      }
    }
  `;

      const variables = {
        id: votersVoteId,
      };

      const response = await fetch(endpointForComment, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Api-Key": apiKeyForComment,
        },
        body: JSON.stringify({
          query: mutation,
          variables,
        }),
      });

      const result = await response.json();
      element.removeAttribute("onclick");
      element.setAttribute(
        "onclick",
        `voteOnSubmission('${submissionId}', this)`
      );
      return result?.data?.deleteOVoterVotedSubmission;
    }
    // delete comment vote
    async function unvoteOnComment(voteRecordId, element, commentID) {
      if (element) element.classList.remove("voted");
      const voteCountEl =
        element.querySelector(".commentVoteCount") ||
        element
          .closest("[data-commentvotecountelement]")
          ?.querySelector(".commentVoteCount");

      if (voteCountEl) {
        const currentCount =
          parseInt(voteCountEl.textContent.trim(), 10) || 0;
        voteCountEl.textContent = currentCount - 1;
      }
      const mutation = `
    mutation deleteMemberCommentUpvotesForumCommentUpvotes {
      deleteMemberCommentUpvotesForumCommentUpvotes(
        query: [{ where: { id: ${voteRecordId} } }]
      ) {
        id
      }
    }
  `;

      const variables = {
        id: voteRecordId,
      };

      const response = await fetch(endpointForComment, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Api-Key": apiKeyForComment,
        },
        body: JSON.stringify({
          query: mutation,
          variables,
        }),
      });

      const result = await response.json();
      element.removeAttribute("onclick");
      element.setAttribute("onclick", `voteOnComment('${commentID}', this)`);
      return result?.data?.deleteMemberCommentUpvotesForumCommentUpvotes;
    }
    // delete submission created
    async function deleteSubmissionCreated(id) {
      const targetElement = document.getElementById(
        `mainFileSubmissionList_${id}`
      );
      if (targetElement)
        targetElement.classList.add("opacity-50", "cursor-not-allowed");

      try {
        const response = await fetch(
          "https://awc.vitalstats.app/api/v1/graphql",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Api-Key": "mMzQezxyIwbtSc85rFPs3",
            },
            body: JSON.stringify({
              query: `mutation updateSubmission($payload: SubmissionUpdateInput = null) {
  updateSubmission(
    query: [{ where: { id: ${id} } }]
    payload: $payload
  ) {
    submission_hidden
  }
}`,
              variables: {
                payload: {
                  submission_hidden: true,
                },
              },
            }),
          }
        );

        const result = await response.json();

        if (response.ok && targetElement) {
          targetElement.remove();
        } else if (targetElement) {
          targetElement.classList.remove("opacity-50", "cursor-not-allowed");
        }
        return result;
      } catch (error) {
        if (targetElement)
          targetElement.classList.remove("opacity-50", "cursor-not-allowed");
        throw error;
      }
    }
    // delete forum comment
    async function deleteForumCommentCreated(id) {
      const targetElement = document.getElementById(`${id}`);
      if (targetElement)
        targetElement.classList.add("opacity-50", "cursor-not-allowed");

      try {
        const response = await fetch(
          "https://awc.vitalstats.app/api/v1/graphql",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Api-Key": "mMzQezxyIwbtSc85rFPs3",
            },
            body: JSON.stringify({
              query: `
mutation deleteForumComment($id: AwcForumCommentID) {
  deleteForumComment(query: [{ where: { id: $id } }]) {
    id 
    submissions_id 
  }
}
        `,
              variables: {
                id,
              },
            }),
          }
        );

        const result = await response.json();
        if (response.ok && targetElement) {
          targetElement.remove();
          const submissionIdForCounter = result.data.deleteForumComment.submissions_id;
          const counterElement = document.getElementById(`commentCounter_${submissionIdForCounter}`);
          if (counterElement) {
            const count = parseInt(counterElement.textContent, 10) || 0;
            counterElement.textContent = count - 1;
          }
        } else if (targetElement) {
          targetElement.classList.remove("opacity-50", "cursor-not-allowed");
        }

        return result;
      } catch (error) {
        if (targetElement)
          targetElement.classList.remove("opacity-50", "cursor-not-allowed");
        throw error;
      }
    }
 
