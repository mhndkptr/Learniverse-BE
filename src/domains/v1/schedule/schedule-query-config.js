const scheduleQueryConfig = {
    searchableFields: ["title", "description"],
    filterableFields: ["course_id"],
    relations: {
      course: true,
    },
    hasSoftDelete: false,
    omit: {},
  };
  
  export default scheduleQueryConfig;
  