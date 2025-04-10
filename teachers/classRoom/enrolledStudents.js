document.addEventListener("DOMContentLoaded", () => {
    const noStudentsCard = document.querySelector(".showIfNoStudents");
    const studentsCard = document.querySelector(".showIfStudents");
    const studentsWrapper = studentsCard.querySelectorAll(".studentsWrapper");
    const sortLatestButton = document.getElementById("sortLatestiD");
    const sortOldestButton = document.getElementById("sortOldestiD");
    const searchInput = document.getElementById("searchStudentsiD");
    // Function to parse date in dd-mm-yyyy format
    const parseDate = (dateStr) => {
        if (!dateStr) return new Date(0);
        // Extract date & time using regex to ignore the timezone
        const match = dateStr.match(/^(\d{1,2})-(\d{1,2})-(\d{4}) (\d{1,2}):(\d{2}) (AM|PM)/);
        if (!match) return new Date(0);
        let [_, day, month, year, hours, minutes, meridian] = match;
        day = parseInt(day, 10);
        month = parseInt(month, 10) - 1;
        year = parseInt(year, 10);
        hours = parseInt(hours, 10);
        minutes = parseInt(minutes, 10);
        // Convert 12-hour format to 24-hour format
        if (meridian === "PM" && hours !== 12) {
            hours += 12;
        } else if (meridian === "AM" && hours === 12) {
            hours = 0;
        }
        return new Date(year, month, day, hours, minutes);
    };
    // Function to check and display appropriate sections
    const checkStudents = () => {
        if (studentsWrapper.length === 0) {
            studentsCard.classList.add("hidden");
            noStudentsCard.classList.remove("hidden");
        } else {
            studentsCard.classList.remove("hidden");
            noStudentsCard.classList.add("hidden");
        }
    };
    // Sort function
    const sortStudents = (order) => {
        const sortedStudents = [...studentsWrapper].sort((a, b) => {
            const dateA = parseDate(a.dataset.dateAdded);
            const dateB = parseDate(b.dataset.dateAdded);
            return order === "latest" ? dateB - dateA : dateA - dateB;
        });
        // Clear and reappend sorted students
        const parent = studentsCard.querySelector(".grid");
        studentsCard.innerHTML = "";
        sortedStudents.forEach((el) => studentsCard.appendChild(el));
        // Update button styles
        if (order === "latest") {
            sortLatestButton.classList.replace("faintButton", "primaryButton");
            sortLatestButton.classList.replace("text-dark", "text-white");
            sortOldestButton.classList.replace("primaryButton", "faintButton");
            sortOldestButton.classList.replace("text-white", "text-dark");
        } else {
            sortOldestButton.classList.replace("faintButton", "primaryButton");
            sortOldestButton.classList.replace("text-dark", "text-white");
            sortLatestButton.classList.replace("primaryButton", "faintButton");
            sortLatestButton.classList.replace("text-white", "text-dark");
        }
    };
    // Search function
    const searchStudents = () => {
        const searchTerm = searchInput.value.toLowerCase();
        studentsWrapper.forEach((student) => {
            const name = student.dataset.studentName.toLowerCase();
            if (name.includes(searchTerm)) {
                student.style.display = "flex";
            } else {
                student.style.display = "none";
            }
        });
        // Check visibility of students after search
        const visibleStudents = [...studentsWrapper].filter(
            (student) => student.style.display !== "none"
        );
        if (visibleStudents.length === 0) {
            studentsCard.classList.add("hidden");
            noStudentsCard.classList.remove("hidden");
        } else {
            studentsCard.classList.remove("hidden");
            noStudentsCard.classList.add("hidden");
        }
    };
    // Event listeners
    sortLatestButton.addEventListener("click", () => sortStudents("latest"));
    sortOldestButton.addEventListener("click", () => sortStudents("oldest"));
    searchInput.addEventListener("input", searchStudents);
    // Initial check for records
    checkStudents();
});

document.addEventListener("DOMContentLoaded", function () {
    const svgEl = `<svg width="10" height="8" viewBox="0 0 10 8" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M9.97125 3.69834C9.95667 3.66542 9.60375 2.8825 8.81917 2.09792C7.77375 1.0525 6.45333 0.5 5 0.5C3.54667 0.5 2.22625 1.0525 1.18083 2.09792C0.396246 2.8825 0.0416627 3.66667 0.028746 3.69834C0.00979317 3.74097 0 3.7871 0 3.83375C0 3.88041 0.00979317 3.92654 0.028746 3.96917C0.0433294 4.00209 0.396246 4.78459 1.18083 5.56917C2.22625 6.61417 3.54667 7.16667 5 7.16667C6.45333 7.16667 7.77375 6.61417 8.81917 5.56917C9.60375 4.78459 9.95667 4.00209 9.97125 3.96917C9.99021 3.92654 10 3.88041 10 3.83375C10 3.7871 9.99021 3.74097 9.97125 3.69834ZM5 5.5C4.67036 5.5 4.34813 5.40226 4.07405 5.21912C3.79997 5.03598 3.58635 4.77569 3.4602 4.47114C3.33405 4.1666 3.30105 3.83149 3.36536 3.50819C3.42967 3.18488 3.5884 2.88791 3.82149 2.65482C4.05458 2.42174 4.35155 2.263 4.67485 2.19869C4.99815 2.13438 5.33326 2.16739 5.63781 2.29354C5.94235 2.41968 6.20265 2.6333 6.38578 2.90738C6.56892 3.18147 6.66667 3.5037 6.66667 3.83334C6.66667 4.27536 6.49107 4.69929 6.17851 5.01185C5.86595 5.32441 5.44203 5.5 5 5.5Z" fill="#007C8F"/>
  </svg>`;
    const allSubmissionContainer = document.querySelectorAll(".submissionButton");
    const allPostsContainer = document.querySelectorAll(".postButton");
    allSubmissionContainer.forEach(submission => {
        const newDiv = document.createElement("div");
        newDiv.innerHTML = svgEl;
        submission.prepend(newDiv.firstElementChild);
    });
    allPostsContainer.forEach(post => {
        const newDiv = document.createElement("div");
        newDiv.innerHTML = svgEl;
        post.prepend(newDiv.firstElementChild);
    });
});
