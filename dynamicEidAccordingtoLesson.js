document.addEventListener("DOMContentLoaded", async function() {
  const regex = /course-details\/content\/(\w+)\??/;
  const match = window.location.href.match(regex);

  if (!match || !match[1]) return;

  const uniqueId = match[1];

  async function fetchEnrolment(path) {
    const query = {
      query: `
        query getEnrolment {
          getEnrolment(
            query: [
              { where: { student_id: ${sttudentIdForLesson} } }
              {
                andWhere: {
                  Class: [
                    {
                      where: {
                        ${path}: [
                          {
                            where: {
                              Lessons: [
                                { where: { unique_id: "${uniqueId}" } }
                              ]
                            }
                          }
                        ]
                      }
                    }
                  ]
                }
              }
            ]
          ) {
            ID: id
          }
        }
      `
    };

    const response = await fetch("https://awc.vitalstats.app/api/v1/graphql", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Api-Key": "mMzQezxyIwbtSc85rFPs3",
      },
      body: JSON.stringify(query)
    });

    const data = await response.json();
    return data?.data?.getEnrolment?.ID;
  }

  try {
    let enrolmentId = await fetchEnrolment("Active_Course");

    if (enrolmentId) {
      console.log("Data found from Active_Course");
    } else {
      enrolmentId = await fetchEnrolment("Course");
      if (enrolmentId) {
        console.log("Data found from Course");
      }
    }

    if (!enrolmentId) return;

    var currentUrl = window.location.href;
    var urlParams = new URLSearchParams(window.location.search);
    var currentEid = urlParams.get("eid");

    if (currentEid === String(enrolmentId)) {
      console.log("Correct eid already present. No reload needed.");
      return;
    }

    if (currentUrl.indexOf("?eid=") > -1 || currentUrl.indexOf("&eid=") > -1) {
      var newUrl = currentUrl.replace(/([?&])eid=\d+/, "$1eid=" + enrolmentId);
      window.location.href = newUrl;
    } else {
      if (currentUrl.indexOf("?") > -1) {
        window.location.href = currentUrl + "&eid=" + enrolmentId;
      } else {
        window.location.href = currentUrl + "?eid=" + enrolmentId;
      }
    }

  } catch (error) {
    console.error("Failed to fetch enrolment ID:", error);
  }
});
