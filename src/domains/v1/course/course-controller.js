import {
    getAllCourses,
    getCourseById,
    createCourse,
    updateCourse,
    deleteCourse,
    uploadMaterial,
  } from "./course-service.js";
  
  import { createCourseSchema, updateCourseSchema } from "./course-schema.js";
  
  export const getAll = async (req, res, next) => {
    try {
      const courses = await getAllCourses();
      res.json({ success: true, data: courses });
    } catch (error) {
      next(error);
    }
  };
  
  export const getById = async (req, res, next) => {
    try {
      const { id } = req.params;
      const course = await getCourseById(id);
      if (!course) return res.status(404).json({ success: false, message: "Course not found" });
      res.json({ success: true, data: course });
    } catch (error) {
      next(error);
    }
  };
  
  export const create = async (req, res, next) => {
    try {
      const { error, value } = createCourseSchema.validate(req.body);
      if (error) return res.status(400).json({ success: false, message: error.message });
  
      // Mentor ID diambil dari JWT user yang login
      const mentorId = req.user.id;
  
      const course = await createCourse(value, mentorId);
      res.status(201).json({ success: true, data: course });
    } catch (error) {
      next(error);
    }
  };
  
  export const update = async (req, res, next) => {
    try {
      const { id } = req.params;
      const { error, value } = updateCourseSchema.validate(req.body);
      if (error) return res.status(400).json({ success: false, message: error.message });
  
      const course = await updateCourse(id, value);
      res.json({ success: true, data: course });
    } catch (error) {
      next(error);
    }
  };
  
  export const remove = async (req, res, next) => {
    try {
      const { id } = req.params;
      await deleteCourse(id);
      res.json({ success: true, message: "Course deleted" });
    } catch (error) {
      next(error);
    }
  };
  
  export const upload = async (req, res, next) => {
    try {
      const { id } = req.params;
      if (!req.file) return res.status(400).json({ success: false, message: "No file uploaded" });
  
      const updatedCourse = await uploadMaterial(id, req.file);
      res.json({ success: true, data: updatedCourse });
    } catch (error) {
      next(error);
    }
  };
  