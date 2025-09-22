class NewMentionManager {
    static allContacts = [];

    static initContacts() {
        // Decide whether to skip student fetch
        const isPrivate =
            typeof isAssessmentPrivateToCheckMentions !== "undefined" &&
            String(isAssessmentPrivateToCheckMentions).trim().toLowerCase() === "yes";

        const visitorIsAdmin =
            typeof isAdminVisitor !== "undefined" &&
            String(isAdminVisitor).trim().toLowerCase() === "yes";

        const visitorIsTeacher =
            typeof isTeacherVisitor !== "undefined" &&
            String(isTeacherVisitor).trim().toLowerCase() === "yes";

        // Private submissions restrict mentions to staff unless visitor is teacher/admin
        const restrictToStaffOnly =
            isPrivate && !visitorIsAdmin && !visitorIsTeacher;

        const classQueryFields = `
      Teacher {
        first_name
        last_name
        display_name
        profile_image
        unique_id
        id
      }
      ${restrictToStaffOnly ? "" : `
      Enrolments {
        Student {
          first_name
          last_name
          display_name
          profile_image
          unique_id
          id
        }
      }`}
    `;

        const getClassQuery = `
      query {
        getClasses(query: [{ where: { id: ${currentClassID} } }]) {
          ${classQueryFields}
        }
      }
    `;

        const getAdminQuery = `
      query {
        getContact(query: [{ where: { email: "courses@writerscentre.com.au" } }]) {
          Display_Name: display_name
          Contact_ID: id
          Unique_ID: unique_id 
          Profile_Image: profile_image
          Is_Instructor: is_instructor
          Is_Admin: is_admin
          Email: email
        }
      }
    `;

        const fetchClassContacts = fetch(useGloballyAPIEndPointURLGraphQL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Api-Key": useGloballyAPIKeyGraphQL,
            },
            body: JSON.stringify({ query: getClassQuery }),
        }).then((res) =>
            res.ok ? res.json() : Promise.reject("getClasses query failed")
        );

        const fetchAdminContact = fetch(useGloballyAPIEndPointURLGraphQL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Api-Key": useGloballyAPIKeyGraphQL,
            },
            body: JSON.stringify({ query: getAdminQuery }),
        }).then((res) =>
            res.ok ? res.json() : Promise.reject("getContact query failed")
        );

        Promise.all([fetchClassContacts, fetchAdminContact])
            .then(([classData, adminData]) => {
                const contacts = [];
                const result = classData?.data?.getClasses?.[0];

                if (result?.Teacher?.display_name?.trim()) {
                    contacts.push({
                        key: result.Teacher.display_name,
                        value: result.Teacher.display_name,
                        name: result.Teacher.display_name,
                        id: result.Teacher.id,
                        uniqueId: result.Teacher.unique_id,
                        profileImage: result.Teacher.profile_image,
                        isAdmin: false,
                        isInstructor: true,
                    });
                }

                if (!restrictToStaffOnly) {
                    (result?.Enrolments || []).forEach(({ Student }) => {
                        if (Student?.display_name?.trim()) {
                            contacts.push({
                                key: Student.display_name,
                                value: Student.display_name,
                                name: Student.display_name,
                                id: Student.id,
                                uniqueId: Student.unique_id,
                                profileImage: Student.profile_image,
                                isAdmin: false,
                                isInstructor: false,
                            });
                        }
                    });
                }

                const admin = adminData?.data?.getContact;
                if (admin?.Display_Name?.trim()) {
                    contacts.push({
                        key: admin.Display_Name,
                        value: admin.Display_Name,
                        name: admin.Display_Name,
                        id: admin.Contact_ID,
                        uniqueId: admin.Unique_ID,
                        profileImage: admin.Profile_Image,
                        isAdmin: true,
                        isInstructor: admin.Is_Instructor,
                    });
                }

                NewMentionManager.allContacts = contacts;
            })
            .catch((error) => {
                // optionally log error
                // console.error(error);
            });
    }

    static initEditor(editor) {
        new Tribute({
            trigger: "@",
            allowSpaces: true,
            lookup: "name",
            values: NewMentionManager.fetchMentionContacts.bind(NewMentionManager),
            menuItemTemplate: NewMentionManager.mentionTemplate,
            selectTemplate: NewMentionManager.selectTemplate,
            menuContainer: document.body,
        }).attach(editor);
    }

    static fetchMentionContacts(text, cb) {
        const searchText = text.toLowerCase();
        const filtered = NewMentionManager.allContacts.filter((contact) =>
            contact.value.toLowerCase().includes(searchText)
        );
        cb(filtered);
    }

    static mentionTemplate(item) {
        return `<div class="flex items-center gap-3 px-3 py-2">
      <img class="w-6 h-6 rounded-full border border-[#d3d3d3]"
        src="${item.original.profileImage &&
                item.original.profileImage !== "https://i.ontraport.com/abc.jpg"
                ? item.original.profileImage
                : "https://files.ontraport.com/media/b0456fe87439430680b173369cc54cea.php03bzcx?Expires=4895186056&Signature=fw-mkSjms67rj5eIsiDF9QfHb4EAe29jfz~yn3XT0--8jLdK4OGkxWBZR9YHSh26ZAp5EHj~6g5CUUncgjztHHKU9c9ymvZYfSbPO9JGht~ZJnr2Gwmp6vsvIpYvE1pEywTeoigeyClFm1dHrS7VakQk9uYac4Sw0suU4MpRGYQPFB6w3HUw-eO5TvaOLabtuSlgdyGRie6Ve0R7kzU76uXDvlhhWGMZ7alNCTdS7txSgUOT8oL9pJP832UsasK4~M~Na0ku1oY-8a7GcvvVv6j7yE0V0COB9OP0FbC8z7eSdZ8r7avFK~f9Wl0SEfS6MkPQR2YwWjr55bbJJhZnZA__&Key-Pair-Id=APKAJVAAMVW6XQYWSTNA"
            }"
        alt="${item.original.name}'s Profile Image" />
      <div class="text-primary">
        ${item.original.name}
        ${item.original.isAdmin
                ? " (Admin)"
                : item.original.isInstructor
                    ? " (Teacher)"
                    : ""
            }
      </div>
    </div>`;
    }

    static selectTemplate(item) {
        return `<span class="mention" data-mention-id="${item.original.uniqueId}" data-contact-id="${item.original.id}">@${item.original.value}</span>`;
    }
}

// Attach as you already do...
$(".comment-editor").each(function () {
    NewMentionManager.initEditor(this);
});

if ($(".newMentionable").length > 0) {
    $(".newMentionable").each(function () {
        NewMentionManager.initEditor(this);
    });
}

if ($("#announcementContent").length > 0) {
    $("#announcementContent").each(function () {
        NewMentionManager.initEditor(this);
    });
}

document.addEventListener("DOMContentLoaded", async () => {
    setTimeout(() => {
        try {
            NewMentionManager.initContacts();

            document.querySelectorAll(".mentionable").forEach((editor) => {
                if (!editor.hasAttribute("data-tribute-attached")) {
                    NewMentionManager.initEditor(editor);
                    editor.setAttribute("data-tribute-attached", "true");
                }

                function setPlaceholder() {
                    if (!editor.textContent.trim()) {
                        const span = document.createElement("span");
                        span.className =
                            "mention-placeholder text-[#586a80] text-base font-normal leading-normal pointer-events-none select-none";
                        span.innerHTML = "Type @ to mention members";
                        editor.appendChild(span);
                    }
                }

                editor.addEventListener("focus", () => {
                    const placeholder = editor.querySelector(".mention-placeholder");
                    if (placeholder) placeholder.remove();
                });

                editor.addEventListener("blur", () => {
                    setTimeout(() => {
                        if (
                            !editor.textContent.trim() &&
                            !editor.querySelector(".mention-placeholder")
                        ) {
                            setPlaceholder();
                        }
                    }, 10);
                });

                setPlaceholder();
            });
        } catch (err) { }
    }, 5000);
});
