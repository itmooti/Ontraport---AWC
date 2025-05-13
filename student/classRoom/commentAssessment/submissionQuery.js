const FETCH_SUBMISSIONS_COMMENTS_QUERY = `
query calcForumComments($id: AwcSubmissionID) {
calcForumComments(
orderBy: [{ path: ["created_at"], type: asc }]
query: [{ where: { Submissions: [{ where: { id: $id } }] } }]
) {
Comment: field(arg: ["comment"])  
Author_ID: field(arg: ["author_id"]) 
Author_Display_Name: field(arg: ["Author", "display_name"]) 
Author_First_Name: field(arg: ["Author", "first_name"])
Author_Last_Name: field(arg: ["Author", "last_name"])
Author_Profile_Image: field(arg: ["Author", "profile_image"])
Date_Added: field(arg: ["created_at"])
ID: field(arg: ["id"])
Reply_to_Comment_ID: field(arg: ["reply_to_comment_id"])
File: field(arg: ["file"])
}
}
`;

const FETCH_SUBMISSION_VOTERS_QUERY = `
query calcSubmissions($id: AwcSubmissionID) {
calcSubmissions(query: [{ where: { id: $id } }]) {
Voters_DataID: field(arg: ["Voters_Data", "id"])
Voters_Contact_ID: field(arg: ["Voters", "id"])
}
}
`;

const FETCH_STUDENTS_QUERY = `
query calcEnrolments($id: AwcClassID) {
calcEnrolments(
query: [{ where: { Class: [{ where: { id: $id } }] } }]
) {
Student_Display_Name: field(arg: ["Student", "display_name"]) 
Student_First_Name: field(arg: ["Student", "first_name"]) 
Student_Last_Name: field(arg: ["Student", "last_name"]) 
Student_Unique_ID: field(arg: ["Student", "unique_id"]) 
Student_Profile_Image: field(arg: ["Student", "profile_image"]) 
}
}
`;

//Action Queries
const CREATE_VOTE_ON_SUBMISSION_MUTATION_QUERY = `
mutation createOVoterVotedSubmission($payload: OVoterVotedSubmissionCreateInput) {
createOVoterVotedSubmission(payload: $payload) {
voter_id 
voted_submission_id 
}
}
`;

const DELETE_VOTE_ON_SUBMISSION_MUTATION_QUERY = `
mutation deleteOVoterVotedSubmission($id: AwcOVoterVotedSubmissionID) {
deleteOVoterVotedSubmission(
query: [{ where: { id: $id } }]
) {
id 
}
}
`;

const CREATE_COMMENT_MUTATION_QUERY = `
mutation createForumComment($payload: ForumCommentCreateInput) {
createForumComment(payload: $payload) {
comment 
author_id 
reply_to_comment_id 
submissions_id  
file  
Mentions {
unique_id 
}
}
}
`;

const DELETE_COMMENT_MUTATION_QUERY = `
mutation deleteForumComment($id: AwcForumCommentID) {
  deleteForumComment(query: [{ where: { id: $id } }]) {
    id 
  }
}
`;

const FETCH_REPLIES_QUERY = `
query calcForumComments($id: AwcForumCommentID) {
calcForumComments(
orderBy: [{ path: ["created_at"], type: asc }]
query: [{ where: { reply_to_comment_id: $id } }]
) {
ID: field(arg: ["id"])
Comment: field(arg: ["comment"])
Author_ID: field(arg: ["author_id"])  
Author_Display_Name: field(arg: ["Author", "display_name"])  
Author_First_Name: field(arg: ["Author", "first_name"]) 
Author_Last_Name: field(arg: ["Author", "last_name"]) 
Author_Profile_Image: field(arg: ["Author", "profile_image"]) 
Reply_to_Comment_ID: field(arg: ["reply_to_comment_id"]) 
Date_Added: field(arg: ["created_at"]) 
}
}
`;

const FETCH_COMMENTS_VOTERS_QUERY = `
query calcForumComments($id: AwcForumCommentID) {
calcForumComments(query: [{ where: { id: $id } }]) {
Member_Comment_Upvotes_Contact_ID: field(
arg: ["Member_Comment_Upvotes", "id"]
) 
Member_Comment_Upvotes_DataID: field(
arg: ["Member_Comment_Upvotes_Data", "id"]
) 
}
}
`;

const CREATE_VOTE_ON_COMMENT_MUTATION_QUERY = `
mutation createMemberCommentUpvotesForumCommentUpvotes(
$payload: MemberCommentUpvotesForumCommentUpvotesCreateInput = null
) {
createMemberCommentUpvotesForumCommentUpvotes(
payload: $payload
) {
member_comment_upvote_id  
forum_comment_upvote_id  
}
}
`;

const DELETE_VOTE_ON_COMMENT_MUTATION_QUERY = `
mutation deleteMemberCommentUpvotesForumCommentUpvotes(
$id: EduflowproMemberCommentUpvotesForumCommentUpvotesID
) {
deleteMemberCommentUpvotesForumCommentUpvotes(
query: [{ where: { id: $id } }]
) {
id 
}
}
`;

const CREATE_REPLY_ON_COMMENT_MUTATION_QUERY = `
mutation createForumComment($payload: ForumCommentCreateInput) {
createForumComment(payload: $payload) {
id 
comment 
author_id 
reply_to_comment_id 
Author {
first_name  
last_name 
profile_image   
}
Mentions {
unique_id 
}
}
}
`;

function formatDateTimeFromUnix(timestamp) {
    const inputDate = new Date(timestamp * 1000);
    const now = new Date();
    const differenceInSeconds = Math.floor((now - inputDate) / 1000);
    const differenceInMinutes = Math.floor(differenceInSeconds / 60);
    const differenceInHours = Math.floor(differenceInMinutes / 60);
    const differenceInDays = Math.floor(differenceInHours / 24);

    if (differenceInSeconds < 60) return `${differenceInSeconds} seconds ago`;
    if (differenceInMinutes < 60) return `${differenceInMinutes} minutes ago`;
    if (differenceInHours < 24) return `${differenceInHours} hours ago`;
    return `${differenceInDays} days ago`;
}

function decodeAwsParam(awsParam) {
    if (!awsParam) {
        awsParam = window.awsParam;
    }
    const serializedString = atob(awsParam);
    const hashMatch = serializedString.match(/s:\d+:"([a-f0-9]+)"/);
    const expiryMatch = serializedString.match(/i:(\d+)/);
    return {
        hash: hashMatch ? hashMatch[1] : null,
        expiry: expiryMatch ? parseInt(expiryMatch[1], 10) : null,
    };
}

function encodeAwsParam(hash, currentEpoch) {
    if (typeof currentEpoch !== "number") {
        currentEpoch = Math.round(Date.now() / 1000);
    }
    const expiry = new Date(currentEpoch * 1000);
    // I'm only adding 12 hours, rather than 24 hours,
    // to allow the user's system time to be off by
    // +/- 12 hours.
    expiry.setTime(expiry.getTime() + 12 * 60 * 60 * 1000);
    return btoa(
        `a:2:{s:4:"hash";s:${hash.length}:"${hash}";s:6:"expiry";i:${Math.round(
            expiry.getTime() / 1000
        )};}`
    );
}


function createS3FileId(key, filename) {
    return `${key.replace("_${filename}", "")}_${filename}`;
}

function getS3UploadParams(awsParam, url) {
    if (typeof awsParam !== "string") {
        awsParam = window.awsParam;
    }
    if (typeof url !== "string") {
        url = `//${window.location.host}/s/aws`;
    }
    const formData = new FormData();
    formData.append("awsParam", JSON.stringify(awsParam));
    return fetch(url, {
        method: "POST",
        body: formData,
    })
        .then((res) => res.json())
        .then((object) => {
            if (object.code === 0 && object.data) {
                return object.data;
            }
            return null;
        });
}

function uploadFiles(filesToUpload, s3Params, toSubmit) {
    const paramsInputs = s3Params.inputs;
    const method = s3Params.attributes.method;
    const action = s3Params.attributes.action;
    const uploadPromises = filesToUpload.map(({ file, fieldName }) => {
        return new Promise((resolve) => {
            let s3FormData = new FormData();

            // Append all required S3 fields
            for (const key in paramsInputs) {
                s3FormData.append(key, paramsInputs[key]);
            }
            // Append the actual file
            s3FormData.append("Content-Type", file.type);
            s3FormData.append("file", file, file.name);

            let xhr = new XMLHttpRequest();
            xhr.open(method, action);

            xhr.onloadend = function () {
                if (xhr.status === 204) {
                    let s3Id = createS3FileId(paramsInputs.key, file.name);
                    const result = {
                        name: file.name,
                        type: file.type,
                        s3_id: s3Id,
                    };
                    if (toSubmit && fieldName) {
                        toSubmit[fieldName] = JSON.stringify(result);
                    }
                    resolve(result);
                } else {
                    resolve(null);
                }
            };

            xhr.send(s3FormData);
        });
    });

    return Promise.all(uploadPromises);
}

function processFileFields(toSubmit, filesToUpload, awsParamHash, awsParamUrl) {
    let awsParam;
    if (!awsParamHash) {
        awsParam = window.awsParam;
    } else if (typeof awsParamHash === "string") {
        awsParam = encodeAwsParam(awsParamHash);
    }

    return getS3UploadParams(awsParam, awsParamUrl).then((s3Params) => {
        if (!s3Params) {
            const e = new Error("Failed to retrieve s3Params.");
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
            if (error) {
                throw error;
            }
            return toSubmit;
        });
    });
}
