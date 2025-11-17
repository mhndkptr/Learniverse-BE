const modulQueryConfig = {
  searchableFields: ["title", "description", "file_name"],
  filterableFields: ["course_id"],
  relations: {
    course: {
      include: {
        moduls: true,
      },
    },
  },
  hasSoftDelete: false,
  omit: {},
};

export default modulQueryConfig;
