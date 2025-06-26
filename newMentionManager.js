class NewMentionManager {
  static allContacts = [];

  static initContacts() {
    const getClassQuery = `
            query {
                getClasses(query: [{ where: { id: ${currentClassID} } }]) {
                    Teacher {
                        first_name
                        last_name
                        display_name
                        profile_image
                        unique_id
                        id
                    }
                    Enrolments {
                        Student {
                            first_name
                            last_name
                            display_name
                            profile_image
                            unique_id
                            id
                        }
                    }
                }
            }
        `;

    const getAdminQuery = `
            query {
                getContact(query: [{ where: { email: "courses@writerscentre.com.au" } }]) {
                    Display_Name: display_name
                    Contact_ID: id
                    Profile_Image: profile_image
                    Is_Instructor: is_instructor
                    Is_Admin: is_admin
                    Email: email
                }
            }
        `;

    const fetchClassContacts = fetch(graphqlApiEndpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Api-Key": apiAccessKey,
      },
      body: JSON.stringify({ query: getClassQuery }),
    }).then((res) =>
      res.ok ? res.json() : Promise.reject("getClasses query failed")
    );

    const fetchAdminContact = fetch(graphqlApiEndpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Api-Key": apiAccessKey,
      },
      body: JSON.stringify({ query: getAdminQuery }),
    }).then((res) =>
      res.ok ? res.json() : Promise.reject("getContact query failed")
    );

    Promise.all([fetchClassContacts, fetchAdminContact])
      .then(([classData, adminData]) => {
        const contacts = [];

        const result = classData.data.getClasses?.[0];
        if (result?.Teacher?.display_name?.trim()) {
          contacts.push({
            key: result.Teacher.display_name,
            value: result.Teacher.display_name,
            name: result.Teacher.display_name,
            id: result.Teacher.id,
            profileImage: result.Teacher.profile_image,
            isAdmin: false,
            isInstructor: true,
          });
        }

        (result?.Enrolments || []).forEach(({ Student }) => {
          if (Student?.display_name?.trim()) {
            contacts.push({
              key: Student.display_name,
              value: Student.display_name,
              name: Student.display_name,
              id: Student.id,
              profileImage: Student.profile_image,
              isAdmin: false,
              isInstructor: false,
            });
          }
        });

        const admin = adminData.data.getContact;
        if (admin?.Display_Name?.trim()) {
          contacts.push({
            key: admin.Display_Name,
            value: admin.Display_Name,
            name: admin.Display_Name,
            id: admin.Contact_ID,
            profileImage: admin.Profile_Image,
            isAdmin: true,
            isInstructor: admin.Is_Instructor,
          });
        }

        MentionManager.allContacts = contacts;
      })
      .catch((error) => {
      });
  }

  static initEditor(editor) {
    new Tribute({
      trigger: "@",
      allowSpaces: true,
      lookup: "name",
      values: MentionManager.fetchMentionContacts.bind(MentionManager),
      menuItemTemplate: MentionManager.mentionTemplate,
      selectTemplate: MentionManager.selectTemplate,
      menuContainer: document.body,
    }).attach(editor);
  }

  static fetchMentionContacts(text, cb) {
    const searchText = text.toLowerCase();
    const filtered = MentionManager.allContacts.filter((contact) =>
      contact.value.toLowerCase().includes(searchText)
    );
    cb(filtered);
  }

  static mentionTemplate(item) {
    return `<div class="flex items-center gap-3 px-3 py-2">
            <img class="w-6 h-6 rounded-full border border-[#d3d3d3]"
                src="${
                  item.original.profileImage &&
                  item.original.profileImage !==
                    "https://i.ontraport.com/abc.jpg"
                    ? item.original.profileImage
                    : "https://files.ontraport.com/media/b0456fe87439430680b173369cc54cea.php03bzcx?Expires=4895186056&Signature=fw-mkSjms67rj5eIsiDF9QfHb4EAe29jfz~yn3XT0--8jLdK4OGkxWBZR9YHSh26ZAp5EHj~6g5CUUncgjztHHKU9c9ymvZYfSbPO9JGht~ZJnr2Gwmp6vsvIpYvE1pEywTeoigeyClFm1dHrS7VakQk9uYac4Sw0suU4MpRGYQPFB6w3HUw-eO5TvaOLabtuSlgdyGRie6Ve0R7kzU76uXDvlhhWGMZ7alNCTdS7txSgUOT8oL9pJP832UsasK4~M~Na0ku1oY-8a7GcvvVv6j7yE0V0COB9OP0FbC8z7eSdZ8r7avFK~f9Wl0SEfS6MkPQR2YwWjr55bbJJhZnZA__&Key-Pair-Id=APKAJVAAMVW6XQYWSTNA"
                }"
                alt="${item.original.name}'s Profile Image" />
            <div class="text-primary">
                ${item.original.name}
                ${
                  item.original.isAdmin
                    ? " (Admin)"
                    : item.original.isInstructor
                    ? " (Teacher)"
                    : ""
                }
            </div>
        </div>`;
  }

  static selectTemplate(item) {
    return `<span class="mention" data-contact-id="${item.original.id}">@${item.original.value}</span>`;
  }
}
