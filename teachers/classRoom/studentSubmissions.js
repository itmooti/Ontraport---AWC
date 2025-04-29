
    let allSubmissions = [];
    let currentTemplate = "files";
    let currentPage = 1;
    const itemsPerPage = 6;
    let searchQueryssss = "";
    let sortOrder = "latest";
    // Function to fetch data from GraphQL
    function getUnixTimestamp(isoDate) {
    return isoDate ? Math.floor(new Date(isoDate).getTime() / 1000) : null;
}

    // Function to find the due date for a given lesson ID
    function getDueDateUnix(lessonID) {
    const match = dueDates.find(d => d.lessonID === lessonID);
    return match ? getUnixTimestamp(match.dueDate) : null;
}
    // Function to check if a submission is late
    function isLateSubmission(submissionDateUnix, dueDateUnix) {
    if (!dueDateUnix) return false;
    return submissionDateUnix > dueDateUnix; 
}
    async function fetchSubmissions() {
        const query = `query calcSubmissions(
    $limit: IntScalar
    $offset: IntScalar
    ) {
        calcSubmissions(
            query: [
    {
        where: {
        Assessment: [
    {
        where: {Course: [{where: {active_class_id: ${activeClassIDSubmission} } }]
              }
            }
    ]
        }
      }
    ]
    limit: $limit
    offset: $offset
    orderBy: [
    {path: ["submission_date_time"], type: desc }
    ]
    ) {
        Contact_First_Name: field(
    arg: ["Student", "Student", "first_name"]
    )
    Contact_Display_Name: field(
    arg: ["Student", "Student", "display_name"]
    )
    Contact_Last_Name: field(
    arg: ["Student", "Student", "last_name"]
    )
    Assessment_Lesson_ID: field(
    arg: ["Assessment", "lesson_id"]
    )
    Contact_Profile_Image: field(
    arg: ["Student", "Student", "profile_image"]
    )
    Submission_Date_Time: field(
    arg: ["submission_date_time"]
    )
    Unique_ID: field(arg: ["unique_id"])
    File_Upload: field(arg: ["file_upload"])
    AssessmentType: field(arg: ["Assessment", "type"])
    Submission_Note: field(arg: ["submission_note"])
    Module_Module_Name: field(
    arg: ["Assessment", "Lesson", "Module", "module_name"]
    )
    Lesson_Lesson_Name: field(
    arg: ["Assessment", "Lesson", "lesson_name"]
    )
  }
}

    `;
    try {
            const response = await fetch("https://awc.vitalstats.app/api/v1/graphql", {
        method: "POST",
    headers: {
        "Content-Type": "application/json",
    "Api-Key": "mMzQezxyIwbtSc85rFPs3",
                },
    body: JSON.stringify({query})
            });

    if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }

    const text = await response.text();
    if (!text) {
                throw new Error("Empty response from server");
            }

    const result = JSON.parse(text);
    return result.data?.calcSubmissions || [];
        } catch (error) {
        console.error("Error fetching submissions:", error);
    return [];
        }
    }

    // Convert timestamp to Australian time
    function formatTime(timestamp) {
            if (!timestamp) return null;
    const date = new Date(timestamp * 1000);
    const day = date.getDate();
    const month = date.toLocaleString("en-AU", {month: "short" });
    const time = date.toLocaleString("en-AU", {
        hour: "2-digit",
    minute: "2-digit",
    hour12: true,
    timeZone: "Australia/Sydney"
      }).toLowerCase();
    return `${day} ${month} - ${time}`;
    }

    // Extract file upload link and name
    function extractFileData(fileUpload) {
        try {
            if (!fileUpload) return {link: "#", name: "No File" };
    const fileData = JSON.parse(fileUpload);
    return {
        link: fileData.link || "#",
    name: fileData.name || "Unknown File"
            };
        } catch (e) {
            return {link: "#", name: "Unknown File" };
        }
    }

    const templates = {
        comments: `
    {{if submissions.length}}
    <div class="flex w-full grid xl:grid-cols-3 lg:grid-cols-3 md:grid-cols-2 grid-cols-1 gap-x-[12px] md:gap-y-[24px] gap-y-3">
        {{for submissions}}
        <div class="flex px-2 py-3 bg-white rounded items-center justify-between group hover:bg-[#C7E6E6] transition-all cursor-pointer"
@click="
        document.querySelector('.iframeWrapper').classList.remove('hidden');
        document.querySelector('.iframeWrapper').classList.add('flex');
        document.querySelector('.iframeWrapper iframe').src = 'https://courses.writerscentre.com.au/students-submission/{{:Unique_ID}}?Due={{:Formatted_Due_Date}}';
        "
>
        <div class=" flex-col justify-center  items-start gap-2 flex cursor-pointer ">
            <div class="justify-between items-start gap-2 flex">
                <div class="!size-10">
                    <div class="w-10 h-10 flex items-center justify-center ">
                        <img class="w-10 h-10 rounded-full object-cover"
                            src="{{: (Contact_Profile_Image && Contact_Profile_Image !== 'https://i.ontraport.com/abc.jpg')
        ? Contact_Profile_Image
        : 'https://file.ontraport.com/media/b0456fe87439430680b173369cc54cea.php03bzcx?Expires=4895186056&Signature=fw-mkSjms67rj5eIsiDF9QfHb4EAe29jfz~yn3XT0--8jLdK4OGkxWBZR9YHSh26ZAp5EHj~6g5CUUncgjztHHKU9c9ymvZYfSbPO9JGht~ZJnr2Gwmp6vsvIpYvE1pEywTeoigeyClFm1dHrS7VakQk9uYac4Sw0suU4MpRGYQPFB6w3HUw-eO5TvaOLabtuSlgdyGRie6Ve0R7kzU76uXDvlhhWGMZ7alNCTdS7txSgUOT8oL9pJP832UsasK4~M~Na0ku1oY-8a7GcvvVv6j7yE0V0COB9OP0FbC8z7eSdZ8r7avFK~f9Wl0SEfS6MkPQR2YwWjr55bbJJhZnZA__&Key-Pair-Id=APKAJVAAMVW6XQYWSTNA'}}" />

                    </div></div>
                <div class="flex-col justify-center items-start gap-1 flex">
                    <div class="justify-start items-center gap-2 flex">
                        <div class="text-[#414042] text-sm font-semibold font-['Open Sans'] leading-[18px]">{{:Contact_Display_Name || (Contact_First_Name || Contact_Last_Name ? Contact_First_Name + ' ' + Contact_Last_Name : 'Anonymous')}}</div>
                        {{if formattedTime }} <div class="w-1 h-1 bg-[#BBBCBB] rounded-full"></div>{{/if}}
                        <div class="justify-start items-center gap-1.5 flex">
                            <div class="text-[#586A80] text-xs font-normal font-['Open Sans'] leading-none">{{:formattedTime}}</div>
                        </div>
                    </div>
                    <div class="justify-start items-center gap-1.5 flex">
                        <svg width="13" height="14" viewBox="0 0 13 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M11.9486 1.35902H10.4101V0.846195C10.4101 0.710186 10.3561 0.579748 10.2599 0.483576C10.1637 0.387403 10.0333 0.333374 9.89727 0.333374C9.76126 0.333374 9.63083 0.387403 9.53465 0.483576C9.43848 0.579748 9.38445 0.710186 9.38445 0.846195V1.35902H4.25625V0.846195C4.25625 0.710186 4.20222 0.579748 4.10605 0.483576C4.00987 0.387403 3.87944 0.333374 3.74343 0.333374C3.60742 0.333374 3.47698 0.387403 3.38081 0.483576C3.28464 0.579748 3.23061 0.710186 3.23061 0.846195V1.35902H1.69214C1.42013 1.35902 1.15925 1.46707 0.966907 1.65942C0.774562 1.85176 0.666504 2.11264 0.666504 2.38466V12.6411C0.666504 12.9131 0.774562 13.174 0.966907 13.3663C1.15925 13.5587 1.42013 13.6667 1.69214 13.6667H11.9486C12.2206 13.6667 12.4814 13.5587 12.6738 13.3663C12.8661 13.174 12.9742 12.9131 12.9742 12.6411V2.38466C12.9742 2.11264 12.8661 1.85176 12.6738 1.65942C12.4814 1.46707 12.2206 1.35902 11.9486 1.35902ZM6.82035 10.077C6.6175 10.077 6.4192 10.0168 6.25054 9.90411C6.08187 9.79141 5.95041 9.63123 5.87278 9.44382C5.79515 9.25641 5.77484 9.05019 5.81442 8.85123C5.85399 8.65228 5.95167 8.46952 6.09511 8.32609C6.23855 8.18265 6.4213 8.08496 6.62026 8.04539C6.81921 8.00582 7.02543 8.02613 7.21285 8.10375C7.40026 8.18138 7.56044 8.31284 7.67314 8.48151C7.78584 8.65017 7.84599 8.84847 7.84599 9.05132C7.84599 9.32334 7.73793 9.58422 7.54559 9.77656C7.35324 9.96891 7.09237 10.077 6.82035 10.077ZM11.9486 4.43594H1.69214V2.38466H3.23061V2.89748C3.23061 3.03349 3.28464 3.16392 3.38081 3.2601C3.47698 3.35627 3.60742 3.4103 3.74343 3.4103C3.87944 3.4103 4.00987 3.35627 4.10605 3.2601C4.20222 3.16392 4.25625 3.03349 4.25625 2.89748V2.38466H9.38445V2.89748C9.38445 3.03349 9.43848 3.16392 9.53465 3.2601C9.63083 3.35627 9.76126 3.4103 9.89727 3.4103C10.0333 3.4103 10.1637 3.35627 10.2599 3.2601C10.3561 3.16392 10.4101 3.03349 10.4101 2.89748V2.38466H11.9486V4.43594Z" fill="#007C8F" />
                        </svg>
                        <div class="text-[#586A80] text-xs font-normal font-['Open Sans'] leading-none">Due by : {{:Formatted_Due_Date}} <span class="text-red-500">{{:Late_Submission}}</span></div>
                    </div>
                    <div class="justify-start items-center gap-1.5 flex">
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M13.5557 1.33337H2.44461C2.14992 1.33337 1.86731 1.45044 1.65893 1.65881C1.45056 1.86718 1.3335 2.1498 1.3335 2.44449V13.5556C1.3335 13.8503 1.45056 14.1329 1.65893 14.3413C1.86731 14.5496 2.14992 14.6667 2.44461 14.6667H13.5557C13.8504 14.6667 14.133 14.5496 14.3414 14.3413C14.5498 14.1329 14.6668 13.8503 14.6668 13.5556V2.44449C14.6668 2.1498 14.5498 1.86718 14.3414 1.65881C14.133 1.45044 13.8504 1.33337 13.5557 1.33337ZM7.28211 9.50421L5.05989 11.7264C5.00829 11.7781 4.94702 11.8191 4.87957 11.847C4.81213 11.875 4.73984 11.8894 4.66683 11.8894C4.59382 11.8894 4.52153 11.875 4.45408 11.847C4.38664 11.8191 4.32537 11.7781 4.27377 11.7264L3.16266 10.6153C3.05842 10.5111 2.99985 10.3697 2.99985 10.2223C2.99985 10.0748 3.05842 9.93345 3.16266 9.82921C3.26691 9.72496 3.40829 9.6664 3.55572 9.6664C3.70314 9.6664 3.84453 9.72496 3.94877 9.82921L4.66683 10.548L6.496 8.7181C6.60024 8.61385 6.74163 8.55529 6.88905 8.55529C7.03648 8.55529 7.17786 8.61385 7.28211 8.7181C7.38635 8.82234 7.44492 8.96373 7.44492 9.11115C7.44492 9.25858 7.38635 9.39996 7.28211 9.50421ZM7.28211 5.05976L5.05989 7.28199C5.00829 7.33364 4.94702 7.37462 4.87957 7.40257C4.81213 7.43053 4.73984 7.44492 4.66683 7.44492C4.59382 7.44492 4.52153 7.43053 4.45408 7.40257C4.38664 7.37462 4.32537 7.33364 4.27377 7.28199L3.16266 6.17087C3.11105 6.11926 3.0701 6.05798 3.04217 5.99054C3.01423 5.9231 2.99985 5.85082 2.99985 5.77782C2.99985 5.63039 3.05842 5.48901 3.16266 5.38476C3.26691 5.28052 3.40829 5.22195 3.55572 5.22195C3.70314 5.22195 3.84453 5.28052 3.94877 5.38476L4.66683 6.10351L6.496 4.27365C6.60024 4.16941 6.74163 4.11084 6.88905 4.11084C7.03648 4.11084 7.17786 4.16941 7.28211 4.27365C7.38635 4.3779 7.44492 4.51928 7.44492 4.66671C7.44492 4.81413 7.38635 4.95552 7.28211 5.05976ZM12.4446 10.7778H9.11127C8.96393 10.7778 8.82262 10.7193 8.71844 10.6151C8.61425 10.5109 8.55572 10.3696 8.55572 10.2223C8.55572 10.0749 8.61425 9.93361 8.71844 9.82943C8.82262 9.72524 8.96393 9.66671 9.11127 9.66671H12.4446C12.592 9.66671 12.7333 9.72524 12.8374 9.82943C12.9416 9.93361 13.0002 10.0749 13.0002 10.2223C13.0002 10.3696 12.9416 10.5109 12.8374 10.6151C12.7333 10.7193 12.592 10.7778 12.4446 10.7778ZM12.4446 6.33337H9.11127C8.96393 6.33337 8.82262 6.27484 8.71844 6.17066C8.61425 6.06647 8.55572 5.92516 8.55572 5.77782C8.55572 5.63048 8.61425 5.48917 8.71844 5.38498C8.82262 5.28079 8.96393 5.22226 9.11127 5.22226H12.4446C12.592 5.22226 12.7333 5.28079 12.8374 5.38498C12.9416 5.48917 13.0002 5.63048 13.0002 5.77782C13.0002 5.92516 12.9416 6.06647 12.8374 6.17066C12.7333 6.27484 12.592 6.33337 12.4446 6.33337Z" fill="#007C8F" />
                        </svg>
                        <div class="text-dark text-xs font-normal font-['Open Sans'] leading-none line-clamp-2">{{:Module_Module_Name}}, {{:Lesson_Lesson_Name}}</div>
                    </div>

                    <div class="justify-start items-center gap-1.5 flex">
                        <div class="text-dark text-xs font-normal font-['Open Sans'] leading-none line-clamp-2">{{:Submission_Note}}</div>
                    </div>

                </div>
            </div>
        </div>
    </div>
    {{/for}}
</div>
{{else}}
<div class="flex w-full items-center justify-center flex-col gap-[24px] max-[1100px]:px-[16px] max-[1100px]:pt-[24px] showIfNoSubmissions ">
    <img src="https://file.ontraport.com/media/1fd06d4f065a466296648360d8ff572b.phpja30lr?Expires=4889409535&Signature=GIAfD18I2mBBO52BJTTX37UfBUzoG7jQrWj3OdlLsy0fSPAfHvNz9AmAPdrZ~9yx2GFVFx8xhADn-tbH2s041MWRC05fPrBjxREuExLTGtwuZC5oGt3IDk-fL-PR99-GR~O~Vcls-0ArfMR7ktwHNZhyH02Dow-ewdX9Bu5vhGopBJ4umWsjvvMF6S0G-H2U3V1pYY6K7g-qqg20kZ-VodywACeLsn-0~zm0UK1ep9s0h6r3KpZXCseBGRFQgp0F0jZQ0MCVLbcK2bWPacnq-~RcbTcxVMYlPQDfw-cWAZZjvOJ9e~s3x0v80h6FTNdHURxIXDJ3FkTQhFAG1wEnRw__&Key-Pair-Id=APKAJVAAMVW6XQYWSTNA">
        <div class="text-center text-[#586A80] text-base font-normal font-['Open Sans'] leading-normal">No Submissions available</div>
</div>
{{/if}}
`,
    
    files: `
{{if submissions.length}}
<div class="flex w-full grid xl:grid-cols-3 lg:grid-cols-3 md:grid-cols-2 grid-cols-1 gap-x-[12px] md:gap-y-[24px] gap-y-3">
    {{for submissions}}
    <div class="flex px-2 py-3 bg-white rounded items-center justify-between group hover:bg-[#C7E6E6] transition-all cursor-pointer main_submission_wrapper submissionsWrapper"
@click="
    document.querySelector('.iframeWrapper').classList.remove('hidden');
    document.querySelector('.iframeWrapper').classList.add('flex');
    document.querySelector('.iframeWrapper iframe').src = 'https://courses.writerscentre.com.au/students-submission/{{:Unique_ID}}?Due={{:Formatted_Due_Date}}';
    "
>
    <div class=" flex-col justify-center  items-start gap-2 flex cursor-pointer ">
        <div class="justify-between items-start gap-2 flex">
            <div class="!size-10">
                <div class="w-10 h-10 flex items-center justify-center ">
                    <img class="w-10 h-10 rounded-full object-cover"
                        src="{{: (Contact_Profile_Image && Contact_Profile_Image !== 'https://i.ontraport.com/abc.jpg')
        ? Contact_Profile_Image
        : 'https://file.ontraport.com/media/b0456fe87439430680b173369cc54cea.php03bzcx?Expires=4895186056&Signature=fw-mkSjms67rj5eIsiDF9QfHb4EAe29jfz~yn3XT0--8jLdK4OGkxWBZR9YHSh26ZAp5EHj~6g5CUUncgjztHHKU9c9ymvZYfSbPO9JGht~ZJnr2Gwmp6vsvIpYvE1pEywTeoigeyClFm1dHrS7VakQk9uYac4Sw0suU4MpRGYQPFB6w3HUw-eO5TvaOLabtuSlgdyGRie6Ve0R7kzU76uXDvlhhWGMZ7alNCTdS7txSgUOT8oL9pJP832UsasK4~M~Na0ku1oY-8a7GcvvVv6j7yE0V0COB9OP0FbC8z7eSdZ8r7avFK~f9Wl0SEfS6MkPQR2YwWjr55bbJJhZnZA__&Key-Pair-Id=APKAJVAAMVW6XQYWSTNA'}}" />

                </div></div>
            <div class="flex-col justify-center items-start gap-1 flex">
                <div class="justify-start items-center gap-2 flex">
                    <div class="text-[#414042] text-sm font-semibold font-['Open Sans'] leading-[18px]">{{:Contact_Display_Name || 'Anoynomous'}}</div>
                    {{if formattedTime}} <div class="w-1 h-1 bg-[#BBBCBB] rounded-full"></div>{{/if}}
                    <div class="justify-start items-center gap-1.5 flex">
                        <div class="text-[#586A80] text-xs font-normal font-['Open Sans'] leading-none">{{:formattedTime}}</div>
                    </div>
                </div>
                <div class="justify-start items-center gap-1.5 flex">
                    <svg width="13" height="14" viewBox="0 0 13 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M11.9486 1.35902H10.4101V0.846195C10.4101 0.710186 10.3561 0.579748 10.2599 0.483576C10.1637 0.387403 10.0333 0.333374 9.89727 0.333374C9.76126 0.333374 9.63083 0.387403 9.53465 0.483576C9.43848 0.579748 9.38445 0.710186 9.38445 0.846195V1.35902H4.25625V0.846195C4.25625 0.710186 4.20222 0.579748 4.10605 0.483576C4.00987 0.387403 3.87944 0.333374 3.74343 0.333374C3.60742 0.333374 3.47698 0.387403 3.38081 0.483576C3.28464 0.579748 3.23061 0.710186 3.23061 0.846195V1.35902H1.69214C1.42013 1.35902 1.15925 1.46707 0.966907 1.65942C0.774562 1.85176 0.666504 2.11264 0.666504 2.38466V12.6411C0.666504 12.9131 0.774562 13.174 0.966907 13.3663C1.15925 13.5587 1.42013 13.6667 1.69214 13.6667H11.9486C12.2206 13.6667 12.4814 13.5587 12.6738 13.3663C12.8661 13.174 12.9742 12.9131 12.9742 12.6411V2.38466C12.9742 2.11264 12.8661 1.85176 12.6738 1.65942C12.4814 1.46707 12.2206 1.35902 11.9486 1.35902ZM6.82035 10.077C6.6175 10.077 6.4192 10.0168 6.25054 9.90411C6.08187 9.79141 5.95041 9.63123 5.87278 9.44382C5.79515 9.25641 5.77484 9.05019 5.81442 8.85123C5.85399 8.65228 5.95167 8.46952 6.09511 8.32609C6.23855 8.18265 6.4213 8.08496 6.62026 8.04539C6.81921 8.00582 7.02543 8.02613 7.21285 8.10375C7.40026 8.18138 7.56044 8.31284 7.67314 8.48151C7.78584 8.65017 7.84599 8.84847 7.84599 9.05132C7.84599 9.32334 7.73793 9.58422 7.54559 9.77656C7.35324 9.96891 7.09237 10.077 6.82035 10.077ZM11.9486 4.43594H1.69214V2.38466H3.23061V2.89748C3.23061 3.03349 3.28464 3.16392 3.38081 3.2601C3.47698 3.35627 3.60742 3.4103 3.74343 3.4103C3.87944 3.4103 4.00987 3.35627 4.10605 3.2601C4.20222 3.16392 4.25625 3.03349 4.25625 2.89748V2.38466H9.38445V2.89748C9.38445 3.03349 9.43848 3.16392 9.53465 3.2601C9.63083 3.35627 9.76126 3.4103 9.89727 3.4103C10.0333 3.4103 10.1637 3.35627 10.2599 3.2601C10.3561 3.16392 10.4101 3.03349 10.4101 2.89748V2.38466H11.9486V4.43594Z" fill="#007C8F" />
                    </svg>
                    <div class="text-[#586A80] text-xs font-normal font-['Open Sans'] leading-none">Due by : {{:Formatted_Due_Date}} <span class="text-red-500">{{:Late_Submission}}</span></div>
                </div>

                <div class="justify-start items-center gap-1.5 flex">
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M13.5557 1.33337H2.44461C2.14992 1.33337 1.86731 1.45044 1.65893 1.65881C1.45056 1.86718 1.3335 2.1498 1.3335 2.44449V13.5556C1.3335 13.8503 1.45056 14.1329 1.65893 14.3413C1.86731 14.5496 2.14992 14.6667 2.44461 14.6667H13.5557C13.8504 14.6667 14.133 14.5496 14.3414 14.3413C14.5498 14.1329 14.6668 13.8503 14.6668 13.5556V2.44449C14.6668 2.1498 14.5498 1.86718 14.3414 1.65881C14.133 1.45044 13.8504 1.33337 13.5557 1.33337ZM7.28211 9.50421L5.05989 11.7264C5.00829 11.7781 4.94702 11.8191 4.87957 11.847C4.81213 11.875 4.73984 11.8894 4.66683 11.8894C4.59382 11.8894 4.52153 11.875 4.45408 11.847C4.38664 11.8191 4.32537 11.7781 4.27377 11.7264L3.16266 10.6153C3.05842 10.5111 2.99985 10.3697 2.99985 10.2223C2.99985 10.0748 3.05842 9.93345 3.16266 9.82921C3.26691 9.72496 3.40829 9.6664 3.55572 9.6664C3.70314 9.6664 3.84453 9.72496 3.94877 9.82921L4.66683 10.548L6.496 8.7181C6.60024 8.61385 6.74163 8.55529 6.88905 8.55529C7.03648 8.55529 7.17786 8.61385 7.28211 8.7181C7.38635 8.82234 7.44492 8.96373 7.44492 9.11115C7.44492 9.25858 7.38635 9.39996 7.28211 9.50421ZM7.28211 5.05976L5.05989 7.28199C5.00829 7.33364 4.94702 7.37462 4.87957 7.40257C4.81213 7.43053 4.73984 7.44492 4.66683 7.44492C4.59382 7.44492 4.52153 7.43053 4.45408 7.40257C4.38664 7.37462 4.32537 7.33364 4.27377 7.28199L3.16266 6.17087C3.11105 6.11926 3.0701 6.05798 3.04217 5.99054C3.01423 5.9231 2.99985 5.85082 2.99985 5.77782C2.99985 5.63039 3.05842 5.48901 3.16266 5.38476C3.26691 5.28052 3.40829 5.22195 3.55572 5.22195C3.70314 5.22195 3.84453 5.28052 3.94877 5.38476L4.66683 6.10351L6.496 4.27365C6.60024 4.16941 6.74163 4.11084 6.88905 4.11084C7.03648 4.11084 7.17786 4.16941 7.28211 4.27365C7.38635 4.3779 7.44492 4.51928 7.44492 4.66671C7.44492 4.81413 7.38635 4.95552 7.28211 5.05976ZM12.4446 10.7778H9.11127C8.96393 10.7778 8.82262 10.7193 8.71844 10.6151C8.61425 10.5109 8.55572 10.3696 8.55572 10.2223C8.55572 10.0749 8.61425 9.93361 8.71844 9.82943C8.82262 9.72524 8.96393 9.66671 9.11127 9.66671H12.4446C12.592 9.66671 12.7333 9.72524 12.8374 9.82943C12.9416 9.93361 13.0002 10.0749 13.0002 10.2223C13.0002 10.3696 12.9416 10.5109 12.8374 10.6151C12.7333 10.7193 12.592 10.7778 12.4446 10.7778ZM12.4446 6.33337H9.11127C8.96393 6.33337 8.82262 6.27484 8.71844 6.17066C8.61425 6.06647 8.55572 5.92516 8.55572 5.77782C8.55572 5.63048 8.61425 5.48917 8.71844 5.38498C8.82262 5.28079 8.96393 5.22226 9.11127 5.22226H12.4446C12.592 5.22226 12.7333 5.28079 12.8374 5.38498C12.9416 5.48917 13.0002 5.63048 13.0002 5.77782C13.0002 5.92516 12.9416 6.06647 12.8374 6.17066C12.7333 6.27484 12.592 6.33337 12.4446 6.33337Z" fill="#007C8F" />
                    </svg>
                    <div class="text-dark text-xs font-normal font-['Open Sans'] leading-none">{{:File_Name}} </div>
                </div>
            </div>
        </div>
    </div>
</div>
{{/for}}
</div >
    {{else}}
<div class="flex w-full items-center justify-center flex-col gap-[24px] max-[1100px]:px-[16px] max-[1100px]:pt-[24px] showIfNoSubmissions ">
    <img src="https://file.ontraport.com/media/1fd06d4f065a466296648360d8ff572b.phpja30lr?Expires=4889409535&Signature=GIAfD18I2mBBO52BJTTX37UfBUzoG7jQrWj3OdlLsy0fSPAfHvNz9AmAPdrZ~9yx2GFVFx8xhADn-tbH2s041MWRC05fPrBjxREuExLTGtwuZC5oGt3IDk-fL-PR99-GR~O~Vcls-0ArfMR7ktwHNZhyH02Dow-ewdX9Bu5vhGopBJ4umWsjvvMF6S0G-H2U3V1pYY6K7g-qqg20kZ-VodywACeLsn-0~zm0UK1ep9s0h6r3KpZXCseBGRFQgp0F0jZQ0MCVLbcK2bWPacnq-~RcbTcxVMYlPQDfw-cWAZZjvOJ9e~s3x0v80h6FTNdHURxIXDJ3FkTQhFAG1wEnRw__&Key-Pair-Id=APKAJVAAMVW6XQYWSTNA">
        <div class="text-center text-[#586A80] text-base font-normal font-['Open Sans'] leading-normal">No Submissions available</div>
</div>
{{/if}}
`
  };
async function waitForDueDates() {
    return new Promise(resolve => {
        const checkInterval = setInterval(() => {
            if (dueDates.length > 0) {  
                clearInterval(checkInterval);
                resolve();
            }
        }, 500);
    });
}
 async function renderSubmissions() {
   
     $("#submissionsContainer").html(`
    <div div class="flex items-center gap-4" >
  <div class="w-full rounded-md border border-gray-300 p-4">
    <div class="flex animate-pulse space-x-4">
      <div class="size-10 rounded-full bg-gray-200"></div>
      <div class="flex-1 space-y-6 py-1">
        <div class="h-2 rounded bg-gray-200"></div>
        <div class="space-y-3">
          <div class="grid grid-cols-3 gap-4">
            <div class="col-span-2 h-2 rounded bg-gray-200"></div>
            <div class="col-span-1 h-2 rounded bg-gray-200"></div>
          </div>
          <div class="h-2 rounded bg-gray-200"></div>
        </div>
      </div>
    </div>
  </div>
  <div class="w-full rounded-md border border-gray-300 p-4">
    <div class="flex animate-pulse space-x-4">
      <div class="size-10 rounded-full bg-gray-200"></div>
      <div class="flex-1 space-y-6 py-1">
        <div class="h-2 rounded bg-gray-200"></div>
        <div class="space-y-3">
          <div class="grid grid-cols-3 gap-4">
            <div class="col-span-2 h-2 rounded bg-gray-200"></div>
            <div class="col-span-1 h-2 rounded bg-gray-200"></div>
          </div>
          <div class="h-2 rounded bg-gray-200"></div>
        </div>
      </div>
    </div>
  </div>
  <div class="w-full rounded-md border border-gray-300 p-4">
    <div class="flex animate-pulse space-x-4">
      <div class="size-10 rounded-full bg-gray-200"></div>
      <div class="flex-1 space-y-6 py-1">
        <div class="h-2 rounded bg-gray-200"></div>
        <div class="space-y-3">
          <div class="grid grid-cols-3 gap-4">
            <div class="col-span-2 h-2 rounded bg-gray-200"></div>
            <div class="col-span-1 h-2 rounded bg-gray-200"></div>
          </div>
          <div class="h-2 rounded bg-gray-200"></div>
        </div>
      </div>
    </div>
  </div>
</div>


    `);
   
   
    await waitForDueDates();  
    const submissions = await fetchSubmissions(); 
    allSubmissions = submissions.map(sub => {
        const fileData = extractFileData(sub.File_Upload);
        const dueDateUnix = getDueDateUnix(sub.Assessment_Lesson_ID);
        const submissionDateUnix = sub.Submission_Date_Time;
      const formattedDueDate = dueDateUnix ? formatTime(dueDateUnix) : "No Due Date";

        return {
            ...sub,
            formattedTime: formatTime(sub.Submission_Date_Time),
            File_Link: fileData.link,
            File_Name: fileData.name,
            Due_Date_Unix: dueDateUnix,
           Formatted_Due_Date: formattedDueDate,
            Late_Submission: isLateSubmission(submissionDateUnix, dueDateUnix) ? "(Late Submission)" : ""
        };
    });
    filterAndRender();
}
  function filterAndRender() {
    let filtered = allSubmissions.filter(sub => 
      currentTemplate === "comments" ? sub.AssessmentType === "Comment Submission" : sub.AssessmentType === "File Submission"
    );
    if (searchQuery) {
      filtered = filtered.filter(sub => 
        (sub.Contact_First_Name || "").toLowerCase().includes(searchQuery) ||
		(sub.Submission_Note || "").toLowerCase().includes(searchQuery) ||
        (sub.Contact_Last_Name || "").toLowerCase().includes(searchQuery) ||
        (sub.File_Name || "").toLowerCase().includes(searchQuery)
      );
    }
    filtered.sort((a, b) => {
      return sortOrder === "latest" 
        ? (b.Submission_Date_Time || 0) - (a.Submission_Date_Time || 0)
        : (a.Submission_Date_Time || 0) - (b.Submission_Date_Time || 0);
    });
    
    paginateAndRender(filtered);
  }

  function paginateAndRender(filteredData) {
    const start = (currentPage - 1) * itemsPerPage;
    const paginated = filteredData.slice(start, start + itemsPerPage);

    const compiledTemplate = $.templates(templates[currentTemplate]);
    const htmlOutput = compiledTemplate.render({ submissions: paginated });
    $("#submissionsContainer").html(htmlOutput);

    renderPagination(filteredData.length);
  }

  function renderPagination(totalItems) {
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    if (totalPages <= 1) {
      $("#pagination").html("");
      return;
    }
    let paginationHtml = `<button button id = "prevPage" class="px-3 py-1 ${currentPage === 1 ? 'opacity-50 cursor-not-allowed hidden' : ''}" > Prev</button > `;
    for (let i = 1; i <= totalPages; i++) {
      paginationHtml += `<button button class="pagination-btn ${i === currentPage ? 'px-3 py-1 bg-[#007b8e] rounded text-white' : 'px-3 py-1 rounded bg-transparent'}" data-page="${i}" > ${ i }</button > `;
    }
    paginationHtml += `<button button id = "nextPage" class="px-3 py-1 ${currentPage === totalPages ? 'opacity-50 cursor-not-allowed hidden' : ''}" > Next</button > `;
    $("#pagination").html(paginationHtml);
  }

  $(document).on("click", ".pagination-btn", function() {
    currentPage = parseInt($(this).data("page"));
    filterAndRender();
  });

  $(document).on("click", "#prevPage", function() {
    if (currentPage > 1) {
      currentPage--;
      filterAndRender();
    }
  });

  $(document).on("click", "#nextPage", function() {
    const totalPages = Math.ceil(allSubmissions.length / itemsPerPage);
    if (currentPage < totalPages) {
      currentPage++;
      filterAndRender();
    }
  });

  $("#showComments").on("click", function() {
    currentTemplate = "comments";
    currentPage = 1;
    filterAndRender();
  });

  $("#showFiles").on("click", function() {
    currentTemplate = "files";
    currentPage = 1;
    filterAndRender();
  });

  $("#searchInput").on("input", function() {
    searchQuery = $(this).val().toLowerCase();
    currentPage = 1;
    filterAndRender();
  });

  $("#sortLatest").on("click", function() {
    sortOrder = "latest";
    filterAndRender();
  });

  $("#sortOldest").on("click", function() {
    sortOrder = "oldest";
    filterAndRender();
  });
