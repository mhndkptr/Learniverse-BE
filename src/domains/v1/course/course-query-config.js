
const courseQueryConfig = {
    searchableFields: ["title", "description", "code"], 
    filterableFields: ["is_open_registration_member", "is_open_registration_mentor"], 
    relations: {
        course_enrollments : {
            include:{
                user : true,
                course : true
            }
        },
        course_transactions : {
            include:{
                user : true,
                course : true
            }
        },
        schedules : {
            include:{
                course : true
            }
        },
        mentors : {
            include:{
                user : true,
                course : true
            }
        },
        moduls : {
            include:{
                course : true
            }
        },
        quizzes : {
            include:{
                course : true,
                quiz_questions : true,
                quiz_attempts : true
            }
        }

    },
    hasSoftDelete: true, 
    omit: {}, 
  };
  
  export default courseQueryConfig;
  