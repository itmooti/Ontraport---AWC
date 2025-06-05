class MentionManager {
  static allContacts = [];

  static initContacts() {
    let classIfForChat=classIdUrl();
    const classQuery = `
      query {
        getClasses(query: [{ where: { id: "${classIfForChat}" } }]) {
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

    const adminQuery = `
      query {
        getContact(query: [{ where: { email: "courses@writerscentre.com.au" } }]) {
          Display_Name: display_name
          FirstName: first_name
          LastName: last_name
          Contact_ID: id
          Profile_Image: profile_image
          Is_Instructor: is_instructor
          Is_Admin: is_admin
          Email: email
        }
      }
    `;

    const classFetch = fetch(graphqlApiEndpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Api-Key": apiAccessKey,
      },
      body: JSON.stringify({ query: classQuery }),
    }).then((res) =>
      res.ok ? res.json() : Promise.reject("Class query failed")
    );

    const adminFetch = fetch(graphqlApiEndpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Api-Key": apiAccessKey,
      },
      body: JSON.stringify({ query: adminQuery }),
    }).then((res) =>
      res.ok ? res.json() : Promise.reject("Admin query failed")
    );

    Promise.all([classFetch, adminFetch])
      .then(([classData, adminData]) => {
        const result = classData.data.getClasses?.[0];
        const contacts = [];

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
        console.error("Error fetching mention contacts:", error);
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
          item.original.profileImage !== "https://i.ontraport.com/abc.jpg"
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

$(".comment-editor").each(function () {
  MentionManager.initEditor(this);
});

if ($("#announcementContent").length > 0) {
  $("#announcementContent").each(function () {
    MentionManager.initEditor(this);
  });
}

function renderAudioPlayer(link) {
  return `
              <div class="flex flex-col gap-y-4 mt-2 mb-4 p-4 bg-[#ebf6f6]" x-init="initPlayer()" x-data="audioPlayer();">
                  <div class=" flex items-center justify-between">
                      <div class="flex items-center gap-x-2" @click="muteUnmuteSound()">
                          <svg x-bind:class="volume==0?'hidden':'block'" width="24" height="24" viewBox="0 0 24 24" fill="none"
                              xmlns="http://www.w3.org/2000/svg">
                              <path
                                  d="M14.7689 16.9995C14.7681 17.678 14.5903 18.3445 14.253 18.9332C13.9158 19.5219 13.4308 20.0124 12.8459 20.3562C12.6707 20.4434 12.4689 20.4606 12.2816 20.4042C12.0942 20.3479 11.9354 20.2223 11.8373 20.053C11.7393 19.8836 11.7095 19.6833 11.754 19.4928C11.7984 19.3022 11.9138 19.1358 12.0767 19.0274C12.4293 18.8192 12.7216 18.5227 12.9246 18.1671C13.1277 17.8115 13.2345 17.409 13.2345 16.9995C13.2345 16.59 13.1277 16.1876 12.9246 15.832C12.7216 15.4764 12.4293 15.1799 12.0767 14.9717C11.9138 14.8633 11.7984 14.6968 11.754 14.5063C11.7095 14.3158 11.7393 14.1155 11.8373 13.9461C11.9354 13.7768 12.0942 13.6512 12.2816 13.5949C12.4689 13.5385 12.6707 13.5557 12.8459 13.6429C13.4308 13.9867 13.9158 14.4772 14.253 15.0659C14.5903 15.6546 14.7681 16.3211 14.7689 16.9995ZM9.67867 12.0583C9.53814 12 9.38347 11.9847 9.23422 12.0143C9.08498 12.0439 8.94787 12.1171 8.84024 12.2247L6.75857 14.3073H4.76921C4.5652 14.3073 4.36955 14.3884 4.2253 14.5326C4.08104 14.6769 4 14.8725 4 15.0765V18.9226C4 19.1266 4.08104 19.3222 4.2253 19.4665C4.36955 19.6107 4.5652 19.6918 4.76921 19.6918H6.75857L8.84024 21.7744C8.94782 21.8821 9.08493 21.9555 9.23422 21.9852C9.38351 22.0149 9.53827 21.9997 9.6789 21.9414C9.81953 21.8831 9.9397 21.7845 10.0242 21.6579C10.1087 21.5312 10.1538 21.3824 10.1537 21.2302V12.7689C10.1536 12.6168 10.1085 12.4681 10.0239 12.3416C9.93939 12.2151 9.81924 12.1165 9.67867 12.0583ZM20.9226 8.15366V20.461C20.9226 20.869 20.7605 21.2603 20.472 21.5488C20.1835 21.8373 19.7922 21.9994 19.3841 21.9994H16.3073C16.1033 21.9994 15.9077 21.9184 15.7634 21.7741C15.6192 21.6298 15.5381 21.4342 15.5381 21.2302C15.5381 21.0262 15.6192 20.8305 15.7634 20.6863C15.9077 20.542 16.1033 20.461 16.3073 20.461H19.3841V8.92287H14.7689C14.5649 8.92287 14.3692 8.84183 14.225 8.69757C14.0807 8.55332 13.9997 8.35767 13.9997 8.15366V3.53842H5.53841V11.2305C5.53841 11.4345 5.45737 11.6301 5.31312 11.7744C5.16886 11.9187 4.97321 11.9997 4.76921 11.9997C4.5652 11.9997 4.36955 11.9187 4.2253 11.7744C4.08104 11.6301 4 11.4345 4 11.2305V3.53842C4 3.1304 4.16208 2.7391 4.45059 2.45059C4.7391 2.16208 5.1304 2 5.53841 2H14.7689C14.8699 1.99992 14.97 2.01975 15.0634 2.05836C15.1568 2.09696 15.2416 2.15358 15.3131 2.22499L20.6976 7.60945C20.769 7.68093 20.8256 7.76579 20.8642 7.85917C20.9028 7.95255 20.9226 8.05262 20.9226 8.15366ZM15.5381 7.38445H18.2967L15.5381 4.62588V7.38445Z"
                                  fill="#007C8F" />
                          </svg>
                          <svg x-bind:class="volume==0?'block':'hidden'" width="24" height="24" viewBox="0 0 24 24" fill="none"
                              xmlns="http://www.w3.org/2000/svg">
                              <path
                                  d="M14.7689 16.9995C14.7681 17.678 14.5903 18.3445 14.253 18.9332C13.9158 19.5219 13.4308 20.0124 12.8459 20.3562C12.6707 20.4434 12.4689 20.4606 12.2816 20.4042C12.0942 20.3479 11.9354 20.2223 11.8373 20.053C11.7393 19.8836 11.7095 19.6833 11.754 19.4928C11.7984 19.3022 11.9138 19.1358 12.0767 19.0274C12.4293 18.8192 12.7216 18.5227 12.9246 18.1671C13.1277 17.8115 13.2345 17.409 13.2345 16.9995C13.2345 16.59 13.1277 16.1876 12.9246 15.832C12.7216 15.4764 12.4293 15.1799 12.0767 14.9717C11.9138 14.8633 11.7984 14.6968 11.754 14.5063C11.7095 14.3158 11.7393 14.1155 11.8373 13.9461C11.9354 13.7768 12.0942 13.6512 12.2816 13.5949C12.4689 13.5385 12.6707 13.5557 12.8459 13.6429C13.4308 13.9867 13.9158 14.4772 14.253 15.0659C14.5903 15.6546 14.7681 16.3211 14.7689 16.9995ZM9.67867 12.0583C9.53814 12 9.38347 11.9847 9.23422 12.0143C9.08498 12.0439 8.94787 12.1171 8.84024 12.2247L6.75857 14.3073H4.76921C4.5652 14.3073 4.36955 14.3884 4.2253 14.5326C4.08104 14.6769 4 14.8725 4 15.0765V18.9226C4 19.1266 4.08104 19.3222 4.2253 19.4665C4.36955 19.6107 4.5652 19.6918 4.76921 19.6918H6.75857L8.84024 21.7744C8.94782 21.8821 9.08493 21.9555 9.23422 21.9852C9.38351 22.0149 9.53827 21.9997 9.6789 21.9414C9.81953 21.8831 9.9397 21.7845 10.0242 21.6579C10.1087 21.5312 10.1538 21.3824 10.1537 21.2302V12.7689C10.1536 12.6168 10.1085 12.4681 10.0239 12.3416C9.93939 12.2151 9.81924 12.1165 9.67867 12.0583ZM20.9226 8.15366V20.461C20.9226 20.869 20.7605 21.2603 20.472 21.5488C20.1835 21.8373 19.7922 21.9994 19.3841 21.9994H16.3073C16.1033 21.9994 15.9077 21.9184 15.7634 21.7741C15.6192 21.6298 15.5381 21.4342 15.5381 21.2302C15.5381 21.0262 15.6192 20.8305 15.7634 20.6863C15.9077 20.542 16.1033 20.461 16.3073 20.461H19.3841V8.92287H14.7689C14.5649 8.92287 14.3692 8.84183 14.225 8.69757C14.0807 8.55332 13.9997 8.35767 13.9997 8.15366V3.53842H5.53841V11.2305C5.53841 11.4345 5.45737 11.6301 5.31312 11.7744C5.16886 11.9187 4.97321 11.9997 4.76921 11.9997C4.5652 11.9997 4.36955 11.9187 4.2253 11.7744C4.08104 11.6301 4 11.4345 4 11.2305V3.53842C4 3.1304 4.16208 2.7391 4.45059 2.45059C4.7391 2.16208 5.1304 2 5.53841 2H14.7689C14.8699 1.99992 14.97 2.01975 15.0634 2.05836C15.1568 2.09696 15.2416 2.15358 15.3131 2.22499L20.6976 7.60945C20.769 7.68093 20.8256 7.76579 20.8642 7.85917C20.9028 7.95255 20.9226 8.05262 20.9226 8.15366ZM15.5381 7.38445H18.2967L15.5381 4.62588V7.38445Z"
                                  fill="#d3d3d3" />
                          </svg>

                          <div class="">Audio</div>
                      </div>
                      <div @click="downloadAudio()">
                          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                              <path
                                  d="M22 14.5V21.1667C22 21.3877 21.9122 21.5996 21.7559 21.7559C21.5996 21.9122 21.3877 22 21.1667 22H2.83333C2.61232 22 2.40036 21.9122 2.24408 21.7559C2.0878 21.5996 2 21.3877 2 21.1667V14.5C2 14.279 2.0878 14.067 2.24408 13.9107C2.40036 13.7545 2.61232 13.6667 2.83333 13.6667C3.05435 13.6667 3.26631 13.7545 3.42259 13.9107C3.57887 14.067 3.66667 14.279 3.66667 14.5V20.3333H20.3333V14.5C20.3333 14.279 20.4211 14.067 20.5774 13.9107C20.7337 13.7545 20.9457 13.6667 21.1667 13.6667C21.3877 13.6667 21.5996 13.7545 21.7559 13.9107C21.9122 14.067 22 14.279 22 14.5ZM11.4104 15.0896C11.4878 15.1671 11.5797 15.2285 11.6809 15.2705C11.782 15.3124 11.8905 15.334 12 15.334C12.1095 15.334 12.218 15.3124 12.3191 15.2705C12.4203 15.2285 12.5122 15.1671 12.5896 15.0896L16.7563 10.9229C16.8729 10.8064 16.9524 10.6578 16.9846 10.4961C17.0168 10.3344 17.0003 10.1667 16.9372 10.0143C16.8741 9.86199 16.7671 9.73179 16.63 9.64023C16.4928 9.54867 16.3316 9.49987 16.1667 9.5H12.8333V2.83333C12.8333 2.61232 12.7455 2.40036 12.5893 2.24408C12.433 2.0878 12.221 2 12 2C11.779 2 11.567 2.0878 11.4107 2.24408C11.2545 2.40036 11.1667 2.61232 11.1667 2.83333V9.5H7.83333C7.66842 9.49987 7.50718 9.54867 7.37002 9.64023C7.23285 9.73179 7.12594 9.86199 7.06281 10.0143C6.99969 10.1667 6.98318 10.3344 7.01539 10.4961C7.0476 10.6578 7.12707 10.8064 7.24375 10.9229L11.4104 15.0896Z"
                                  fill="#007C8F" />
                          </svg>
                      </div>
                  </div>
                  <div class="flex items-center justify-between gap-x-4">
                      <div x-on:click=" playPauseAudio()"
                          class="w-7 p-2 bg-[#007c8f] rounded-full overflow-hidden flex items-center justify-center cursor-pointer ">
                          <svg x-show="!isPlaying" width="9" height="10" viewBox="0 0 9 10" fill="none"
                              xmlns="http://www.w3.org/2000/svg">
                              <path
                                  d="M8.46113 5C8.46145 5.13058 8.42797 5.25903 8.36394 5.37284C8.29992 5.48665 8.20753 5.58196 8.09577 5.64949L1.16917 9.88678C1.05239 9.95829 0.918642 9.99733 0.781731 9.99987C0.644819 10.0024 0.509713 9.96834 0.390366 9.90121C0.272155 9.83511 0.173682 9.73873 0.105074 9.62196C0.0364653 9.50519 0.000197518 9.37225 0 9.23682V0.763184C0.000197518 0.627751 0.0364653 0.494814 0.105074 0.378045C0.173682 0.261275 0.272155 0.164887 0.390366 0.0987929C0.509713 0.031656 0.644819 -0.00240351 0.781731 0.000131891C0.918642 0.00266729 1.05239 0.0417057 1.16917 0.113215L8.09577 4.35051C8.20753 4.41804 8.29992 4.51335 8.36394 4.62716C8.42797 4.74097 8.46145 4.86942 8.46113 5Z"
                                  fill="white" />
                          </svg>
                          <svg x-show="isPlaying" width="10" height="10" viewBox="0 0 24 24" fill="none"
                              xmlns="http://www.w3.org/2000/svg" style="display: none;">
                              <path
                                  d="M21.3333 3.66667V20.3333C21.3333 20.7754 21.1577 21.1993 20.8452 21.5118C20.5326 21.8244 20.1087 22 19.6667 22H15.5C15.058 22 14.6341 21.8244 14.3215 21.5118C14.0089 21.1993 13.8333 20.7754 13.8333 20.3333V3.66667C13.8333 3.22464 14.0089 2.80072 14.3215 2.48816C14.6341 2.17559 15.058 2 15.5 2H19.6667C20.1087 2 20.5326 2.17559 20.8452 2.48816C21.1577 2.80072 21.3333 3.22464 21.3333 3.66667ZM8.83333 2H4.66667C4.22464 2 3.80072 2.17559 3.48816 2.48816C3.17559 2.80072 3 3.22464 3 3.66667V20.3333C3 20.7754 3.17559 21.1993 3.48816 21.5118C3.80072 21.8244 4.22464 22 4.66667 22H8.83333C9.27536 22 9.69928 21.8244 10.0118 21.5118C10.3244 21.1993 10.5 20.7754 10.5 20.3333V3.66667C10.5 3.22464 10.3244 2.80072 10.0118 2.48816C9.69928 2.17559 9.27536 2 8.83333 2Z"
                                  fill="white"></path>
                          </svg>
                      </div>
                      <div x-text="formattedTime" class="text-[#007c8f] label"></div>
                      <div class="grow relative">
                          <input x-model="currentTime" type="range" min="0" :max="duration" value="0" step="00.01" @input="seek()"
                              class="w-full accent-gray-700  absolute top-1/2 left-0 -translate-y-1/2 bg-transparent cursor-pointer">
                      </div>
                      <div x-text="formattedRemainingTime" class="label text-[#007c8f]">-17:54</div>
                      <div @click="muteUnmuteSound()">
                          <svg x-bind:class=" volume==0?'hidden':'block'" width="24" height="24" viewBox="0 0 24 24" fill="none"
                              xmlns="http://www.w3.org/2000/svg">
                              <path
                                  d="M14.4123 3.70994V20.2114C14.4144 20.3348 14.3844 20.4568 14.3254 20.5652C14.2663 20.6737 14.1801 20.765 14.0752 20.8302C13.9561 20.9011 13.8183 20.9344 13.6799 20.9258C13.5415 20.9172 13.4089 20.8671 13.2995 20.782L7.64758 16.386C7.6066 16.3536 7.57352 16.3123 7.55082 16.2653C7.52813 16.2183 7.51641 16.1667 7.51656 16.1144V7.81202C7.51672 7.75958 7.52883 7.70787 7.55199 7.66082C7.57514 7.61377 7.60872 7.57262 7.65017 7.5405L13.3021 3.14449C13.4259 3.04851 13.5788 2.99758 13.7355 3.00009C13.8921 3.0026 14.0433 3.05839 14.164 3.15828C14.2433 3.22641 14.3067 3.31114 14.3496 3.40647C14.3925 3.50181 14.4139 3.60541 14.4123 3.70994ZM5.79264 7.82581H3.37914C3.01337 7.82581 2.66258 7.97111 2.40394 8.22975C2.1453 8.48839 2 8.83918 2 9.20495V14.7215C2 15.0873 2.1453 15.4381 2.40394 15.6967C2.66258 15.9554 3.01337 16.1007 3.37914 16.1007H5.79264C5.88408 16.1007 5.97178 16.0643 6.03644 15.9997C6.1011 15.935 6.13742 15.8473 6.13742 15.7559V8.1706C6.13742 8.07915 6.1011 7.99146 6.03644 7.9268C5.97178 7.86214 5.88408 7.82581 5.79264 7.82581ZM16.7197 9.62214C16.6516 9.68198 16.596 9.75466 16.556 9.83602C16.5161 9.91738 16.4925 10.0058 16.4868 10.0963C16.481 10.1868 16.4931 10.2775 16.5224 10.3632C16.5518 10.449 16.5977 10.5282 16.6577 10.5962C16.9903 10.9739 17.1738 11.4599 17.1738 11.9632C17.1738 12.4665 16.9903 12.9526 16.6577 13.3303C16.5961 13.398 16.5486 13.4772 16.518 13.5634C16.4873 13.6495 16.4741 13.741 16.4791 13.8323C16.4842 13.9236 16.5073 14.013 16.5472 14.0953C16.5871 14.1777 16.643 14.2512 16.7116 14.3117C16.7802 14.3722 16.8602 14.4184 16.9469 14.4477C17.0335 14.477 17.1251 14.4887 17.2164 14.4823C17.3076 14.4758 17.3967 14.4513 17.4783 14.4101C17.56 14.3689 17.6326 14.3118 17.692 14.2423C18.2467 13.6126 18.5527 12.8023 18.5527 11.9632C18.5527 11.1241 18.2467 10.3138 17.692 9.6842C17.6322 9.61598 17.5595 9.56025 17.478 9.52019C17.3966 9.48014 17.308 9.45655 17.2175 9.45078C17.1269 9.44502 17.0361 9.45719 16.9502 9.48659C16.8644 9.516 16.7852 9.56206 16.7172 9.62214H16.7197ZM20.2443 7.36639C20.185 7.29547 20.112 7.2372 20.0297 7.19507C19.9474 7.15293 19.8574 7.12777 19.7652 7.1211C19.673 7.11443 19.5803 7.12637 19.4928 7.15623C19.4053 7.18608 19.3247 7.23322 19.2558 7.29487C19.1868 7.35651 19.131 7.43138 19.0916 7.51503C19.0522 7.59869 19.03 7.68941 19.0264 7.78181C19.0228 7.8742 19.0378 7.96639 19.0705 8.05287C19.1032 8.13936 19.153 8.21838 19.2168 8.28524C20.1216 9.29669 20.6219 10.6062 20.6219 11.9632C20.6219 13.3203 20.1216 14.6298 19.2168 15.6412C19.153 15.7081 19.1032 15.7871 19.0705 15.8736C19.0378 15.9601 19.0228 16.0523 19.0264 16.1447C19.03 16.2371 19.0522 16.3278 19.0916 16.4114C19.131 16.4951 19.1868 16.57 19.2558 16.6316C19.3247 16.6932 19.4053 16.7404 19.4928 16.7702C19.5803 16.8001 19.673 16.812 19.7652 16.8054C19.8574 16.7987 19.9474 16.7735 20.0297 16.7314C20.112 16.6893 20.185 16.631 20.2443 16.5601C21.3749 15.2959 22 13.6593 22 11.9632C22 10.2672 21.3749 8.63061 20.2443 7.36639Z"
                                  fill="#007C8F" />
                          </svg>
                          <svg x-bind:class="volume==0?'block':'hidden'" width="24" height="24" viewBox="0 0 24 24" fill="none"
                              xmlns="http://www.w3.org/2000/svg" class="block">
                              <path
                                  d="M21.7979 13.5452C21.9273 13.6746 22 13.8501 22 14.0331C22 14.2161 21.9273 14.3916 21.7979 14.521C21.6685 14.6504 21.493 14.7231 21.31 14.7231C21.127 14.7231 20.9515 14.6504 20.8221 14.521L19.241 12.9391L17.66 14.521C17.5306 14.6504 17.3551 14.7231 17.1721 14.7231C16.9891 14.7231 16.8136 14.6504 16.6842 14.521C16.5548 14.3916 16.4821 14.2161 16.4821 14.0331C16.4821 13.8501 16.5548 13.6746 16.6842 13.5452L18.2661 11.9642L16.6842 10.3832C16.5548 10.2538 16.4821 10.0782 16.4821 9.89524C16.4821 9.71223 16.5548 9.53672 16.6842 9.40732C16.8136 9.27791 16.9891 9.20521 17.1721 9.20521C17.3551 9.20521 17.5306 9.27791 17.66 9.40732L19.241 10.9892L20.8221 9.40732C20.9515 9.27791 21.127 9.20521 21.31 9.20521C21.493 9.20521 21.6685 9.27791 21.7979 9.40732C21.9273 9.53672 22 9.71223 22 9.89524C22 10.0782 21.9273 10.2538 21.7979 10.3832L20.216 11.9642L21.7979 13.5452ZM5.79303 7.82631H3.37928C3.01348 7.82631 2.66265 7.97163 2.40398 8.2303C2.14532 8.48896 2 8.83979 2 9.2056V14.7227C2 15.0885 2.14532 15.4394 2.40398 15.698C2.66265 15.9567 3.01348 16.102 3.37928 16.102H5.79303C5.88448 16.102 5.97219 16.0657 6.03686 16.001C6.10152 15.9364 6.13785 15.8486 6.13785 15.7572V8.17113C6.13785 8.07968 6.10152 7.99198 6.03686 7.92731C5.97219 7.86264 5.88448 7.82631 5.79303 7.82631ZM14.1679 3.1583C14.0471 3.0584 13.896 3.0026 13.7393 3.00009C13.5826 2.99758 13.4297 3.04852 13.3058 3.14451L7.65334 7.54098C7.61141 7.57283 7.57733 7.61387 7.55372 7.66094C7.53011 7.70801 7.5176 7.75986 7.51714 7.81252V16.1158C7.51729 16.1683 7.52941 16.22 7.55256 16.267C7.57572 16.3141 7.6093 16.3552 7.65075 16.3874L13.3032 20.7838C13.4127 20.8689 13.5453 20.9191 13.6837 20.9277C13.8221 20.9363 13.9599 20.903 14.0791 20.8321C14.184 20.7669 14.2701 20.6755 14.3292 20.5671C14.3883 20.4586 14.4182 20.3366 14.4161 20.2131V3.71001C14.4174 3.60527 14.3956 3.50153 14.3523 3.40617C14.3089 3.31082 14.2451 3.22618 14.1653 3.1583H14.1679Z"
                                  fill="#007C8F"></path>
                          </svg>
                      </div>
                  </div>
                  <audio class="hidden" x-ref="audioElement" @timeupdate="updateProgress()" @loadedmetadata="loadMetadatafn()" @volumeChange="updateVolume()" @ended="isPlaying = false" src="${link}" controls></audio>
              </div>`;
}

var myHelpers = {
  formatRelativeTime: function (timestamp) {
    if (!timestamp) return "";
    const now = new Date();
    const time = new Date(timestamp * 1000);
    const diffInSeconds = Math.floor((now - time) / 1000);
    if (diffInSeconds < 60) return diffInSeconds + " sec ago";
    const minutes = Math.floor(diffInSeconds / 60);
    if (minutes < 60) return minutes + " min ago";
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return hours + " hr ago";
    const days = Math.floor(hours / 24);
    return days + " day" + (days > 1 ? "s" : "") + " ago";
  },
  fullName: function (author) {
    return author
      ? author.display_name || author.first_name + " " + author.last_name
      : "Unknown Author";
  },
  getFileInfo: function (fileInput) {
    if (!fileInput) return null;
    if (typeof fileInput === "object") return fileInput;
    let trimmed = fileInput.trim();
    if (/^\{\s*\}$/.test(trimmed)) return null;
    let parsed = null;
    try {
      parsed = JSON.parse(trimmed);
    } catch (e) {
      if (
        (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
        (trimmed.startsWith("'") && trimmed.endsWith("'"))
      ) {
        trimmed = trimmed.substring(1, trimmed.length - 1).trim();
        try {
          parsed = JSON.parse(trimmed);
        } catch (e2) {
          parsed = trimmed;
        }
      } else {
        parsed = trimmed;
      }
    }
    if (typeof parsed === "string") {
      if (parsed.trim() === "{}") return null;
      return { link: parsed, name: parsed };
    }
    if (parsed && typeof parsed === "object") {
      if (Object.keys(parsed).length === 0) return null;
      if (!parsed.link && parsed.s3_id)
        parsed.link =
          "https://t.writerscentre.com.au/s/dl?token=" + parsed.s3_id;
      if (parsed.link || parsed.name) return parsed;
    }
    return { link: trimmed, name: trimmed };
  },
  getFileCategory: function (fileObj) {
    let mime = fileObj.type || "";
    if (mime) {
      if (mime.startsWith("image/")) return "image";
      if (mime.startsWith("audio/")) return "audio";
      if (mime.startsWith("video/")) return "video";
    }
    const lowerName = fileObj.name.toLowerCase();
    if (/\.(jpg|jpeg|png|gif|bmp|webp)$/.test(lowerName)) return "image";
    if (/\.(mp3|wav|ogg)$/.test(lowerName)) return "audio";
    if (/\.(mp4|webm|ogg)$/.test(lowerName)) return "video";
    return "other";
  },
  renderFile: function (fileString) {
    const fileObj = myHelpers.getFileInfo(fileString);
    if (!fileObj) return "";
    const category = myHelpers.getFileCategory(fileObj);
    const link = fileObj.link;
    const name = fileObj.name;
    if (category === "image")
      return (
        "<div class='mt-2 mb-4 w-full'><img src='" +
        link +
        "' alt='" +
        name +
        "' class='w-full rounded'></div>"
      );
    else if (category === "audio") return renderAudioPlayer(link);
    else if (category === "video")
      return (
        "<div class='mt-2 mb-4 w-full'><video controls src= '" +
        link +
        "' class='w-full rounded'>Your browser does not support the video element.</video></div>"
      );
    else
      return (
        "<div class='mt-2 mb-4 w-full'><a href='" +
        link +
        "' target='_blank' class='text-blue-500 hover:underline'>" +
        name +
        "</a></div>"
      );
  },
  voteCount: function (votes) {
    return Array.isArray(votes) ? votes.length : 0;
  },
  hasUserVoted: function (votes, recordId) {
    var currentUserId = visitorContactID;
    if (!Array.isArray(votes) || votes.length === 0) return false;
    if (votes[0].hasOwnProperty("post_upvote_id"))
      return votes.some(
        (vote) =>
          Number(vote.member_post_upvote_id) === currentUserId &&
          Number(vote.post_upvote_id) === Number(recordId)
      );
    if (votes[0].hasOwnProperty("forum_comment_upvote_id"))
      return votes.some(
        (vote) =>
          Number(vote.member_comment_upvote_id) === currentUserId &&
          Number(vote.forum_comment_upvote_id) === Number(recordId)
      );
    return false;
  },
  getUserVoteId: function (votes, recordId) {
    var currentUserId = visitorContactID;
    if (!Array.isArray(votes) || votes.length === 0) return "";
    if (votes[0].hasOwnProperty("post_upvote_id")) {
      var vote = votes.find(
        (vote) =>
          Number(vote.member_post_upvote_id) === currentUserId &&
          Number(vote.post_upvote_id) === Number(recordId)
      );
      return vote ? vote.id : "";
    }
    if (votes[0].hasOwnProperty("forum_comment_upvote_id")) {
      var vote = votes.find(
        (vote) =>
          Number(vote.member_comment_upvote_id) === currentUserId &&
          Number(vote.forum_comment_upvote_id) === Number(recordId)
      );
      return vote ? vote.id : "";
    }
    return "";
  },
  commentCount: function (comments) {
    return Array.isArray(comments) ? comments.length : 0;
  },
};

$.views.helpers(myHelpers);

const ForumAPI = (function () {
  function apiCall(query, variables = {}) {
    return fetch(graphqlApiEndpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json", "Api-Key": apiAccessKey },
      body: JSON.stringify({ query, variables }),
    })
      .then((response) => {
        if (!response.ok) throw new Error("Network response was not ok");
        return response.json();
      })
      .catch((error) => {
        console.error("API call error:", error);
        throw error;
      });
  }

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
    return apiCall(updateContactMutation, { id, payload }).then((data) => {
      if (data.data && data.data.updateContact) {
        return data.data.updateContact;
      } else {
        throw new Error("Error updating contact");
      }
    });
  }

  const myPostsQuery = `
  query getForumPosts{
    getForumPosts(
      orderBy: [{ path: ["created_at"], type: desc }]
      query: [
        { where: { post_status: "Published - Not flagged" } },
        { andWhere: { class_id: ${classId} } },
        { andWhere: { author_id: ${visitorContactID} } }
      ]
    ) {
      created_at
      post_copy
      author_id
      file
      id
      Member_Post_Upvotes_Data { id member_post_upvote_id post_upvote_id }
      Author { profile_image display_name last_name first_name is_instructor is_admin }
      Class { id }
      ForumComments (orderBy: [{ path: ["created_at"], type: asc }]) {
        file author_id created_at comment reply_to_comment_id id
        Member_Comment_Upvotes_Data { id forum_comment_upvote_id member_comment_upvote_id }
        Author { display_name last_name first_name profile_image is_instructor is_admin }
        ForumComments (orderBy: [{ path: ["created_at"], type: asc }]) {
          file author_id created_at comment reply_to_comment_id id
          Member_Comment_Upvotes_Data { id forum_comment_upvote_id member_comment_upvote_id }
          Author { display_name last_name first_name profile_image is_instructor is_admin }
        }
      }
    }
  }
`;

  function fetchMyPosts() {
    return apiCall(myPostsQuery).then((data) => {
      let posts = data.data.getForumPosts || [];
      posts.forEach((post) => {
        if (post.ForumComments && Array.isArray(post.ForumComments)) {
          const flatComments = flattenComments(post.ForumComments);
          post.children = buildCommentTree(flatComments);
          assignCommentLevels(post.children, 1);
          attachForumPostIdToComments(post.children, post.id);
        }
      });
      return posts;
    });
  }

  const forumQuery = `
    query getForumPosts{
        getForumPosts(
            orderBy: [{ path: ["created_at"], type: desc }]
            query: [
                    { where: { post_status: "Published - Not flagged" } }
                    { andWhere: { class_id: ${classId} } }
                ]
            ) {
            created_at
            post_copy
            author_id
            file
            id
            Member_Post_Upvotes_Data { id member_post_upvote_id post_upvote_id }
            Author { profile_image display_name last_name first_name is_instructor is_admin }
            Class { id }
            ForumComments {
            file author_id created_at comment reply_to_comment_id id
            Member_Comment_Upvotes_Data { id forum_comment_upvote_id member_comment_upvote_id }
            Author { display_name last_name first_name profile_image is_instructor is_admin }
            ForumComments {
                file author_id created_at comment reply_to_comment_id id
                Member_Comment_Upvotes_Data { id forum_comment_upvote_id member_comment_upvote_id }
                Author { display_name last_name first_name profile_image is_instructor is_admin }
            }
            }
        }
    }
`;

  function flattenComments(comments) {
    let flat = [];
    comments.forEach((comment) => {
      flat.push(comment);
      if (
        comment.ForumComments &&
        Array.isArray(comment.ForumComments) &&
        comment.ForumComments.length
      ) {
        comment.ForumComments.forEach((child) => {
          if (!child.reply_to_comment_id)
            child.reply_to_comment_id = comment.id;
        });
        flat = flat.concat(flattenComments(comment.ForumComments));
      }
    });
    return flat;
  }

  function buildCommentTree(comments) {
    const commentMap = {};
    const tree = [];
    comments.forEach((comment) => {
      comment.children = [];
      commentMap[comment.id] = comment;
    });
    comments.forEach((comment) => {
      if (comment.reply_to_comment_id) {
        const parent = commentMap[comment.reply_to_comment_id];
        if (parent) parent.children.push(comment);
        else tree.push(comment);
      } else tree.push(comment);
    });
    return tree;
  }

  function assignCommentLevels(comments, level) {
    comments.forEach((comment) => {
      comment.level = level;
      if (comment.children && comment.children.length)
        assignCommentLevels(comment.children, level + 1);
    });
  }

  function attachForumPostIdToComments(comments, forumPostId) {
    comments.forEach((comment) => {
      comment.forum_post_id = forumPostId;
      if (comment.children && comment.children.length)
        attachForumPostIdToComments(comment.children, forumPostId);
    });
  }

  function fetchPosts() {
    return apiCall(forumQuery).then((data) => {
      let posts = data.data.getForumPosts || [];
      posts.forEach((post) => {
        if (post.ForumComments && Array.isArray(post.ForumComments)) {
          const flatComments = flattenComments(post.ForumComments);
          post.children = buildCommentTree(flatComments);
          assignCommentLevels(post.children, 1);
          attachForumPostIdToComments(post.children, post.id);
        }
      });
      return posts;
    });
  }

  const createPostMutation = `
mutation createForumPost($payload: ForumPostCreateInput!) {
  createForumPost(payload: $payload) { 
    post_copy 
    author_id 
    file 
    id 
    Mentions { 
        id
    } 
    post_status
    class_id
  }
}
`;

  function createPost(payload) {
    return apiCall(createPostMutation, { payload }).then((data) => {
      if (data.data && data.data.createForumPost)
        return data.data.createForumPost;
      else throw new Error("Error creating post");
    });
  }

  const deletePostMutation = `
mutation deleteForumPost($postId: AwcForumPostID!) {
  deleteForumPost(query: [{ where: { id: $postId } }]) { id }
}
`;

  function deletePost(postId) {
    return apiCall(deletePostMutation, { postId }).then((data) => {
      if (data.data && data.data.deleteForumPost)
        return data.data.deleteForumPost;
      else throw new Error("Error deleting post");
    });
  }

  const deleteCommentMutation = `
mutation deleteForumComment($id: AwcForumCommentID) {
  deleteForumComment(query: [{ where: { id: $id } }]) { id }
}
`;

  function deleteComment(commentId) {
    return apiCall(deleteCommentMutation, { id: commentId }).then((data) => {
      if (data.data && data.data.deleteForumComment)
        return data.data.deleteForumComment;
      else throw new Error("Error deleting comment");
    });
  }

  const createCommentMutation = `
mutation createForumComment($payload: ForumCommentCreateInput = null) {
  createForumComment(payload: $payload) { 
  author_id 
  comment 
  file 
  forum_post_id 
  reply_to_comment_id 
  id 
  Mentions { 
  id 
  } 
  }
}
`;

  function createComment(payload) {
    return apiCall(createCommentMutation, { payload }).then((data) => {
      if (data.data && data.data.createForumComment)
        return data.data.createForumComment;
      else throw new Error("Error creating comment");
    });
  }

  const singlePostQuery = `
        query getSinglePost($id: AwcForumPostID!) {
        getForumPosts(query: [{ where: { id: $id } }]) {
            created_at post_copy post_image author_id file id
            Member_Post_Upvotes_Data { id member_post_upvote_id post_upvote_id }
            Author { profile_image display_name last_name first_name is_instructor is_admin }
            Class { id }
            ForumComments {
            file author_id created_at comment reply_to_comment_id id
            Member_Comment_Upvotes_Data { id forum_comment_upvote_id member_comment_upvote_id }
            Author { display_name last_name first_name profile_image is_instructor is_admin }
            ForumComments {
                file author_id created_at comment reply_to_comment_id id
                Member_Comment_Upvotes_Data { id forum_comment_upvote_id member_comment_upvote_id }
                Author { display_name last_name first_name profile_image is_instructor is_admin }
                }
            }
        }
    }
`;

  function fetchPostById(postId) {
    return apiCall(singlePostQuery, { id: postId }).then((data) => {
      let posts = data.data.getForumPosts || [];
      if (posts.length > 0) {
        let post = posts[0];
        if (post.ForumComments && Array.isArray(post.ForumComments)) {
          const flatComments = flattenComments(post.ForumComments);
          post.children = buildCommentTree(flatComments);
          assignCommentLevels(post.children, 1);
          attachForumPostIdToComments(post.children, post.id);
        }
        return post;
      } else throw new Error("Post not found");
    });
  }

  const createPostVoteMutation = `
mutation createMemberPostUpvotesPostUpvotes($payload: MemberPostUpvotesPostUpvotesCreateInput = null) {
  createMemberPostUpvotesPostUpvotes(payload: $payload) { member_post_upvote_id post_upvote_id id }
}
`;

  function createPostVote(payload) {
    return apiCall(createPostVoteMutation, { payload }).then((data) => {
      if (data.data && data.data.createMemberPostUpvotesPostUpvotes)
        return data.data.createMemberPostUpvotesPostUpvotes;
      else throw new Error("Error creating post vote");
    });
  }

  const deletePostVoteMutation = `
mutation deleteMemberPostUpvotesPostUpvotes($id: AwcMemberPostUpvotesPostUpvotesID) {
  deleteMemberPostUpvotesPostUpvotes(query: [{ where: { id: $id } }]) { id }
}
`;

  function deletePostVote(voteId) {
    return apiCall(deletePostVoteMutation, { id: voteId }).then((data) => {
      if (data.data && data.data.deleteMemberPostUpvotesPostUpvotes)
        return data.data.deleteMemberPostUpvotesPostUpvotes;
      else throw new Error("Error deleting post vote");
    });
  }

  const createCommentVoteMutation = `
mutation createMemberCommentUpvotesForumCommentUpvotes($payload: MemberCommentUpvotesForumCommentUpvotesCreateInput = null) {
  createMemberCommentUpvotesForumCommentUpvotes(payload: $payload) { forum_comment_upvote_id member_comment_upvote_id id }
}
`;

  function createCommentVote(payload) {
    return apiCall(createCommentVoteMutation, { payload }).then((data) => {
      if (data.data && data.data.createMemberCommentUpvotesForumCommentUpvotes)
        return data.data.createMemberCommentUpvotesForumCommentUpvotes;
      else throw new Error("Error creating comment vote");
    });
  }

  const deleteCommentVoteMutation = `
mutation deleteMemberCommentUpvotesForumCommentUpvotes($id: AwcMemberCommentUpvotesForumCommentUpvotesID) {
  deleteMemberCommentUpvotesForumCommentUpvotes(query: [{ where: { id: $id } }]) { id }
}
`;

  function deleteCommentVote(voteId) {
    return apiCall(deleteCommentVoteMutation, { id: voteId }).then((data) => {
      if (data.data && data.data.deleteMemberCommentUpvotesForumCommentUpvotes)
        return data.data.deleteMemberCommentUpvotesForumCommentUpvotes;
      else throw new Error("Error deleting comment vote");
    });
  }

  return {
    fetchPosts,
    createPost,
    deletePost,
    deleteComment,
    createComment,
    fetchPostById,
    createPostVote,
    deletePostVote,
    createCommentVote,
    deleteCommentVote,
    fetchMyPosts,
    updateContact,
  };
})();

const FileUploader = (function () {
  function decodeAwsParam(awsParam) {
    if (!awsParam) awsParam = window.awsParam;
    const serializedString = atob(awsParam);
    const hashMatch = serializedString.match(/s:\d+:"([a-f0-9]+)"/);
    const expiryMatch = serializedString.match(/i:(\d+)/);
    return {
      hash: hashMatch ? hashMatch[1] : null,
      expiry: expiryMatch ? parseInt(expiryMatch[1], 10) : null,
    };
  }
  function encodeAwsParam(hash, currentEpoch) {
    if (typeof currentEpoch !== "number")
      currentEpoch = Math.round(Date.now() / 1000);
    const expiry = new Date(currentEpoch * 1000);
    expiry.setTime(expiry.getTime() + 12 * 60 * 60 * 1000);
    return btoa(
      `a:2:{s:4:"hash";s:${hash.length}:"${hash}";s:6:"expiry";i:${Math.round(
        expiry.getTime() / 1000
      )};}`
    );
  }
  function createS3FileId(key, filename) {
    return key.replace("${filename}", filename);
  }
  function getS3UploadParams(awsParam, url) {
    if (typeof awsParam !== "string") awsParam = window.awsParam;
    if (typeof url !== "string") url = `//${window.location.host}/s/aws`;
    const formData = new FormData();
    formData.append("awsParam", JSON.stringify(awsParam));
    return fetch(url, { method: "POST", body: formData })
      .then((res) => res.text())
      .then((text) => {
        try {
          const data = JSON.parse(text);
          if (data.code === 0 && data.data) return data.data;
          throw new Error("Upload params error: " + text);
        } catch (e) {
          throw new Error("Invalid JSON response: " + text);
        }
      });
  }
  function uploadFiles(filesToUpload, s3Params, toSubmit) {
    const paramsInputs = s3Params.inputs;
    const method = s3Params.attributes.method;
    const action = s3Params.attributes.action;
    const uploadPromises = filesToUpload.map(
      ({ file, fieldName }) =>
        new Promise((resolve) => {
          let s3FormData = new FormData();
          for (const key in paramsInputs)
            s3FormData.append(key, paramsInputs[key]);
          s3FormData.append("Content-Type", file.type);
          s3FormData.append("file", file, file.name);
          let xhr = new XMLHttpRequest();
          xhr.open(method, action);
          xhr.onloadend = function () {
            if (xhr.status === 204) {
              let s3Id = createS3FileId(paramsInputs.key, file.name);
              const result = { name: file.name, type: file.type, s3_id: s3Id };
              if (toSubmit && fieldName)
                toSubmit[fieldName] = JSON.stringify(result);
              resolve(result);
            } else {
              console.error("File upload failed", xhr.statusText);
              resolve(null);
            }
          };
          xhr.send(s3FormData);
        })
    );
    return Promise.all(uploadPromises);
  }
  function processFileFields(
    toSubmit,
    filesToUpload,
    awsParamHash,
    awsParamUrl
  ) {
    let awsParam;
    if (!awsParamHash) awsParam = window.awsParam;
    else if (typeof awsParamHash === "string")
      awsParam = encodeAwsParam(awsParamHash);
    return getS3UploadParams(awsParam, awsParamUrl).then((s3Params) => {
      if (!s3Params) {
        const e = new Error("Failed to retrieve S3 upload parameters.");
        e.failures = filesToUpload;
        throw e;
      }
      return uploadFiles(filesToUpload, s3Params, toSubmit).then((result) => {
        let error;
        for (let i = 0; i < result.length; i++) {
          if (!result[i]) {
            if (!error) {
              error = new Error("One or more files failed to upload.");
              error.failures = [];
            }
            error.failures.push(filesToUpload[i]);
          }
        }
        if (error) throw error;
        return toSubmit;
      });
    });
  }
  return { processFileFields };
})();

function renderPosts(posts) {
  const template = $.templates("#forumTemplate");
  const htmlOutput = template.render(posts);
  $("#forumContainer").html(htmlOutput);
  $(".comment-editor").each(function () {
    MentionManager.initEditor(this);
    $(this).attr("contenteditable", true);
  });
  applyLinkPreviewsAndLinkify();
}

function loadPosts(filter = "all") {
  let promise;
  if (filter === "mine") {
    promise = ForumAPI.fetchMyPosts(visitorContactID);
  } else {
    promise = ForumAPI.fetchPosts();
  }
  promise
    .then((posts) => {
      if (posts.length === 0) {
        $("#forumContainer").html(
          "<div class='text-gray-600 p-4'>No posts found.</div>"
        );
      } else {
        renderPosts(posts);
      }
    })
    .catch((error) => {
      console.error("Error fetching posts:", error);
      $("#forumContainer").html(
        "<div class='text-red-500'>Failed to load posts.</div>"
      );
    });
}

$(document).ready(function () {
  MentionManager.initContacts();
  MentionManager.initEditor(document.getElementById("post-editor"));

  $("#postFile").on("change", function () {
    if (this.files && this.files.length > 0) {
      // Hide attach button and show replace/delete buttons
      $(".attachAFileForClassChat").addClass("hidden");
      $("#replaceFileContainer, #deleteFileContainer").removeClass("hidden");
      // Generate and show preview
      const file = this.files[0];
      const previewHtml = getFilePreviewHTML(file);
      $("#showContainerForAllFiles").html(previewHtml);
    } else {
      $("#showContainerForAllFiles").html("");
    }
  });

  // When the Replace button is clicked, trigger the file input click to allow a new selection.
  $("#replaceFileContainer").on("click", function () {
    $("#postFile").click();
  });

  // Update Delete button for post creation to clear preview
  $("#deleteFileContainer").on("click", function () {
    $("#postFile").val("");
    $("#replaceFileContainer, #deleteFileContainer").addClass("hidden");
    $(".attachAFileForClassChat").removeClass("hidden");
    $("#showContainerForAllFiles").html("");
  });

  // Helper to reset the file attachment UI for post creation
  function resetFileAttachmentUI() {
    $("#postFile").val("");
    $("#replaceFileContainer, #deleteFileContainer").addClass("hidden");
    $(".attachAFileForClassChat").removeClass("hidden");
    $("#showContainerForAllFiles").html("");
  }

  $("#all-posts-tab").on("click", function () {
    loadPosts("all");
    $(this).addClass("activePostTab");
    $("#my-posts-tab").removeClass("activePostTab");
  });

  $("#my-posts-tab").on("click", function () {
    loadPosts("mine");
    $(this).addClass("activePostTab");
    $("#all-posts-tab").removeClass("activePostTab");
  });

  $("#submit-post").on("click", function (event) {
    event.preventDefault();
    const postEditor = document.getElementById("post-editor");
    const postOuterWrapper = document.getElementById("postOuterWrapper");
    const htmlContent = postEditor.innerHTML.trim();
    const fileInput = $("#postFile")[0];
    const responseMessage = $("#responseMessage");
    const submitButton = $(this);
    submitButton.prop("disabled", true);
    postOuterWrapper.classList.add("state-disabled");
    $("#post-editor").attr("contenteditable", false);
    responseMessage.removeClass("hidden");
    responseMessage.text("Creating post...");
    const tempContainer = document.createElement("div");
    tempContainer.innerHTML = htmlContent;
    const mentionedIds = [];
    tempContainer.querySelectorAll(".mention").forEach((mention) => {
      const id = mention.dataset.contactId;
      if (id && !mentionedIds.includes(Number(id)))
        mentionedIds.push(Number(id));
    });
    let payload = {
      post_copy: htmlContent,
      author_id: visitorContactID,
      Mentions: mentionedIds.map((id) => ({
        id: id,
      })),
      post_status: "Published - Not flagged",
      class_id: classId,
    };
    let uploadedFileInfo = null;
    if (fileInput.files && fileInput.files[0]) {
      const file = fileInput.files[0];
      uploadedFileInfo = { name: file.name, type: file.type };
    }

    function submitNewPost(finalPayload) {
      ForumAPI.createPost(finalPayload)

        .then((created) => {
          const mentionIds = finalPayload.Mentions.map((m) => m.id);
          return Promise.all(
            mentionIds.map((id) =>
              ForumAPI.updateContact(id, { has__new__notification: true })
            )
          ).then(() => created);
        })
        .then((created) => ForumAPI.fetchPostById(created.id))
        .then((data) => {
          responseMessage.text("Post created successfully!");
          resetFileAttachmentUI();
          return ForumAPI.fetchPostById(data.id);
        })
        .then((post) => {
          if (uploadedFileInfo && post.file) {
            const link = post.file.replace(/^"|"$/g, "");
            post.file = JSON.stringify({
              link: link,
              name: uploadedFileInfo.name,
              type: uploadedFileInfo.type,
            });
          }
          const template = $.templates("#forumTemplate");
          const htmlOutput = template.render(post);
          $("#forumContainer").prepend(htmlOutput);
          postEditor.innerHTML = "";
          $(fileInput).val("");
        })
        .catch((error) => {
          console.error("Error creating post:", error);
          responseMessage.text("Error creating post.");
        })
        .finally(() => {
          submitButton.prop("disabled", false);
          postOuterWrapper.classList.remove("state-disabled");
          $("#post-editor").attr("contenteditable", true);
          setTimeout(() => responseMessage.addClass("hidden"), 500);
        });
    }
    if (fileInput.files && fileInput.files[0]) {
      const filesToUpload = [{ file: fileInput.files[0], fieldName: "file" }];
      FileUploader.processFileFields(
        payload,
        filesToUpload,
        awsParam,
        awsParamUrl
      )
        .then((updatedPayload) => submitNewPost(updatedPayload))
        .catch((error) => {
          console.error("File processing error:", error);
          responseMessage.text("Error processing file.");
          submitButton.prop("disabled", false);
          $("#post-editor").attr("contenteditable", true);
        });
    } else {
      submitNewPost(payload);
    }
  });
});

function handleDelete(button) {
  const postId = $(button).data("id");
  const postCard = $(button).closest(".postCard");
  const responseMessage = $("#responseMessage");
  responseMessage.removeClass("hidden");
  responseMessage.text("Deleting post...");
  postCard.css("opacity", "0.5");
  $(button).prop("disabled", true);

  ForumAPI.deletePost(postId)
    .then(() => {
      responseMessage.text("Post deleted successfully");
      postCard.slideUp(() => postCard.remove());
      setTimeout(() => responseMessage.addClass("hidden"), 500); // Hide message after 2 seconds
    })
    .catch((error) => {
      console.error("Error deleting post:", error);
      postCard.css("opacity", "1");
      $(button).prop("disabled", false);
      alert("Error deleting post.");
    });
}

function handleDeleteComment(button) {
  const commentId = $(button).data("id");
  const commentContainer = $(button).closest(".commentCard");
  commentContainer.css("opacity", "0.5");
  const responseMessage = $("#responseMessage");
  responseMessage.removeClass("hidden");
  responseMessage.text("Deleting comment...");
  $(button).prop("disabled", true);

  ForumAPI.deleteComment(commentId)
    .then(() => {
      responseMessage.text("Comment deleted successfully");
      commentContainer.slideUp(() => commentContainer.remove());
      setTimeout(() => responseMessage.addClass("hidden"), 2000); // Hide message after 2 seconds
    })
    .catch((error) => {
      console.error("Error deleting comment:", error);
      $(button).prop("disabled", false);
      alert("Error deleting comment.");
    });
}

$(document).on("submit", ".commentForm", function (event) {
  event.preventDefault();
  const form = $(this);
  const editor = form.find(".comment-editor")[0];
  const htmlContent = editor.innerHTML.trim();
  const fileInput = form.find("input[name='commentFile']")[0];
  const parentId = form.data("parent-id");
  const parentType = form.data("parent-type");
  const forumPostId = form.data("forum-post-id");
  const submitButton = form.find("button[type='submit']");

  form.addClass("state-disabled");
  submitButton.prop("disabled", true);
  editor.setAttribute("contenteditable", false);
  const responseMessage = $("#responseMessage");
  responseMessage.removeClass("hidden");
  responseMessage.text("Creating comment...");

  const tempContainer = document.createElement("div");
  tempContainer.innerHTML = htmlContent;
  const mentionedIds = [];
  tempContainer.querySelectorAll(".mention").forEach((mention) => {
    const id = mention.dataset.contactId;
    if (id && !mentionedIds.includes(Number(id))) mentionedIds.push(Number(id));
  });

  let payload = {
    comment: htmlContent,
    author_id: visitorContactID,
    Mentions: mentionedIds.map((id) => ({
      id: id,
      has__new__notification: true,
    })),
  };
  if (parentType === "post") {
    payload.forum_post_id = parentId;
  } else {
    payload.reply_to_comment_id = parentId;
  }

  let uploadedFileInfo = null;
  if (fileInput.files && fileInput.files[0]) {
    const file = fileInput.files[0];
    uploadedFileInfo = { name: file.name, type: file.type };
  }
  let createdCommentId = null;

  function submitComment(finalPayload) {
    ForumAPI.createComment(finalPayload)

      .then((created) => {
        const mentionIds = payload.Mentions.map((m) => m.id);
        return Promise.all(
          mentionIds.map((id) =>
            ForumAPI.updateContact(id, { has__new__notification: true })
          )
        ).then(() => created);
      })
      .then((created) => ForumAPI.fetchPostById(forumPostId))

      .then((data) => {
        responseMessage.text("Comment created successfully!");
        form.removeClass("state-disabled");
        createdCommentId = data.id;
        // Fetch only the updated post data for the specific forum post
        return ForumAPI.fetchPostById(forumPostId);
      })
      .then((post) => {
        // Update file info for the new comment if applicable
        if (uploadedFileInfo) {
          function findComment(comments) {
            for (let comment of comments) {
              if (comment.id == createdCommentId) return comment;
              if (comment.children && comment.children.length) {
                let found = findComment(comment.children);
                if (found) return found;
              }
            }
            return null;
          }
          const newComment = findComment(post.children);
          if (newComment) {
            let link = "";
            if (newComment.file) link = newComment.file.replace(/^"|"$/g, "");
            newComment.file = JSON.stringify({
              link: link,
              name: uploadedFileInfo.name,
              type: uploadedFileInfo.type,
            });
          }
        }
        // Re-render only the comment section for this post
        const template = $.templates("#forumTemplate");
        let newCommentsHtml = "";
        if (post.children && post.children.length) {
          newCommentsHtml = template.render(post.children);
        }
        $("#comments-" + forumPostId).html(newCommentsHtml);
        $("#comments-" + forumPostId + " .comment-editor").each(function () {
          MentionManager.initEditor(this);
          $(this).attr("contenteditable", true);
        });
      })
      .catch((error) => {
        console.error("Error creating comment:", error);
        alert("Error creating comment.");
      })
      .finally(() => {
        submitButton.prop("disabled", false);
        editor.setAttribute("contenteditable", true);
        editor.innerHTML = "";
        $(fileInput).val("");
        resetCommentFileUploadUI(form);
        setTimeout(() => responseMessage.addClass("hidden"), 500);
      });
  }

  if (fileInput.files && fileInput.files[0]) {
    const filesToUpload = [{ file: fileInput.files[0], fieldName: "file" }];
    FileUploader.processFileFields(
      payload,
      filesToUpload,
      awsParam,
      awsParamUrl
    )
      .then((updatedPayload) => submitComment(updatedPayload))
      .catch((error) => {
        console.error("File processing error:", error);
        alert("Error processing file.");
        submitButton.prop("disabled", false);
        editor.setAttribute("contenteditable", true);
      });
  } else {
    submitComment(payload);
  }
});

function handleVote(button) {
  var $btn = $(button);
  var recordId = $btn.data("id");
  var type = $btn.data("type");
  var voteId = $btn.data("vote-id");
  var currentUserId = visitorContactID; // defined globally

  // Show temporary UI feedback if desired
  $btn.addClass("state-disabled");

  if (type === "post") {
    if (voteId) {
      // Vote removal: delete the vote and update the count locally.
      ForumAPI.deletePostVote(voteId)
        .then(() => {
          let $voteCount = $btn.find(".vote-count");
          let count = parseInt($voteCount.text(), 10);
          $voteCount.text(count - 1);
          $btn.data("vote-id", "");
          $btn.removeClass("upVoted").removeClass("state-disabled");
        })
        .catch((error) => {
          console.error("Error removing post vote:", error);
          $btn.removeClass("state-disabled");
          alert("Error removing vote.");
        });
    } else {
      // Vote addition: create a vote and update the UI.
      var payload = {
        member_post_upvote_id: currentUserId,
        post_upvote_id: recordId,
      };
      ForumAPI.createPostVote(payload)
        .then((data) => {
          let $voteCount = $btn.find(".vote-count");
          let count = parseInt($voteCount.text(), 10);
          $voteCount.text(count + 1);
          $btn.data("vote-id", data.id);
          $btn.addClass("upVoted").removeClass("state-disabled");
        })
        .catch((error) => {
          console.error("Error creating post vote:", error);
          $btn.removeClass("state-disabled");
          alert("Error casting vote.");
        });
    }
  } else if (type === "comment") {
    // Similar logic for comment votes can be applied here.
    if (voteId) {
      // Removing comment vote
      ForumAPI.deleteCommentVote(voteId)
        .then(() => {
          let $voteCount = $btn.find(".vote-count");
          let count = parseInt($voteCount.text(), 10);
          $voteCount.text(count - 1);
          $btn.data("vote-id", "");
          $btn.removeClass("upVoted").removeClass("state-disabled");
        })
        .catch((error) => {
          console.error("Error removing comment vote:", error);
          $btn.removeClass("state-disabled");
          alert("Error removing vote.");
        });
    } else {
      // Creating comment vote
      var payload = {
        member_comment_upvote_id: currentUserId,
        forum_comment_upvote_id: recordId,
      };
      ForumAPI.createCommentVote(payload)
        .then((data) => {
          let $voteCount = $btn.find(".vote-count");
          let count = parseInt($voteCount.text(), 10);
          $voteCount.text(count + 1);
          $btn.data("vote-id", data.id);
          $btn.addClass("upVoted").removeClass("state-disabled");
        })
        .catch((error) => {
          console.error("Error creating comment vote:", error);
          $btn.removeClass("state-disabled");
          alert("Error casting vote.");
        });
    }
  }
}

function audioPlayer() {
  return {
    currentTime: 0,
    duration: 0,
    isPlaying: false,
    volume: 1,

    initPlayer() {
      if (typeof window.audioPlayerss === "undefined") {
        window.audioPlayerss = [];
      }
      window.audioPlayerss.push(this);
    },

    muteUnmuteSound() {
      if (this.volume == 0) {
        this.volume = 1;
        this.$refs.audioElement.volume = 1;
      } else {
        this.$refs.audioElement.volume = 0;
        this.volume = 0;
      }
    },

    updateVolume() {
      this.volume = this.$refs.audioElement.volume;
    },

    seek() {
      this.$refs.audioElement.currentTime = this.currentTime;
    },

    updateProgress() {
      this.currentTime = this.$refs.audioElement.currentTime.toFixed(2);
    },

    loadMetadatafn() {
      this.duration = this.$refs.audioElement.duration;
    },

    playPauseAudio() {
      // Toggle the current player state
      if (!this.isPlaying) {
        // First pause any other playing audio
        window.audioPlayerss.forEach((player) => {
          if (player !== this && player.isPlaying) {
            player.$refs.audioElement.pause();
            player.isPlaying = false;
          }
        });

        // Then play this audio
        this.$refs.audioElement
          .play()
          .then(() => {
            this.isPlaying = true;
          })
          .catch((error) => {});
      } else {
        this.$refs.audioElement.pause();
        this.isPlaying = false;
      }
    },

    formattedTime() {
      let hours = Math.floor(this.currentTime / 3600);
      let minutes = Math.floor((this.currentTime % 3600) / 60);
      let seconds = Math.floor(this.currentTime % 60);

      return (
        (hours ? hours + ":" : "") +
        (minutes < 10 ? "0" : "") +
        minutes +
        ":" +
        (seconds < 10 ? "0" : "") +
        seconds
      );
    },
    formattedRemainingTime() {
      let remaining = this.duration - this.currentTime;
      let minutes = Math.floor(remaining / 60);
      let seconds = Math.floor(remaining % 60);
      return (
        "-" +
        (minutes < 10 ? "0" : "") +
        minutes +
        ":" +
        (seconds < 10 ? "0" : "") +
        seconds
      );
    },
    downloadAudio() {
      let a = document.createElement("a");
      a.href = this.$refs.audioElement.src;
      a.download = "audio.mp3";
      a.click();
    },
  };
}

// When a file is selected in any comment form file input
$(document).on("change", ".formFileInputForComment", function () {
  if (this.files && this.files.length > 0) {
    var container = $(this).closest(".commentForm");
    // Hide the attach button and show replace/delete buttons
    container.find(".attachAFileForComment").hide();
    container
      .find(".replaceFileContainerComment, .deleteFileContainerComment")
      .show();
    // Generate preview for the selected file and update the preview container
    const file = this.files[0];
    const previewHtml = getFilePreviewHTML(file);
    container.find(".commentFilePreviewContainer").html(previewHtml);
  } else {
    $(this)
      .closest(".commentForm")
      .find(".commentFilePreviewContainer")
      .html("");
  }
});

$(document).on("click", ".replaceFileContainerComment", function () {
  $(this).closest(".commentForm").find(".formFileInputForComment").click();
});

// When the Delete button is clicked, clear the file input and reset the UI
$(document).on("click", ".deleteFileContainerComment", function () {
  var container = $(this).closest(".commentForm");
  container.find(".formFileInputForComment").val("");
  container
    .find(".replaceFileContainerComment, .deleteFileContainerComment")
    .hide();
  container.find(".attachAFileForComment").show();
  container.find(".commentFilePreviewContainer").html("");
});

// Helper to reset the file upload UI for a comment form
function resetCommentFileUploadUI(form) {
  var container = $(form).find(".commentForm");
  container.find(".formFileInputForComment").val("");
  container
    .find(".replaceFileContainerComment, .deleteFileContainerComment")
    .hide();
  container.find(".attachAFileForComment").show();
  container.find(".commentFilePreviewContainer").html("");
}

function getFilePreviewHTML(file) {
  const blobUrl = URL.createObjectURL(file);
  const type = file.type;
  if (type.startsWith("image/")) {
    return `<div class="file-preview mt-2"><img src="${blobUrl}" alt="${file.name}" class="max-w-full rounded"></div>`;
  } else if (type.startsWith("audio/")) {
    // Use your existing renderAudioPlayer function.
    return `<div class="file-preview mt-2">${renderAudioPlayer(blobUrl)}</div>`;
  } else if (type.startsWith("video/")) {
    return `<div class="file-preview mt-2"><video controls src="${blobUrl}" class="max-w-full rounded">Your browser does not support the video element.</video></div>`;
  } else {
    return `<div class="file-preview mt-2"><a href="${blobUrl}" target="_blank" class="text-blue-500 hover:underline">${file.name}</a></div>`;
  }
}

// Process all elements with the "content-container" class to generate previews and hyperlinks.
function formatPreview() {
  // Use a short timeout to let the content render before processing
  setTimeout(() => {
    const containers = document.querySelectorAll(".content-container");
    const urlRegex =
      /(https?:\/\/(?:www\.)?(youtube\.com|youtu\.be|loom\.com|vimeo\.com)\/\S+)/gi;

    containers.forEach((container) => {
      let content = container.innerHTML;
      const matches = content.match(urlRegex);
      if (matches) {
        matches.forEach((rawUrl) => {
          let url = rawUrl;
          if (url.includes("youtube") || url.includes("youtu.be")) {
            url = transformYoutubeUrl(url);
          } else if (url.includes("loom.com")) {
            url = transformLoomUrl(url);
          } else if (url.includes("vimeo.com")) {
            url = transformVimeoUrl(url);
          }
          // If a preview hasn’t already been added for this URL, create one.
          if (!container.querySelector(`[data-preview-url="${url}"]`)) {
            createPreviewContainer(url, container);
          }
        });
      }
    });
  }, 1000);
}

function createPreviewContainer(url, container) {
  if (container.querySelector(`[data-preview-url="${url}"]`)) return;
  const iframe = document.createElement("iframe");
  iframe.src = url;
  iframe.setAttribute("frameborder", "0");
  iframe.setAttribute("allowfullscreen", "");
  iframe.style.position = "absolute";
  iframe.style.top = "0";
  iframe.style.left = "0";
  iframe.style.width = "100%";
  iframe.style.height = "100%";

  const previewDiv = document.createElement("div");
  previewDiv.classList.add("preview-container");
  previewDiv.style.position = "relative";
  previewDiv.style.paddingBottom = "56.25%"; // 16:9 aspect ratio
  previewDiv.style.height = "0";
  previewDiv.style.marginTop = "16px";
  previewDiv.setAttribute("data-preview-url", url);

  // Optional: add a skeleton loader
  const skeleton = document.createElement("div");
  skeleton.classList.add("skeleton-loader");
  skeleton.style.position = "absolute";
  skeleton.style.top = "0";
  skeleton.style.left = "0";
  skeleton.style.width = "100%";
  skeleton.style.height = "100%";
  skeleton.style.backgroundColor = "#e0e0e0";
  skeleton.style.animation = "pulse 1.5s infinite";

  previewDiv.appendChild(skeleton);
  previewDiv.appendChild(iframe);

  // When the iframe loads, remove the skeleton
  iframe.addEventListener("load", () => {
    skeleton.remove();
  });

  container.appendChild(previewDiv);
}

function transformYoutubeUrl(url) {
  try {
    const urlObj = new URL(url);
    let videoId;
    if (urlObj.hostname === "youtu.be") {
      videoId = urlObj.pathname.slice(1);
    } else if (urlObj.hostname.includes("youtube.com")) {
      videoId = urlObj.searchParams.get("v");
    }
    if (videoId && videoId.length === 11) {
      return "https://www.youtube.com/embed/" + videoId;
    }
  } catch (e) {
    var regExp =
      /^.*(?:youtu\.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    var match = url.match(regExp);
    if (match && match[1].length === 11) {
      return "https://www.youtube.com/embed/" + match[1];
    }
  }
  return url;
}

function transformLoomUrl(url) {
  var regExp = /loom\.com\/share\/([a-f0-9]+)/;
  var match = url.match(regExp);
  if (match && match[1]) {
    return "https://www.loom.com/embed/" + match[1];
  }
  return url;
}

function transformVimeoUrl(url) {
  if (url.includes("player.vimeo.com/video/")) {
    return url;
  }
  var regExp = /vimeo\.com\/(\d+)\/(\w+)/;
  var match = url.match(regExp);
  if (match && match[1] && match[2]) {
    return "https://player.vimeo.com/video/" + match[1] + "?h=" + match[2];
  }
  return url;
}

// Replace plain text links with anchor tags that open in a new tab.
function linkifyElement(element) {
  const urlRegex = /(\b(https?:\/\/|www\.)\S+\b)/gi;
  const walker = document.createTreeWalker(
    element,
    NodeFilter.SHOW_TEXT,
    null,
    false
  );
  const textNodes = [];
  while (walker.nextNode()) {
    textNodes.push(walker.currentNode);
  }
  textNodes.forEach((textNode) => {
    const text = textNode.nodeValue;
    if (urlRegex.test(text)) {
      const fragment = document.createDocumentFragment();
      let lastIndex = 0;
      text.replace(urlRegex, (match, p1, offset) => {
        if (offset > lastIndex) {
          fragment.appendChild(
            document.createTextNode(text.substring(lastIndex, offset))
          );
        }
        const a = document.createElement("a");
        a.href = match.startsWith("http") ? match : "http://" + match;
        a.textContent = match;
        // Add custom class if desired
        a.classList.add("custom-link-class");
        // Add inline styles for color and underline
        a.style.color = "blue";
        a.style.textDecoration = "underline";
        a.target = "_blank";
        a.rel = "noopener noreferrer";
        fragment.appendChild(a);
        lastIndex = offset + match.length;
        return match;
      });
      if (lastIndex < text.length) {
        fragment.appendChild(
          document.createTextNode(text.substring(lastIndex))
        );
      }
      textNode.parentNode.replaceChild(fragment, textNode);
    }
  });
}

// A helper to run both preview formatting and linkification.
function applyLinkPreviewsAndLinkify() {
  formatPreview();
  const containers = document.querySelectorAll(".content-container");
  containers.forEach((el) => linkifyElement(el));
}
