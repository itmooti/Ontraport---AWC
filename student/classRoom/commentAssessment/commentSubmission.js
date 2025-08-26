async function getClassIdForTeacherUrl() {
    const params = new URL(window.location.href).searchParams;
    return params.get("classIdFromUrl")?.replace(/'/g, "") || 
           params.get("classUIDAdmin")?.replace(/'/g, "") || 
           null;
}

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
          has__new__notification 
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
      Mentions: Mentions.map((id) => ({
        unique_id: id,
        has__new__notification: true,
      })),
      Author: {
        display_name: currentUserDisplayName,
        first_name: currentUserFirstName,
        last_name: currentUserLastName,
        profile_image: currentUserProfileImage,
      },
    },
  };

    console.log(payload);
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
    const counterElement = document.getElementById(
      `commentCounter_${submissions_id}`
    );
    if (counterElement) {
      const count = parseInt(counterElement.textContent, 10) || 0;
      counterElement.textContent = count + 1;
    }

    const result = await response.json();

    return result;
  } catch (error) {
      console.log("Error is", error);
    return null;
  }
}
// test to listen the ,entioned user
document.addEventListener("submit", async function (e) {
  if (e.target.closest("form")) {
    e.preventDefault();
    const form = e.target;
    console.log("Form", form);
    const mentionableDiv = form.querySelector(".mentionable");
    // const mentionIds = mentionableDiv?._mentionIds || [];
    const mentionSpans = mentionableDiv?.querySelectorAll("span.mention") || [];
    const mentionIds = Array.from(mentionSpans).map(span => span.getAttribute("data-mention-id"));

    const mentionablePlaceholder = form.querySelector(".mention-placeholder");
    if (mentionablePlaceholder) {
      mentionablePlaceholder.remove();
    }
    const submissionNote = form.querySelector(".mentionable").innerHTML;
    const submissionId = form.getAttribute("data-submissionId") ?? null;
    const replyToCommentId = form.getAttribute("data-replyToCommentId") ?? null;
    // 2. Clear mention array
    const isReply =
      form.hasAttribute("data-replyToCommentId") &&
      form.getAttribute("data-replyToCommentId") !== "";
    mentionableDiv._mentionIds = [];

    let fileData = "";
    let fileCategory = "File";
    let fileName = "file.txt";
    const fileInputForComment = form.querySelector(".formFileInput");
      console.log("fileInputForComment", fileInputForComment);
    const awsParam = "ee037b98f52d6f86c4d3a4cc4522de1e";
    const awsParamUrl = "https://courses.writerscentre.com.au/s/aws";

    form.classList.add("opacity-50", "cursor-not-allowed");
    if (fileInputForComment) {
      const file = fileInputForComment.files[0];
        console.log("File", file);

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
            console.log("File Error is", err);
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
            
            console.log("File Error is", err);
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

    // Create alerts for the new comment (submission comments)
    ;(async () => {
      try {
        const created = result?.data?.createForumComment;
        if (!created || !created.id) return;

        // Content (text only) for alert body
        const tmp = document.createElement('div');
        tmp.innerHTML = String(created.comment || '');
        const contentText = (tmp.textContent || '').trim();
        const createdAt = new Date().toISOString();
        // Configure endpoint/apiKey early for use in helpers
        const endpoint = (typeof endpointForComment !== 'undefined' && endpointForComment)
          ? endpointForComment
          : (window.graphqlApiEndpoint || window.GRAPHQL_ENDPOINT);
        const apiKey = (typeof apiKeyForComment !== 'undefined' && apiKeyForComment)
          ? apiKeyForComment
          : (window.apiAccessKey || window.API_KEY);

        // Ensure we have a valid submission id for alerts
        async function resolveSubmissionIdForAlert() {
          // 1) Prefer value returned in mutation
          const direct = Number(created?.submissions_id || 0);
          if (Number.isFinite(direct) && direct > 0) return direct;
          // 2) If this is a reply, fetch parent comment -> submissions_id
          const parentCid = Number(created?.reply_to_comment_id || 0);
          if (!endpoint || !apiKey || !Number.isFinite(parentCid) || parentCid <= 0) return 0;
          // Try getForumComment first
          try {
            const q1 = `query getForumCommentById($id: AwcForumCommentID) { getForumComment(query: [{ where: { id: $id } }]) { submissions_id } }`;
            const rs1 = await fetch(endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Api-Key': apiKey }, body: JSON.stringify({ query: q1, variables: { id: parentCid } }) }).then(r => r.ok ? r.json() : null);
            const v1 = Number(rs1?.data?.getForumComment?.submissions_id || 0);
            if (Number.isFinite(v1) && v1 > 0) return v1;
          } catch (_) {}
          // Fallback: calcForumComments
          try {
            const q2 = `query getParentComment($id: AwcForumCommentID) { calcForumComments(query: [{ where: { id: $id } }]) { Submissions_ID: field(arg: ["submissions_id"]) } }`;
            const rs2 = await fetch(endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Api-Key': apiKey }, body: JSON.stringify({ query: q2, variables: { id: parentCid } }) }).then(r => r.ok ? r.json() : null);
            const v2 = Number(rs2?.data?.calcForumComments?.[0]?.Submissions_ID || 0);
            if (Number.isFinite(v2) && v2 > 0) return v2;
          } catch (_) {}
          return 0;
        }
        const submissionIdForAlert = await resolveSubmissionIdForAlert();
        if (!Number.isFinite(submissionIdForAlert) || submissionIdForAlert <= 0) return;

        // Resolve classId from context (classID, or via eid)
        let classId = Number(window.classID || 0) || null;
        const url = new URL(window.location.href);
        const eidParam = url.searchParams.get('eid');
        if (!classId && eidParam && endpoint && apiKey) {
          try {
            const q = `query eidToClass($id: AwcEnrolmentID) { calcEnrolments(query: [{ where: { id: $id } }]) { Class_ID: field(arg: ["class_id"]) } }`;
            const rs = await fetch(endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Api-Key': apiKey }, body: JSON.stringify({ query: q, variables: { id: Number(eidParam) } }) }).then(r => r.ok ? r.json() : null);
            classId = Number(rs?.data?.calcEnrolments?.[0]?.Class_ID || 0) || null;
          } catch (_) {}
        }
        if (!endpoint || !apiKey || !classId) return;

        // Gather teacher/student roster + class info
        const qTeacher = `query teacherByClass($id: AwcClassID) { calcClasses(query: [{ where: { id: $id } }]) { Teacher_Contact_ID: field(arg: ["Teacher","id"]) } }`;
        const qClasses = `query getClass($id: AwcClassID) { getClasses(query: [{ where: { id: $id } }]) { id unique_id class_name Course { unique_id } Enrolments { Student { id } } } }`;
        const qEnrol = `query enrolStudents($id: AwcClassID) { calcEnrolments(query: [{ where: { class_id: $id } }]) { Student_ID: field(arg: ["Student","id"]) } }`;
        const [resTeacher, resClasses, resEnrol] = await Promise.all([
          fetch(endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Api-Key': apiKey }, body: JSON.stringify({ query: qTeacher, variables: { id: classId } }) }).then(r => r.ok ? r.json() : null),
          fetch(endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Api-Key': apiKey }, body: JSON.stringify({ query: qClasses, variables: { id: classId } }) }).then(r => r.ok ? r.json() : null),
          fetch(endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Api-Key': apiKey }, body: JSON.stringify({ query: qEnrol, variables: { id: classId } }) }).then(r => r.ok ? r.json() : null),
        ]);
        const norm = (list) => (Array.isArray(list) ? list : [list]).map(v => Number(v)).filter(n => Number.isFinite(n) && n > 0);
        let teacherIds = []; const tRaw = resTeacher?.data?.calcClasses?.[0]?.Teacher_Contact_ID; if (tRaw != null) teacherIds = norm(tRaw);
        const classes = Array.isArray(resClasses?.data?.getClasses) ? resClasses.data.getClasses : [];
        let classUid, className, courseUid;
        const idsFromClasses = classes.flatMap(c => { if (!classUid && c?.unique_id) classUid = c.unique_id; if (!className && c?.class_name) className = c.class_name; if (!courseUid && c?.Course?.unique_id) courseUid = c.Course.unique_id; return (Array.isArray(c?.Enrolments) ? c.Enrolments : []).map(e => e?.Student?.id).filter(Boolean); });
        const enrolRows = Array.isArray(resEnrol?.data?.calcEnrolments) ? resEnrol.data.calcEnrolments : [];
        const idsFromEnrol = enrolRows.flatMap(row => norm(row?.Student_ID));
        const adminIds = [10435];

        const authorId = Number(currentUserId || 0);
        const seen = new Set();
        let audience = norm([...idsFromClasses, ...idsFromEnrol, ...teacherIds, ...adminIds])
          .filter(id => (seen.has(id) ? false : (seen.add(id), true)))
          .filter(id => id !== authorId);
        if (!audience.length) return;

        // Resolve mentions (unique_id -> id)
        const mentionUIDs = Array.isArray(mentionIds) ? mentionIds.map(String).filter(Boolean) : [];
        let mentionContactIds = [];
        if (mentionUIDs.length) {
          try {
            const perUidFetch = async (uid) => {
              const q = `query getContactByUid($uid: StringScalar_0_8) { getContact(query: [{ where: { unique_id: $uid } }]) { id } }`;
              const rs = await fetch(endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Api-Key': apiKey }, body: JSON.stringify({ query: q, variables: { uid } }) }).then(r => r.ok ? r.json() : null);
              const id = Number(rs?.data?.getContact?.id || 0);
              return Number.isFinite(id) && id > 0 ? id : null;
            };
            const resolved = await Promise.all(mentionUIDs.map(perUidFetch));
            mentionContactIds = resolved.filter(n => Number.isFinite(n));
          } catch (_) {}
        }
        const mentionSet = new Set(mentionContactIds);

        // Resolve student enrolment id when role is students (for canonical URLs)
        async function resolveStudentEid(studentId, clsId) {
          try {
            const cache = (window.__awcEidCache ||= new Map());
            const k = String(clsId);
            let byClass = cache.get(k);
            if (!byClass) { byClass = new Map(); cache.set(k, byClass); }
            if (byClass.has(Number(studentId))) return byClass.get(Number(studentId));
            const q = `query getEnrolment($id: AwcContactID, $class_id: AwcClassID) { getEnrolment(query: [{ where: { student_id: $id } }, { andWhere: { class_id: $class_id } }]) { ID: id } }`;
            const rs = await fetch(endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Api-Key': apiKey }, body: JSON.stringify({ query: q, variables: { id: Number(studentId), class_id: Number(clsId) } }) }).then(r => r.ok ? r.json() : null);
            const eid = Number(rs?.data?.getEnrolment?.ID || 0);
            if (Number.isFinite(eid) && eid > 0) { byClass.set(Number(studentId), eid); return eid; }
          } catch (_) {}
          return undefined;
        }

        // Build alerts for audience
        const alerts = [];
        for (const contactId of audience) {
          const isMentioned = mentionSet.has(Number(contactId));
          const isTeacher = teacherIds.includes(Number(contactId));
          const isAdmin = adminIds.includes(Number(contactId));
          const role = isAdmin ? 'admin' : (isTeacher ? 'teacher' : 'students');
          let eid; if (role === 'students') eid = await resolveStudentEid(contactId, classId);
          const params = {
            classId: Number(classId), classUid, className, courseUid,
            eid,
            submissionId: Number(submissionIdForAlert),
            commentId: Number(created.id),
          };
          const originCanonical = (window.AWC && typeof window.AWC.buildAlertUrl === 'function') ? window.AWC.buildAlertUrl(role, 'submission', params) : window.location.href;
          const teacherCanonical = (window.AWC && typeof window.AWC.buildAlertUrl === 'function') ? window.AWC.buildAlertUrl('teacher', 'submission', params) : window.location.href;
          const adminCanonical = (window.AWC && typeof window.AWC.buildAlertUrl === 'function') ? window.AWC.buildAlertUrl('admin', 'submission', params) : window.location.href;
          const isReplyNow = Number(created?.reply_to_comment_id || 0) > 0;
          const alertType = isMentioned ? 'Submission Comment Mention' : 'Submission Comment';
          let title = 'A comment has been added to a submission';
          if (isReplyNow) title = 'A reply has been added to a comment';
          if (isMentioned) title = 'You are mentioned in a comment';
          alerts.push({
            alert_type: alertType,
            title,
            content: contentText,
            created_at: createdAt,
            is_mentioned: !!isMentioned,
            is_read: false,
            notified_contact_id: Number(contactId),
            origin_url: originCanonical,
            origin_url_teacher: teacherCanonical,
            origin_url_admin: adminCanonical,
            parent_class_id: Number(classId),
            parent_submission_id: Number(submissionIdForAlert),
            parent_comment_id: Number(created.id),
          });
        }

        if (!alerts.length) return;

        // Prefer global helper; otherwise fallback to direct GraphQL
        if (window.AWC && typeof window.AWC.createAlerts === 'function') {
          try { await window.AWC.createAlerts(alerts, { concurrency: 4 }); } catch (e) { console.error('Failed to create alerts (submission comment)', e); }
        } else {
          try {
            const createAlertsMutation = `mutation createAlerts($payload: [AlertCreateInput] = null) { createAlerts(payload: $payload) { is_mentioned } }`;
            await fetch(endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Api-Key': apiKey }, body: JSON.stringify({ query: createAlertsMutation, variables: { payload: alerts } }) });
          } catch (e) { console.error('createAlerts GraphQL failed (submission comment)', e); }
        }

        // Mark mentioned contacts as having new notifications
        if (mentionContactIds.length) {
          const updateMutation = `mutation updateContact($id: AwcContactID!, $payload: ContactUpdateInput!) { updateContact(query: [{ where: { id: $id } }], payload: $payload) { has__new__notification } }`;
          for (const mid of mentionContactIds) {
            try { await fetch(endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Api-Key': apiKey }, body: JSON.stringify({ query: updateMutation, variables: { id: Number(mid), payload: { has__new__notification: true } } }) }); } catch(_) {}
          }
        }
      } catch (e) {
        console.error('Submission comment alert creation error', e);
      }
    })();

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
    return commentsArray.filter((c) => c.Author).length;
  },
  resolveProfileImage: function (src) {
    if (!src || src.includes("https://i.ontraport.com/abc.jpg") || src === "") {
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


async function buildSubmissionsQueryClass() {
  const match = window.location.href.match(/[?&]eid=(\d+)/);
  const eid = match ? match[1] : null;

  let resolvedClassId = classID;

  if (eid) {
    const query = `
      query calcClasses {
        calcClasses(
          query: [
            {
              where: {
                Enrolments: [
                  { where: { status: "Active" } }
                  { orWhere: { status: "New" } }
                ]
              }
            }
            {
              andWhere: { Enrolments: [{ where: { id: ${eid} } }] }
            }
          ]
        ) {
          ID: field(arg: ["id"])
        }
      }
    `;

    try {
      const response = await fetch(endpointForComment, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Api-Key": apiKeyForComment,
        },
        body: JSON.stringify({ query }),
      });

      if (response.ok) {
        const result = await response.json();
        const fetchedId = result.data?.calcClasses?.[0]?.ID;
        if (fetchedId) resolvedClassId = fetchedId;
      }
    } catch (err) {
      // fallback already set
    }
  } else {
    resolvedClassId = await getClassIdForTeacherUrl();
  }

  const finalQuery = `
    query getSubmissions {
  getSubmissions(
   query: [
      { where: { submission_hidden: false } }
      {
        andWhere: {
          Assessment: [
            { where: { type: "Comment Submission" } }
            ${isPrivate}
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
      {
        andWhere: {
          Student: [
            { where: { Class: [{ where: { id: "${resolvedClassId}" } }] } }
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
    file_upload_name
    file_upload_type
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
    limit: 50000
    offset: 0
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
        limit: 50000
        offset: 0
        orderBy: [{ path: ["created_at"], type: asc }]
      ) {
      reply_to_comment_id 
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

  return finalQuery;
}

//     const query = `
// `;
function highlightAndScrollSubmission() {
  const match = window.location.href.match(/[?&]submissionPostIs=(\d+)/);
  if (match) {
    const submissionId = match[1];
    const iframe = document.querySelector(
      `.mainFileSubmissionList_${submissionId}`
    );

    if (iframe) {
      iframe.click();
      iframe.classList.add("highlightedSubmission");
      const topPos =
        iframe.getBoundingClientRect().top + window.pageYOffset - 200;
      window.scrollTo({ top: topPos, behavior: "smooth" });
    }
  }
}

async function fetchSubmissions() {
  const querySub = await buildSubmissionsQueryClass();
  const res = await fetch(endpointForComment, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Api-Key": apiKeyForComment,
    },
    body: JSON.stringify({ query: querySub }),
  });
  const { data } = await res.json();
  //return data.getSubmissions;
  const submissions = data.getSubmissions || [];
  window.totalSubmissionCount = submissions.length;
    let globalSubmissionCounter =  document.getElementById("globalSubmissionCounter");
    if(globalSubmissionCounter){
     globalSubmissionCounter.textContent = window.totalSubmissionCount;
    }
  return submissions;
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
  const skeletonLoader = document.querySelector(".loaderSkeletonSubmission");
  if (skeletonLoader) {
    skeletonLoader.classList.add("hidden");
  }

  $("#submissionList").html(html);
  // initializeTribute();
  requestAnimationFrame(() => {
    highlightAndScrollSubmission();
  });
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
    const currentCount = parseInt(voteCountEl.textContent.trim(), 10) || 0;
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
    const currentCount = parseInt(voteCountEl.textContent.trim(), 10) || 0;
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
    const currentCount = parseInt(voteCountEl.textContent.trim(), 10) || 0;
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
  element.setAttribute("onclick", `voteOnSubmission('${submissionId}', this)`);
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
    const currentCount = parseInt(voteCountEl.textContent.trim(), 10) || 0;
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
  const targetElement = document.getElementById(`mainFileSubmissionList_${id}`);
  if (targetElement)
    targetElement.classList.add("opacity-50", "cursor-not-allowed");

  try {
    const response = await fetch("https://awc.vitalstats.app/api/v1/graphql", {
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
    });

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
    const response = await fetch("https://awc.vitalstats.app/api/v1/graphql", {
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
    });

    const result = await response.json();
    if (response.ok && targetElement) {
      targetElement.remove();
      const submissionIdForCounter =
        result.data.deleteForumComment.submissions_id;
      const counterElement = document.getElementById(
        `commentCounter_${submissionIdForCounter}`
      );
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
