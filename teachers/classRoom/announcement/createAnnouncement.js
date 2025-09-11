const DEFAULT_AVATAR =
    "https://file.ontraport.com/media/41ca85f5cdde4c12bf72c2c73747633f.phpkeya0n?Expires=4884400377&Signature=SnfrlziQIcYSbZ98OrH2guVWpO4BRcxatgk3lM~-mKaAencWy7e1yIuxDT4hQjz0hFn-fJ118InfvymhaoqgGxn63rJXeqJKB4JTkYauub5Jh5UO3z6S0o~RVMj8AMzoiImsvQoPuRK7KnuOAsGiVEmSsMHEiM69IWzi4dW~6pryIMSHQ9lztg1powm8b~iXUNG8gajRaQWxlTiSyhh-CV-7zkF-MCP5hf-3FAKtGEo79TySr5SsZApLjfOo-8W~F8aeXK8BGD3bX6T0U16HsVeu~y9gDCZ1lBbLZFh8ezPL~4gktRbgP59Us8XLyV2EKn6rVcQCsVVUk5tUVnaCJw__&Key-Pair-Id=APKAJVAAMVW6XQYWSTNA";
const announcementWrapper = document.querySelector("#announcementWrapper");

const updateContactMutation = `
  mutation updateContact($id: AwcContactID!, $payload: ContactUpdateInput!) {
    updateContact(
      query: [{ where: { id: $id } }]
      payload: $payload
    ) {
      has__new__notification
    }
  }
`;

function updateContact(id, payload) {
    return fetch(apiUrl, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Api-Key": apiKey,
        },
        body: JSON.stringify({
            query: updateContactMutation,
            variables: { id, payload },
        }),
    })
        .then((res) => res.json())
        .then((data) => {
            if (data?.data?.updateContact) {
                return data.data.updateContact;
            } else {
                throw new Error("Error updating contact");
            }
        });
}

async function updateMentionedContacts(mentionedIds) {
    for (const id of mentionedIds) {
        try {
            await updateContact(id, { has__new__notification: true });
        } catch (e) {
            console.error("Failed to update contact:", id, e);
        }
    }
}


function gatherMentionsFromElementt(el) {
    const mentionEls = el.querySelectorAll(".mention-handle[data-mention-id]");
    return [...mentionEls].map((m) => ({
        id: Number(m.getAttribute("data-mention-id")),
    }));
}

function formatUnixTimestamp(unixTimestamp) {
    if (!unixTimestamp || isNaN(unixTimestamp)) return "Invalid Date";
    const date = new Date(unixTimestamp * 1000);
    if (isNaN(date.getTime())) return "Invalid Date";

    return date.toLocaleString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });
}

//===== CREATE ANNOUNCEMENT FUNCTION ===================//
// Retry helpers
function sleep(ms){ return new Promise(r=>setTimeout(r, ms)); }
function isFatalError(err){
  try {
    const status = err?.status || err?.response?.status || err?.code;
    if (status && [400,401,403,404,409,422].includes(Number(status))) return true;
    const msg = String(err?.message||'').toLowerCase();
    const fatalHints = ['validation','invalid','unauthorized','forbidden','not found','schema','payload','required','missing'];
    if (fatalHints.some(h=>msg.includes(h))) return true;
    const gqlErrors = err?.errors || err?.graphQLErrors;
    if (Array.isArray(gqlErrors) && gqlErrors.length){
      const combined = gqlErrors.map(e=>String(e?.message||'').toLowerCase()).join(' | ');
      if (fatalHints.some(h=>combined.includes(h))) return true;
    }
  } catch(_){}
  return false;
}
async function retryUntilSuccess(fn,{initialDelayMs=500,maxDelayMs=30000,factor=2,jitter=0.2}={}){
  let delay=initialDelayMs, attempt=0;
  // eslint-disable-next-line no-constant-condition
  while(true){
    try { return await fn(attempt); }
    catch(err){
      attempt++;
      if (isFatalError(err)) throw err;
      let sleepMs = delay; if (jitter>0){ const d=sleepMs*jitter; sleepMs = Math.max(0, Math.round(sleepMs - d + Math.random()*(2*d))); }
      if (sleepMs>0) await sleep(sleepMs);
      delay = Math.min(maxDelayMs, Math.max(delay*factor, 500));
    }
  }
}

async function createAnnouncement(payload) {
    const query = `
            mutation createAnnouncement($payload: AnnouncementCreateInput = null) {
              createAnnouncement(payload: $payload) {
                ID: id 
                class_id 
                type 
                Title: title 
                Content: content 
                Date_Added: created_at 
                disable_comments  
                when_to_post 
                post_later_date_time 
                instructor_id 
                status 
                attachment
				notification__type 
 			Mentions {
     			 id 
    				}
                Instructor {
                  First_Name: first_name 
                  Last_Name: last_name
				  display_name: display_name
                  Profile_Image: profile_image 
                }
              }
            }
          `;
    try {
        const response = await retryUntilSuccess(() => fetch(apiUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json", "Api-Key": apiKey },
            body: JSON.stringify({ query, variables: { payload } }),
        }));
        if (!response.ok) { const txt = await response.text().catch(()=>""); const err = new Error("Failed to create announcement."); err.status=response.status; err.detail=txt; throw err; }
        const data = await response.json();
        if (data && Array.isArray(data.errors) && data.errors.length){ const e = new Error(data.errors.map(x=>x.message).join(' | ')); e.errors = data.errors; throw e; }
        return data?.data?.createAnnouncement || null;
    } catch (error) {
        return null;
    }
}

async function loadAnnouncements(id) {
    const announcementToGetId = id;
    const query = buildSchedfuled(announcementToGetId);
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
        let announcements = sanitizeAnnouncements(jsonData.data.getAnnouncements || []);
        const template = $.templates("#announcementTemplate");
        const htmlOutput = template.render({ announcements });

        const noAnnouncementSvg = document.querySelector(".noAnnouncementSVG");
        if (noAnnouncementSvg) {
            noAnnouncementSvg.classList.add("hidden");
        }
        $("#announcementsContainer").prepend(htmlOutput);
    } catch (error) {
        console.error("Error fetching announcements:", error);
    }
}

//=======================================================//
document
    .getElementById("announcementForm")
    .addEventListener("submit", async (e) => {
        e.preventDefault();

        if (e.submitter && e.submitter.id !== "postNow") return;

        const announcementForm = document.getElementById("announcementForm");
        const title = document.getElementById("announcementTitle").value.trim();
        const content = document.getElementById("announcementContent").innerHTML.trim();
        const disableComments = document.getElementById("postCheck").checked;

        document.querySelector(".attachBtn").style.display = "flex";
        document.querySelector(".refreshBtn").classList.add("hidden");
        document.querySelector(".deleteBtn").classList.add("hidden");
        document.querySelector(".filePreviewWrapper").classList.add("hidden");

        const tempContainer = document.createElement("div");
        tempContainer.innerHTML = content;
        let mentionedIds = [];
        tempContainer.querySelectorAll(".mention").forEach((mention) => {
            const id = mention.dataset.contactId;
            if (id && !mentionedIds.includes(Number(id))) {
                mentionedIds.push(Number(id));
            }
        });

        announcementForm.classList.add("opacity-50", "pointer-events-none", "cursor-not-allowed");

        let fileData = "";
        const fileInput = document.getElementById("attachment-file-input");
        const file = fileInput.files[0];
        let fileObject = null;

        if (file) {
            const fileFields = [{ fieldName: "attachment", file }];
            const toSubmitFields = {};
            try {
                await processFileFields(toSubmitFields, fileFields, awsParam, awsParamUrl);
                fileData = toSubmitFields.attachment || "";
                fileObject = {
                    link: JSON.parse(fileData).link || "",
                    name: file.name,
                    type: file.type,
                    s3_id: JSON.parse(fileData).s3_id || "",
                };
            } catch (err) {
                console.error("File upload failed:", err);
            }
        }

        const payload = {
            title,
            content,
            instructor_id: LOGGED_IN_USER_ID,
            class_id: classID,
            type: "Announcement",
            created_at: Math.floor(Date.now() / 1000),
            disable_comments: disableComments,
            when_to_post: "Post Now",
            status: "Published",
            attachment: fileData,
            Mentions: mentionedIds.map((id) => ({ id })),
            notification__type: "Announcements",
        };

        // Clear the form
        announcementForm.reset();
        document.getElementById("scheduleOptions").classList.add("hidden");
        document.getElementById("announcementContent").innerHTML = "";

        const createdAnnouncement = await createAnnouncement(payload);

        if (!createdAnnouncement) {
            announcementForm.classList.remove(
                "opacity-50",
                "pointer-events-none",
                "cursor-not-allowed"
            );
            return;
        }

        // Fire-and-forget: create alerts for a new announcement
        try {
            (async function createAnnouncementAlerts() {
                const status = String(createdAnnouncement?.status || '').toLowerCase();
                const clsId = Number(createdAnnouncement?.class_id || classID);
                if (!Number.isFinite(clsId)) return;
                const authorId = Number(createdAnnouncement?.instructor_id || LOGGED_IN_USER_ID);

                // Build roster
                const qClasses = `
                  query getClassStudents($id: AwcClassID) {
                    getClasses(query: [{ where: { id: $id } }]) {
                      id
                      unique_id
                      class_name
                      Course { unique_id course_name }
                      Enrolments { Student { id } }
                    }
                  }
                `;
                const qEnrol = `
                  query getClassEnrolmentStudents($id: AwcClassID) { calcEnrolments(query: [{ where: { class_id: $id } }]) { Student_ID: field(arg: ["Student","id"]) } }
                `;
                const qTeacher = `
                  query calcClasses($id: AwcClassID) { calcClasses(query: [{ where: { id: $id } }]) { Teacher_Contact_ID: field(arg: ["Teacher","id"]) } }
                `;
                const [resClasses, resEnrol, resTeacher] = await Promise.all([
                    fetch(apiUrlForAnouncement, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Api-Key': apiKeyForAnouncement }, body: JSON.stringify({ query: qClasses, variables: { id: clsId } }) }).then(r => r.ok ? r.json() : Promise.reject('getClasses failed')),
                    fetch(apiUrlForAnouncement, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Api-Key': apiKeyForAnouncement }, body: JSON.stringify({ query: qEnrol, variables: { id: clsId } }) }).then(r => r.ok ? r.json() : Promise.reject('calcEnrolments failed')),
                    fetch(apiUrlForAnouncement, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Api-Key': apiKeyForAnouncement }, body: JSON.stringify({ query: qTeacher, variables: { id: clsId } }) }).then(r => r.ok ? r.json() : Promise.reject('calcClasses failed')),
                ]);
                const norm = (list) => (Array.isArray(list) ? list : [list]).map(v => Number(v)).filter(n => Number.isFinite(n) && n > 0);
                const classes = Array.isArray(resClasses?.data?.getClasses) ? resClasses.data.getClasses : [];
                let classUid, className, courseUid;
                const idsFromClasses = classes.flatMap(c => {
                    if (!classUid && c?.unique_id) classUid = c.unique_id;
                    if (!className && c?.class_name) className = c.class_name;
                    if (!courseUid && c?.Course?.unique_id) courseUid = c.Course.unique_id;
                    return (Array.isArray(c?.Enrolments) ? c.Enrolments : []).map(e => e?.Student?.id).filter(Boolean);
                });
                const enrolRows = Array.isArray(resEnrol?.data?.calcEnrolments) ? resEnrol.data.calcEnrolments : [];
                const idsFromEnrol = enrolRows.flatMap(row => norm(row?.Student_ID));
                let teacherIds = [];
                const tRaw = resTeacher?.data?.calcClasses?.[0]?.Teacher_Contact_ID; if (tRaw != null) teacherIds = norm(tRaw);
                const adminIds = [10435];
                const seen = new Set();
                let audience = norm([...idsFromClasses, ...idsFromEnrol, ...teacherIds, ...adminIds])
                    .filter(n => (seen.has(n) ? false : (seen.add(n), true)))
                    .filter(id => id !== authorId);
                if (!audience.length) return;

                async function resolveStudentEid(studentId, clsId) {
                    try {
                        const cache = (window.__awcEidCache ||= new Map());
                        const k = String(clsId);
                        let byClass = cache.get(k);
                        if (!byClass) { byClass = new Map(); cache.set(k, byClass); }
                        const sid = Number(studentId);
                        if (byClass.has(sid)) return byClass.get(sid);
                        const q = `query getEnrolment($id: AwcContactID, $class_id: AwcClassID) { getEnrolment(query: [{ where: { student_id: $id } }, { andWhere: { class_id: $class_id } }]) { ID: id } }`;
                        const rs = await fetch(apiUrlForAnouncement, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Api-Key': apiKeyForAnouncement }, body: JSON.stringify({ query: q, variables: { id: Number(studentId), class_id: Number(clsId) } }) }).then(r => r.ok ? r.json() : null);
                        const eid = Number(rs?.data?.getEnrolment?.ID || 0);
                        if (Number.isFinite(eid) && eid > 0) { byClass.set(sid, eid); return eid; }
                        return undefined;
                    } catch (_) { return undefined; }
                }
                const tmp = document.createElement('div'); tmp.innerHTML = String(content || createdAnnouncement?.Content || '');
                const contentText = (tmp.textContent || '').trim();
                const createdAt = new Date().toISOString();
                const mentionSet = new Set((mentionedIds || []).map(Number));
                const alerts = await Promise.all(audience.map(async contactId => {
                    const isMentioned = mentionSet.has(Number(contactId));
                    const isTeacher = teacherIds.includes(Number(contactId));
                    const isAdmin = adminIds.includes(Number(contactId));
                    const role = isAdmin ? 'admin' : (isTeacher ? 'teacher' : 'students');
                    let eid; if (role === 'students') eid = await resolveStudentEid(contactId, clsId);
                    const params = { classId: clsId, classUid, className, courseUid, eid, announcementId: Number(createdAnnouncement?.ID || createdAnnouncement?.id) };
                    const originCanonical = (window.AWC && typeof window.AWC.buildAlertUrl === 'function') ? window.AWC.buildAlertUrl(role, 'announcement', params) : undefined;
                    const teacherCanonical = (window.AWC && typeof window.AWC.buildAlertUrl === 'function') ? window.AWC.buildAlertUrl('teacher', 'announcement', params) : undefined;
                    const adminCanonical = (window.AWC && typeof window.AWC.buildAlertUrl === 'function') ? window.AWC.buildAlertUrl('admin', 'announcement', params) : undefined;
                    return {
                        alert_type: isMentioned ? 'Announcement  Mention' : 'Announcement',
                        title: isMentioned ? 'You are mentioned in an announcement' : 'An announcement has been posted',
                        content: contentText,
                        created_at: createdAt,
                        is_mentioned: isMentioned,
                        is_read: false,
                        alert_status: (status === 'published') ? 'Published' : 'Not Published',
                        notified_contact_id: Number(contactId),
                        origin_url: originCanonical || window.location.href,
                        origin_url_teacher: teacherCanonical || window.location.href,
                        origin_url_admin: adminCanonical || window.location.href,
                        parent_class_id: clsId,
                        parent_announcement_id: Number(createdAnnouncement?.ID || createdAnnouncement?.id),
                    };
                }));
                // Create alerts via GraphQL batch mutation (no SDK)
                try {
                    const createAlertsMutation = `mutation createAlerts($payload: [AlertCreateInput] = null) { createAlerts(payload: $payload) { is_mentioned } }`;
                    await retryUntilSuccess(() => fetch(apiUrlForAnouncement, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json', 'Api-Key': apiKeyForAnouncement },
                        body: JSON.stringify({ query: createAlertsMutation, variables: { payload: alerts } }),
                    }).then(r => { if(!r.ok){ const e=new Error('createAlerts failed'); e.status=r.status; throw e;} return r.json(); }));
                } catch (e) {
                    console.error('Failed to create announcement alerts (batch)', e);
                }
            })();
        } catch (e) { console.error('Announcement alert error', e); }

        await loadAnnouncements(createdAnnouncement.ID);
        updateMentionedContacts(mentionedIds).catch(console.error);

        announcementForm.classList.remove("opacity-50", "pointer-events-none", "cursor-not-allowed");
    });
//=======================================================//

// "Post Later" button handler
document.getElementById("postLater").addEventListener("click", (e) => {
    document.getElementById("scheduleOptions").classList.toggle("hidden");
});

document.addEventListener("click", (e) => {
    const scheduleOptions = document.getElementById("scheduleOptions");
    const postLater = document.getElementById("postLater");

    if (
        !scheduleOptions.classList.contains("hidden") &&
        !scheduleOptions.contains(e.target) &&
        !postLater.contains(e.target)
    ) {
        scheduleOptions.classList.add("hidden");
    }
});
//=======================================================//

// Radio button change handler for schedule options
document.getElementsByName("scheduleOption").forEach((radio) => {
    radio.addEventListener("change", (e) => {
        if (e.target.value === "custom") {
            document.getElementById("customSchedule").classList.remove("hidden");
        } else {
            document.getElementById("customSchedule").classList.add("hidden");
        }
    });
});
//=======================================================//

// "Schedule Announcement" button handler
document
    .getElementById("confirmSchedule")
    .addEventListener("click", async () => {
        const announcementForm = document.getElementById("announcementForm");
        announcementForm.classList.add(
            "opacity-50",
            "pointer-events-none",
            "cursor-not-allowed"
        );
        const title = document.getElementById("announcementTitle").value.trim();
        const content = document
            .getElementById("announcementContent")
            .innerHTML.trim();
        const disableComments = document.getElementById("postCheck").checked;
        const selectedOption = document.querySelector(
            'input[name="scheduleOption"]:checked'
        );
        const userMentionsFromMentionable = gatherMentionsFromElementt(
            document
                .querySelector("#confirmSchedule")
                .closest("#announcementForm")
                .querySelector(".mentionable")
        );
        if (!selectedOption) {
            return;
        }
        let scheduledTimestamp;
        const currentTimestamp = Math.floor(Date.now() / 1000);
        if (selectedOption.value === "12") {
            scheduledTimestamp = currentTimestamp + 12 * 3600;
        } else if (selectedOption.value === "24") {
            scheduledTimestamp = currentTimestamp + 24 * 3600;
        } else if (selectedOption.value === "custom") {
            const customDateTimeValue =
                document.getElementById("customDateTime").value;
            if (!customDateTimeValue) {
                return;
            }
            scheduledTimestamp = Math.floor(
                new Date(customDateTimeValue).getTime() / 1000
            );
        }

        const tempContainer = document.createElement("div");
        tempContainer.innerHTML = content;
        let mentionedIds = [];
        tempContainer.querySelectorAll(".mention").forEach((mention) => {
            const id = mention.dataset.contactId;
            if (id && !mentionedIds.includes(Number(id)))
                mentionedIds.push(Number(id));
        });

        // Handle attachment (mirror "Post Now" flow)
        let fileData = "";
        const fileInput = document.getElementById("attachment-file-input");
        const file = fileInput?.files?.[0];
        let fileObject = null;

        // Tidy up the UI while scheduling, same as submit flow
        try {
            document.querySelector(".attachBtn").style.display = "flex";
            document.querySelector(".refreshBtn").classList.add("hidden");
            document.querySelector(".deleteBtn").classList.add("hidden");
            document.querySelector(".filePreviewWrapper").classList.add("hidden");
        } catch (_) {}

        if (file) {
            const fileFields = [{ fieldName: "attachment", file }];
            const toSubmitFields = {};
            try {
                await processFileFields(
                    toSubmitFields,
                    fileFields,
                    awsParam,
                    awsParamUrl
                );
                fileData = toSubmitFields.attachment || "";
                fileObject = {
                    link: JSON.parse(fileData).link || "",
                    name: file.name,
                    type: file.type,
                    s3_id: JSON.parse(fileData).s3_id || "",
                };
            } catch (err) {
                console.error("File upload failed:", err);
            }
        }

        const payload = {
            title,
            content,
            instructor_id: LOGGED_IN_USER_ID,
            class_id: classID,
            type: "Announcement",
            created_at: Math.floor(Date.now() / 1000),
            disable_comments: disableComments,
            when_to_post: "Post Later",
            status: "Draft",
            post_later_date_time: scheduledTimestamp,
            attachment: fileData,
            Mentions: mentionedIds.map((id) => ({
                id: id,
            })),
        };
        document.getElementById("announcementForm").reset();
        document.getElementById("scheduleOptions").classList.add("hidden");
        const createdAnnouncementss = await createAnnouncement(payload);
        const createdAnnouncementId = createdAnnouncementss.ID;
        await updateMentionedContacts(mentionedIds);
        loadAnnouncements(createdAnnouncementId);
        document.getElementById("announcementContent").innerHTML = "";
        announcementForm.classList.remove(
            "opacity-50",
            "pointer-events-none",
            "cursor-not-allowed"
        );
    });

async function cancelScheduledPost(id) {
    const announcementEl = document.querySelector(
        `[data-announcement-template-id="${id}"]`
    );
    if (announcementEl) announcementEl.style.opacity = 0.5;

    const deleteMutation = `
      mutation deleteAnnouncement($id: AwcAnnouncementID) {
        deleteAnnouncement(query: [{ where: { id: $id } }]) { id }
      }`;

    try {
        const response = await fetch(apiUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json", "Api-Key": apiKey },
            body: JSON.stringify({ query: deleteMutation, variables: { id } }),
        });

        const result = await response.json();
        if (result.data?.deleteAnnouncement) {
            announcementEl.remove();
        } else {
            announcementEl.style.opacity = 1;
        }
    } catch (error) {
        announcementEl.style.opacity = 1;
    }
}

async function postScheduledAnnouncementNow(id) {
    const announcementForms = document.getElementById("announcementForm");
    announcementForms.classList.add(
        "opacity-50",
        "pointer-events-none",
        "cursor-not-allowed"
    );
    const announcementEl = document.querySelector(
        `[data-announcement-template-id="${id}"]`
    );
    if (announcementEl) announcementEl.style.opacity = 0.5;

    const updateMutation = `
        mutation updateAnnouncement($id: AwcAnnouncementID, $payload: AnnouncementUpdateInput = null) {
            updateAnnouncement(
                query: [{ where: { id: $id } }]
                payload: $payload
            ) {
                when_to_post
                post_later_date_time
                status 
                created_at 
            }
        }`;

    const payload = {
        when_to_post: "Post Now",
        post_later_date_time: null,
        status: "Published",
        created_at: Math.floor(Date.now() / 1000),
    };

    try {
        const response = await fetch(apiUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json", "Api-Key": apiKey },
            body: JSON.stringify({
                query: updateMutation,
                variables: { id, payload },
            }),
        });

        const result = await response.json();
        if (result.data?.updateAnnouncement) {
            announcementEl.remove();
            loadAnnouncements(id);
            document.getElementById("announcementContent").innerHTML = "";
            announcementForm.classList.remove(
                "opacity-50",
                "pointer-events-none",
                "cursor-not-allowed"
            );
            // After publishing the scheduled announcement, publish its alerts
            try {
                const qFind = `query calcAlerts($parent_announcement_id: AwcAnnouncementID) { calcAlerts(query: [{ where: { parent_announcement_id: $parent_announcement_id } }]) { ID: field(arg: ["id"]) } }`;
                const resFind = await fetch(apiUrl, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Api-Key': apiKey }, body: JSON.stringify({ query: qFind, variables: { parent_announcement_id: id } }) });
                const jsFind = await resFind.json();
                const alertIds = Array.isArray(jsFind?.data?.calcAlerts) ? jsFind.data.calcAlerts.map(r => Number(r?.ID)).filter(n => Number.isFinite(n)) : [];
                const mut = `mutation updateAlerts($id: AwcAlertID, $payload: AlertUpdateInput = null) { updateAlerts(query: [{ where: { id: $id } }], payload: $payload) { alert_status } }`;
                for (const aid of alertIds) {
                    try {
                        await fetch(apiUrl, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Api-Key': apiKey }, body: JSON.stringify({ query: mut, variables: { id: aid, payload: { alert_status: 'Published' } } }) });
                    } catch(_) {}
                }
            } catch(_) {}
        } else {
            announcementEl.style.opacity = 1;
        }
    } catch (error) {
        announcementEl.style.opacity = 1;
    }
}

document.addEventListener("DOMContentLoaded", function () {
    const fileInput = document.getElementById("attachment-file-input");
    const attachBtn = document.querySelector(".attachBtn");
    const refreshBtn = document.querySelector(".refreshBtn");
    const deleteBtn = document.querySelector(".deleteBtn");
    const filePreviewWrapper = document.querySelector(".filePreviewWrapper");

    function resetFileUploadUI() {
        refreshBtn.classList.add("hidden");
        deleteBtn.classList.add("hidden");
        attachBtn.style.display = "flex";
        filePreviewWrapper.innerHTML = "";
        filePreviewWrapper.classList.add("hidden");
        fileInput.value = "";
    }

    fileInput.addEventListener("change", function () {
        if (fileInput.files.length > 0) {
            filePreviewWrapper.classList.remove("hidden");
            const fileName = fileInput.files[0].name;

            attachBtn.style.display = "none";
            refreshBtn.classList.remove("hidden");
            deleteBtn.classList.remove("hidden");

            filePreviewWrapper.innerHTML = `
                <div class="filePreview flex items-center gap-2 bg-[#C7E6E6] p-4">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M20.6981 7.60962L15.3135 2.225C15.242 2.15359 15.1571 2.09696 15.0637 2.05836C14.9704 2.01975 14.8703 1.99992 14.7692 2H5.53846C5.13044 2 4.73912 2.16209 4.4506 2.45061C4.16209 2.73912 4 3.13044 4 3.53846V20.4615C4 20.8696 4.16209 21.2609 4.4506 21.5494C4.73912 21.8379 5.13044 22 5.53846 22H19.3846C19.7926 22 20.184 21.8379 20.4725 21.5494C20.761 21.2609 20.9231 20.8696 20.9231 20.4615V8.15385C20.9232 8.0528 20.9033 7.95273 20.8647 7.85935C20.8261 7.76597 20.7695 7.68111 20.6981 7.60962ZM15.5385 16.6154H9.38462C9.1806 16.6154 8.98495 16.5343 8.84069 16.3901C8.69643 16.2458 8.61538 16.0502 8.61538 15.8462C8.61538 15.6421 8.69643 15.4465 8.84069 15.3022C8.98495 15.158 9.1806 15.0769 9.38462 15.0769H15.5385C15.7425 15.0769 15.9381 15.158 16.0824 15.3022C16.2266 15.4465 16.3077 15.6421 16.3077 15.8462C16.3077 16.0502 16.2266 16.2458 16.0824 16.3901C15.9381 16.5343 15.7425 16.6154 15.5385 16.6154ZM15.5385 13.5385H9.38462C9.1806 13.5385 8.98495 13.4574 8.84069 13.3132C8.69643 13.1689 8.61538 12.9732 8.61538 12.7692C8.61538 12.5652 8.69643 12.3696 8.84069 12.2253C8.98495 12.081 9.1806 12 9.38462 12H15.5385C15.7425 12 15.9381 12.081 16.0824 12.2253C16.2266 12.3696 16.3077 12.5652 16.3077 12.7692C16.3077 12.9732 16.2266 13.1689 16.0824 13.3132C15.9381 13.4574 15.7425 13.5385 15.5385 13.5385ZM14.7692 8.15385V3.92308L19 8.15385H14.7692Z" fill="#007C8F"/></svg>
                    <span class="fileName text-[#007b8e] text-sm font-semibold font-['Open Sans'] leading-[18px]">${fileName}</span>
                </div>
            `;
        }
    });

    refreshBtn.addEventListener("click", function (event) {
        event.stopPropagation();
        fileInput.click();
    });

    deleteBtn.addEventListener("click", function (event) {
        event.stopPropagation();
        resetFileUploadUI();
    });

    document
        .getElementById("announcementForm")
        .addEventListener("submit", function () {
            resetFileUploadUI();
        });
});

document.addEventListener("click", (e) => {
    if (e.target.closest("#cancelPost")) {
        const announcementID = e.target
            .closest("[data-announcement-template-id]")
            .getAttribute("data-announcement-template-id");
        cancelScheduledPost(announcementID);
    }

    if (e.target.closest("#postScheduledImmediately")) {
        const announcementID = e.target
            .closest("[data-announcement-template-id]")
            .getAttribute("data-announcement-template-id");
        postScheduledAnnouncementNow(announcementID);
    }
});

document.addEventListener("click", (e) => {
    if (!e.target.closest(".deleteReply")) return;
    const replyID = e.target
        .closest("[data-reply-id]")
        .getAttribute("data-reply-id");
    deleteReply(replyID);
});

async function renderAnnouncementOnTabClick() {
    let announcements = await fetchAllAnnouncements(classID);
    await renderAnnouncements(announcements);
}

document.addEventListener("DOMContentLoaded", function () {
    const checkbox = document.getElementById("postCheck");
    const unCheckedSVG = document.querySelector(".unChecked");
    const checkedSVG = document.querySelector(".checked");

    checkbox.addEventListener("change", function () {
        if (this.checked) {
            unCheckedSVG.classList.add("hidden");
            checkedSVG.classList.remove("hidden");
        } else {
            unCheckedSVG.classList.remove("hidden");
            checkedSVG.classList.add("hidden");
        }
    });
});

document.getElementById("allTabs").addEventListener("click", async () => {
    document.getElementById("allTabs").classList.add("activeTab");
    document.getElementById("scheduledTabs").classList.remove("activeTab");
    fetchAnnouncements();
});

document.getElementById("scheduledTabs").addEventListener("click", async () => {
    document.getElementById("scheduledTabs").classList.add("activeTab");
    document.getElementById("allTabs").classList.remove("activeTab");
    fetchAnnouncements();
});
